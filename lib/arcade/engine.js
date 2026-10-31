import 'server-only';
import { auth } from '@clerk/nextjs/server';
import { GAME_MODES, ARCADE_GAMES, normalizeAnswer } from './definitions';
import { buildChallenge, getDailyChallengeDate } from './catalog';
import { getOrCreateProfile } from '../profiles';
import { getSupabaseAdmin } from '../supabase-admin';

const GAME_KEYS = new Set(ARCADE_GAMES.map((game) => game.key));
const MAX_ANSWER_LENGTH = 100;

function getPublicQuestion(gameKey, state) {
  const index = state.currentIndex;
  const item = state.questions[index];
  if (!item) return null;

  if (gameKey === 'guess-movie') {
    return {
      type: gameKey,
      number: index + 1,
      total: state.questions.length,
      posterUrl: `https://image.tmdb.org/t/p/w500${item.posterPath}`,
      hintsUsed: state.hintsUsed,
      maxHints: item.hints.length,
    };
  }
  if (gameKey === 'trivia') {
    return {
      type: gameKey,
      number: index + 1,
      total: state.questions.length,
      prompt: item.prompt,
      category: item.category,
      choices: item.choices,
    };
  }
  if (gameKey === 'emoji') {
    return {
      type: gameKey,
      number: index + 1,
      total: state.questions.length,
      emojis: item.prompt,
    };
  }
  if (gameKey === 'higher-lower') {
    const metric = item.metric;
    return {
      type: gameKey,
      number: index + 1,
      total: state.questions.length,
      metric,
      metricLabel: metric === 'rating' ? 'TMDB rating' : 'popularity',
      left: {
        title: item.left.title,
        posterUrl: `https://image.tmdb.org/t/p/w342${item.left.posterPath}`,
        value: item.left[metric],
      },
      right: {
        title: item.right.title,
        posterUrl: `https://image.tmdb.org/t/p/w342${item.right.posterPath}`,
      },
    };
  }
  if (gameKey === 'movie-wordle') {
    return {
      type: gameKey,
      number: 1,
      total: 1,
      length: 5,
      maxAttempts: 5,
      guesses: item.guesses || [],
    };
  }
  return null;
}

async function optionalUserId() {
  if (!process.env.CLERK_SECRET_KEY || !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) return null;
  const { userId } = await auth();
  return userId || null;
}

async function ensureArcadeProfile(db, userId) {
  await getOrCreateProfile(userId);
  const { error } = await db
    .from('arcade_profiles')
    .upsert({ clerk_user_id: userId }, { onConflict: 'clerk_user_id', ignoreDuplicates: true });
  if (error) throw error;
}

async function getChallenge(db, gameKey, mode, dailyDate) {
  if (mode !== 'daily') {
    return buildChallenge(gameKey, mode, `${Date.now()}-${Math.random()}`);
  }

  const existing = await db
    .from('arcade_daily_challenges')
    .select('challenge_payload')
    .eq('challenge_date', dailyDate)
    .eq('game_key', gameKey)
    .maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data) return existing.data.challenge_payload;

  const payload = await buildChallenge(gameKey, mode, `${dailyDate}-${gameKey}-v1`);
  const inserted = await db
    .from('arcade_daily_challenges')
    .insert({ challenge_date: dailyDate, game_key: gameKey, challenge_payload: payload })
    .select('challenge_payload')
    .single();
  if (!inserted.error) return inserted.data.challenge_payload;
  if (inserted.error.code !== '23505') throw inserted.error;

  const raced = await db
    .from('arcade_daily_challenges')
    .select('challenge_payload')
    .eq('challenge_date', dailyDate)
    .eq('game_key', gameKey)
    .single();
  if (raced.error) throw raced.error;
  return raced.data.challenge_payload;
}

function buildInitialState(questions, mode) {
  return {
    questions: questions.map((question) => ({ ...question })),
    mode,
    currentIndex: 0,
    score: 0,
    correctAnswers: 0,
    answered: 0,
    hintsUsed: 0,
    finishedReason: '',
  };
}

function feedbackForGuess(guess, answer) {
  const result = Array(5).fill('absent');
  const remaining = answer.split('');
  for (let index = 0; index < guess.length; index += 1) {
    if (guess[index] === answer[index]) {
      result[index] = 'correct';
      remaining[index] = '';
    }
  }
  for (let index = 0; index < guess.length; index += 1) {
    if (result[index] === 'correct') continue;
    const match = remaining.indexOf(guess[index]);
    if (match !== -1) {
      result[index] = 'present';
      remaining[match] = '';
    }
  }
  return result;
}

function getCompletionTotals(gameKey, state) {
  if (gameKey === 'movie-wordle') {
    return {
      score: state.score,
      correctAnswers: state.correctAnswers,
      totalQuestions: 1,
    };
  }
  return {
    score: state.score,
    correctAnswers: state.correctAnswers,
    totalQuestions: state.answered,
  };
}

async function saveState(db, session, state, status, now = new Date()) {
  const totals = getCompletionTotals(session.game_key, state);
  const update = {
    game_state: state,
    state_version: session.state_version + 1,
    status,
    score: totals.score,
    correct_answers: totals.correctAnswers,
    total_questions: totals.totalQuestions,
  };
  if (status === 'completed') update.completed_at = now.toISOString();

  const { data, error } = await db
    .from('arcade_game_sessions')
    .update(update)
    .eq('id', session.id)
    .eq('state_version', session.state_version)
    .eq('status', 'active')
    .select('id')
    .maybeSingle();
  if (error) throw error;
  if (!data) return false;
  return true;
}

async function awardProgression(db, session, totals) {
  if (!session.clerk_user_id) {
    const xpEarned = 10
      + Math.min(totals.correctAnswers * 5, 250)
      + (totals.totalQuestions > 0 && totals.correctAnswers === totals.totalQuestions ? 15 : 0)
      + (session.mode === 'daily' ? 15 : 0);
    const { error } = await db
      .from('arcade_game_sessions')
      .delete()
      .eq('id', session.id)
      .is('clerk_user_id', null);
    if (error) throw error;
    return { xpEarned, guest: true };
  }

  const { data, error } = await db.rpc('record_arcade_completion', { p_session_id: session.id });
  if (error) {
    console.error('Failed to record Arcade progression:', error);
    throw new Error('Skor tersimpan, tetapi progression gagal diperbarui. Coba muat ulang statistik.');
  }
  return data;
}

function completionResponse(state, progression) {
  return {
    done: true,
    result: {
      score: state.score,
      correctAnswers: state.correctAnswers,
      totalQuestions: state.questions.length === 1 && state.mode !== 'endless'
        ? 1
        : state.answered,
      reason: state.finishedReason || 'complete',
    },
    progression,
  };
}

function requireValidGame(gameKey, mode) {
  return GAME_KEYS.has(gameKey)
    && Object.hasOwn(GAME_MODES[gameKey], mode);
}

export async function startGame(body) {
  const gameKey = typeof body.game === 'string' ? body.game : '';
  const mode = typeof body.mode === 'string' ? body.mode : '';
  if (!requireValidGame(gameKey, mode)) {
    return Response.json({ error: 'Game atau mode tidak valid.' }, { status: 400 });
  }

  try {
    const db = getSupabaseAdmin();
    const userId = await optionalUserId();
    if (userId) await ensureArcadeProfile(db, userId);

    const dailyDate = mode === 'daily' ? getDailyChallengeDate() : null;
    if (userId && dailyDate) {
      const completed = await db
        .from('arcade_daily_completions')
        .select('session_id')
        .eq('clerk_user_id', userId)
        .eq('challenge_date', dailyDate)
        .eq('game_key', gameKey)
        .maybeSingle();
      if (completed.error) throw completed.error;
      if (completed.data) {
        return Response.json({ error: 'Tantangan harian ini sudah kamu selesaikan hari ini.' }, { status: 409 });
      }
    }

    const questions = await getChallenge(db, gameKey, mode, dailyDate);
    const state = buildInitialState(questions, mode);
    const created = await db
      .from('arcade_game_sessions')
      .insert({
        clerk_user_id: userId,
        game_key: gameKey,
        mode,
        game_state: state,
        daily_challenge_date: dailyDate,
      })
      .select('id')
      .single();
    if (created.error) throw created.error;

    return Response.json({
      sessionId: created.data.id,
      mode,
      question: getPublicQuestion(gameKey, state),
      guest: !userId,
    });
  } catch (error) {
    console.error('Failed to start Arcade game:', error);
    return Response.json({ error: error.message || 'Game gagal dimulai.' }, { status: 503 });
  }
}

export async function playGame(body) {
  const sessionId = typeof body.sessionId === 'string' ? body.sessionId : '';
  const action = body.action;
  if (!/^[0-9a-f-]{36}$/i.test(sessionId)) {
    return Response.json({ error: 'Sesi game tidak valid.' }, { status: 400 });
  }
  if (!['answer', 'hint', 'finish'].includes(action)) {
    return Response.json({ error: 'Aksi game tidak valid.' }, { status: 400 });
  }

  try {
    const db = getSupabaseAdmin();
    const userId = await optionalUserId();
    const query = await db
      .from('arcade_game_sessions')
      .select('id, clerk_user_id, game_key, mode, game_state, state_version, status, started_at')
      .eq('id', sessionId)
      .maybeSingle();
    if (query.error) throw query.error;
    const session = query.data;
    if (!session) return Response.json({ error: 'Sesi game tidak ditemukan.' }, { status: 404 });
    if (session.clerk_user_id && session.clerk_user_id !== userId) {
      return Response.json({ error: 'Sesi ini milik akun lain.' }, { status: 403 });
    }
    if (session.status !== 'active') {
      return Response.json({ error: 'Game ini sudah selesai.' }, { status: 409 });
    }

    const state = structuredClone(session.game_state);
    const gameKey = session.game_key;
    const item = state.questions[state.currentIndex];
    if (!item) return Response.json({ error: 'Pertanyaan tidak ditemukan.' }, { status: 409 });

    if (action === 'hint') {
      if (gameKey !== 'guess-movie' || state.hintsUsed >= item.hints.length) {
        return Response.json({ error: 'Petunjuk tidak tersedia.' }, { status: 400 });
      }
      const hint = item.hints[state.hintsUsed];
      state.hintsUsed += 1;
      if (!await saveState(db, session, state, 'active')) {
        return Response.json({ error: 'Aksi lain baru saja diproses. Coba lagi.' }, { status: 409 });
      }
      return Response.json({
        done: false,
        hint,
        question: getPublicQuestion(gameKey, state),
      });
    }

    const elapsedSeconds = Math.floor((Date.now() - new Date(session.started_at).getTime()) / 1000);
    if (session.mode === 'timed' && action === 'answer' && elapsedSeconds > 62) {
      state.finishedReason = 'time';
      const saved = await saveState(db, session, state, 'completed');
      if (!saved) return Response.json({ error: 'Aksi lain baru saja diproses. Coba lagi.' }, { status: 409 });
      const progression = await awardProgression(db, session, getCompletionTotals(gameKey, state));
      return Response.json(completionResponse(state, progression));
    }

    if (action === 'finish') {
      const canStop = ['endless', 'high-score'].includes(session.mode)
        || (session.mode === 'timed' && elapsedSeconds >= 55);
      if (!canStop || state.answered < 1) {
        return Response.json({ error: 'Game belum bisa diselesaikan sekarang.' }, { status: 400 });
      }
      state.finishedReason = session.mode === 'timed' ? 'time' : 'stopped';
    } else if (gameKey === 'trivia') {
      const selectedIndex = body.answer;
      if (!Number.isInteger(selectedIndex) || selectedIndex < 0 || selectedIndex >= item.choices.length) {
        return Response.json({ error: 'Pilih jawaban yang tersedia.' }, { status: 400 });
      }
      const correct = item.choices[selectedIndex] === item.answer;
      state.answered += 1;
      if (correct) {
        state.correctAnswers += 1;
        state.score += 100;
      }
      state.currentIndex += 1;
      const endlessMiss = session.mode === 'endless' && !correct;
      const done = endlessMiss || state.currentIndex >= state.questions.length;
      if (done) state.finishedReason = endlessMiss ? 'wrong-answer' : 'complete';
      const saved = await saveState(db, session, state, done ? 'completed' : 'active');
      if (!saved) return Response.json({ error: 'Aksi lain baru saja diproses. Coba lagi.' }, { status: 409 });
      const progression = done
        ? await awardProgression(db, session, getCompletionTotals(gameKey, state))
        : null;
      return Response.json({
        correct,
        answer: item.answer,
        explanation: item.explanation,
        question: done ? null : getPublicQuestion(gameKey, state),
        ...(done ? completionResponse(state, progression) : { done: false }),
      });
    } else if (gameKey === 'movie-wordle') {
      const guess = typeof body.answer === 'string' ? body.answer.trim().toUpperCase() : '';
      if (!/^[A-Z]{5}$/.test(guess)) {
        return Response.json({ error: 'Masukkan tepat lima huruf A-Z.' }, { status: 400 });
      }
      const feedback = feedbackForGuess(guess, item.answer);
      item.guesses = [...(item.guesses || []), { word: guess, feedback }];
      state.answered = item.guesses.length;
      const won = guess === item.answer;
      const lost = !won && item.guesses.length >= 5;
      if (won) {
        state.correctAnswers = 1;
        state.score = Math.max(100, 500 - (item.guesses.length - 1) * 100);
      }
      const done = won || lost;
      if (done) state.finishedReason = won ? 'won' : 'out-of-guesses';
      const saved = await saveState(db, session, state, done ? 'completed' : 'active');
      if (!saved) return Response.json({ error: 'Aksi lain baru saja diproses. Coba lagi.' }, { status: 409 });
      const progression = done
        ? await awardProgression(db, session, getCompletionTotals(gameKey, state))
        : null;
      return Response.json({
        correct: won,
        feedback,
        answer: done ? item.answer : null,
        explanation: done ? item.explanation : null,
        question: done ? null : getPublicQuestion(gameKey, state),
        ...(done ? completionResponse(state, progression) : { done: false }),
      });
    } else if (gameKey === 'higher-lower') {
      const selected = body.answer;
      if (!['higher', 'lower'].includes(selected)) {
        return Response.json({ error: 'Pilih salah satu film.' }, { status: 400 });
      }
      const leftValue = Number(item.left[item.metric]);
      const rightValue = Number(item.right[item.metric]);
      const correct = (rightValue > leftValue && selected === 'higher')
        || (leftValue > rightValue && selected === 'lower')
        || (leftValue === rightValue);
      state.answered += 1;
      if (correct) {
        state.correctAnswers += 1;
        state.score += 100;
      }
      state.currentIndex += 1;
      const done = !correct || state.currentIndex >= state.questions.length;
      if (done) state.finishedReason = correct ? 'complete' : 'wrong-answer';
      const saved = await saveState(db, session, state, done ? 'completed' : 'active');
      if (!saved) return Response.json({ error: 'Aksi lain baru saja diproses. Coba lagi.' }, { status: 409 });
      const progression = done
        ? await awardProgression(db, session, getCompletionTotals(gameKey, state))
        : null;
      return Response.json({
        correct,
        answer: {
          left: leftValue,
          right: rightValue,
          metric: item.metric,
          leftTitle: item.left.title,
          rightTitle: item.right.title,
        },
        question: done ? null : getPublicQuestion(gameKey, state),
        ...(done ? completionResponse(state, progression) : { done: false }),
      });
    } else {
      const submitted = typeof body.answer === 'string' ? body.answer.trim() : '';
      if (!submitted || submitted.length > MAX_ANSWER_LENGTH) {
        return Response.json({ error: 'Jawaban harus diisi dengan maksimal 100 karakter.' }, { status: 400 });
      }
      const correct = normalizeAnswer(submitted) === normalizeAnswer(item.answer);
      state.answered += 1;
      if (correct) {
        state.correctAnswers += 1;
        state.score += gameKey === 'guess-movie'
          ? Math.max(25, 100 - state.hintsUsed * 25)
          : 100;
      }
      state.currentIndex += 1;
      state.hintsUsed = 0;
      const endlessMiss = session.mode === 'endless' && !correct;
      const done = endlessMiss || state.currentIndex >= state.questions.length;
      if (done) state.finishedReason = endlessMiss ? 'wrong-answer' : 'complete';
      const saved = await saveState(db, session, state, done ? 'completed' : 'active');
      if (!saved) return Response.json({ error: 'Aksi lain baru saja diproses. Coba lagi.' }, { status: 409 });
      const progression = done
        ? await awardProgression(db, session, getCompletionTotals(gameKey, state))
        : null;
      return Response.json({
        correct,
        answer: item.answer,
        explanation: item.explanation,
        question: done ? null : getPublicQuestion(gameKey, state),
        ...(done ? completionResponse(state, progression) : { done: false }),
      });
    }

    state.finishedReason ||= 'stopped';
    const saved = await saveState(db, session, state, 'completed');
    if (!saved) return Response.json({ error: 'Aksi lain baru saja diproses. Coba lagi.' }, { status: 409 });
    const progression = await awardProgression(db, session, getCompletionTotals(gameKey, state));
    return Response.json(completionResponse(state, progression));
  } catch (error) {
    console.error('Failed to process Arcade game action:', error);
    return Response.json({ error: error.message || 'Game gagal diproses.' }, { status: 500 });
  }
}

export async function getArcadeOverview() {
  const db = getSupabaseAdmin();
  const userId = await optionalUserId();
  if (!userId) return { guest: true, profile: null, recentGames: [], achievements: [], dailyCompletions: [] };
  await ensureArcadeProfile(db, userId);

  const [profile, recent, achievements, daily] = await Promise.all([
    db.from('arcade_profiles')
    .select('xp, level, current_streak, best_streak, games_played, wins, correct_answers, questions_answered')
      .eq('clerk_user_id', userId)
      .single(),
    db.from('arcade_scores')
      .select('game_key, mode, score, correct_answers, total_questions, xp_earned, created_at')
      .eq('clerk_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5),
    db.from('arcade_achievements')
      .select('achievement_key, earned_at')
      .eq('clerk_user_id', userId)
      .order('earned_at', { ascending: false }),
    db.from('arcade_daily_completions')
      .select('game_key')
      .eq('clerk_user_id', userId)
      .eq('challenge_date', getDailyChallengeDate()),
  ]);
  if (profile.error) throw profile.error;
  if (recent.error) throw recent.error;
  if (achievements.error) throw achievements.error;
  if (daily.error) throw daily.error;
  return {
    guest: false,
    profile: profile.data,
    recentGames: recent.data,
    achievements: achievements.data,
    dailyCompletions: daily.data.map((item) => item.game_key),
  };
}

export async function getLeaderboard(period) {
  if (!['weekly', 'all-time'].includes(period)) {
    return Response.json({ error: 'Periode leaderboard tidak valid.' }, { status: 400 });
  }
  try {
    const db = getSupabaseAdmin();
    const now = new Date();
    const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
    if (period === 'weekly') {
      const { data, error } = await db.rpc('arcade_weekly_leaderboard', {
        p_since: monday.toISOString(),
      });
      if (error) throw error;
      const leaderboard = data.map((player, index) => ({
        rank: index + 1,
        username: player.username,
        displayName: player.display_name || player.username,
        xp: Number(player.xp),
        level: player.level,
        gamesPlayed: player.games_played,
        currentStreak: player.current_streak,
      }));
      return Response.json(
        { period, entries: leaderboard },
        { headers: { 'Cache-Control': 'public, max-age=30, stale-while-revalidate=120' } },
      );
    }

    const entries = await db.from('arcade_profiles')
      .select('clerk_user_id, xp, level, current_streak, games_played')
      .gt('xp', 0)
      .order('xp', { ascending: false })
      .order('clerk_user_id', { ascending: true })
      .limit(50);
    if (entries.error) throw entries.error;

    const rows = entries.data || [];
    const ids = rows.map((row) => row.clerk_user_id);
    if (ids.length === 0) {
      return Response.json(
        { period, entries: [] },
        { headers: { 'Cache-Control': 'public, max-age=30, stale-while-revalidate=120' } },
      );
    }

    const profiles = await db.from('profiles')
      .select('clerk_user_id, username, display_name')
      .in('clerk_user_id', ids);
    if (profiles.error) throw profiles.error;
    const names = new Map((profiles.data || []).map((profile) => [profile.clerk_user_id, profile]));
    const leaderboard = rows
      .filter((row) => names.has(row.clerk_user_id))
      .map((row, index) => {
        const profile = names.get(row.clerk_user_id);
        return {
          rank: index + 1,
          username: profile.username,
          displayName: profile.display_name || profile.username,
          xp: Number(row.xp),
          level: row.level,
          gamesPlayed: row.games_played,
          currentStreak: row.current_streak,
        };
      });
    return Response.json(
      { period, entries: leaderboard },
      { headers: { 'Cache-Control': 'public, max-age=30, stale-while-revalidate=120' } },
    );
  } catch (error) {
    console.error('Failed to load Arcade leaderboard:', error);
    return Response.json({ error: 'Leaderboard gagal dimuat.' }, { status: 503 });
  }
}

export async function getArcadeStats() {
  const headers = { 'Cache-Control': 'private, no-store' };
  try {
    const db = getSupabaseAdmin();
    const userId = await optionalUserId();
    if (!userId) return Response.json({ guest: true, profile: null, scores: [], achievements: [] }, { headers });
    await ensureArcadeProfile(db, userId);

    const [profile, scores, gameStats, achievements] = await Promise.all([
      db.from('arcade_profiles')
        .select('xp, level, current_streak, best_streak, games_played, wins, correct_answers, questions_answered')
        .eq('clerk_user_id', userId)
        .single(),
      db.from('arcade_scores')
        .select('game_key, mode, score, correct_answers, total_questions, xp_earned, created_at')
        .eq('clerk_user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50),
      db.from('arcade_game_stats')
        .select('game_key, games_played, wins, high_score, score_total, correct_answers, questions_answered')
        .eq('clerk_user_id', userId),
      db.from('arcade_achievements')
        .select('achievement_key, earned_at')
        .eq('clerk_user_id', userId)
        .order('earned_at', { ascending: false }),
    ]);
    if (profile.error) throw profile.error;
    if (scores.error) throw scores.error;
    if (gameStats.error) throw gameStats.error;
    if (achievements.error) throw achievements.error;
    return Response.json({
      guest: false,
      profile: profile.data,
      scores: scores.data,
      gameStats: gameStats.data,
      achievements: achievements.data,
    }, { headers });
  } catch (error) {
    console.error('Failed to load Arcade statistics:', error);
    return Response.json({ error: 'Statistik gagal dimuat.' }, { status: 503, headers });
  }
}
