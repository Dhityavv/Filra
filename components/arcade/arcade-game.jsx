'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ARCADE_GAMES, GAME_MODES } from '../../lib/arcade/definitions';

async function postGame(payload) {
  const response = await fetch('/api/arcade/game', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Game tidak dapat diproses.');
  return data;
}

function Feedback({ toast }) {
  if (!toast) return null;
  return (
    <div className={`arcade-feedback ${toast.correct ? 'is-correct' : 'is-wrong'}`} role="status">
      <strong>{toast.correct ? 'Nice read.' : 'Not quite.'}</strong>
      {toast.answer ? <span>Jawaban: {toast.answer}</span> : null}
      {toast.explanation ? <small>{toast.explanation}</small> : null}
      {toast.values ? <small>{toast.values}</small> : null}
    </div>
  );
}

function WordleGrid({ question, draft }) {
  const guesses = question.guesses || [];
  return (
    <div className="arcade-wordle-grid" aria-label="Movie Wordle board">
      {Array.from({ length: question.maxAttempts }, (_, row) => {
        const guess = guesses[row];
        const letters = guess?.word || (row === guesses.length ? draft.toUpperCase() : '');
        return (
          <div className="arcade-wordle-row" key={row}>
            {Array.from({ length: question.length }, (_, column) => (
              <span className={`arcade-wordle-cell ${guess ? `tile-${guess.feedback[column]}` : ''}`} key={column}>
                {letters[column] || ''}
              </span>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function ResultPanel({ result, game, onAgain, mode }) {
  const perfect = result.totalQuestions > 0 && result.correctAnswers === result.totalQuestions;
  return (
    <section className="arcade-result-panel">
      <span className="arcade-eyebrow">{perfect ? 'PERFECT TAKE' : 'ROUND COMPLETE'}</span>
      <h2>{perfect ? 'Flawless.' : "That's a wrap."}</h2>
      {typeof result.answer === 'string' ? <p className="arcade-result-answer">Jawaban film: <strong>{result.answer}</strong></p> : null}
      {result.explanation ? <p className="arcade-result-explanation">{result.explanation}</p> : null}
      {result.lastResolution ? <p className="arcade-result-explanation">{result.lastResolution}</p> : null}
      {result.reason === 'wrong-answer' ? <p className="arcade-result-explanation">Streak berakhir di ronde ini. Coba lagi untuk melewati skor terbaikmu.</p> : null}
      {result.reason === 'time' ? <p className="arcade-result-explanation">Waktu habis. Setiap jawaban yang benar tetap dihitung.</p> : null}
      <div className="arcade-result-numbers">
        <div><strong>{result.score.toLocaleString()}</strong><span>Score</span></div>
        <div><strong>{result.correctAnswers}/{result.totalQuestions}</strong><span>Correct</span></div>
        <div><strong>{result.progression?.xpEarned ?? 0}</strong><span>XP earned</span></div>
      </div>
      {result.progression?.guest ? (
        <p className="arcade-result-note">XP sesi tamu tidak disimpan. Masuk untuk mengumpulkan progression permanen.</p>
      ) : result.progression ? (
        <p className="arcade-result-note">Level {result.progression.level} · {Number(result.progression.xp).toLocaleString()} XP total</p>
      ) : null}
      <div className="arcade-result-actions">
        <button className="arcade-primary-button" onClick={onAgain} type="button">{mode === 'daily' ? 'Try another mode' : 'Play again'}</button>
        <a className="arcade-outline-button" href="/arcade">Back to arcade</a>
      </div>
      <span className="arcade-result-game">{game.title} / {GAME_MODES[game.key][mode].label}</span>
    </section>
  );
}

export default function ArcadeGame({ gameKey, initialMode = '' }) {
  const game = ARCADE_GAMES.find((item) => item.key === gameKey);
  const modes = GAME_MODES[gameKey] || {};
  const firstMode = Object.keys(modes)[0];
  const [mode, setMode] = useState(initialMode && modes[initialMode] ? initialMode : firstMode);
  const [session, setSession] = useState(null);
  const [result, setResult] = useState(null);
  const [answer, setAnswer] = useState('');
  const [notice, setNotice] = useState('');
  const [toast, setToast] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [remaining, setRemaining] = useState(60);
  const startedAt = useRef(0);
  const timerSubmitted = useRef(false);

  const handleFinish = useCallback(async (fromTimer = false) => {
    if (!session || busy) return;
    setBusy(true);
    setError('');
    try {
      const data = await postGame({ action: 'finish', sessionId: session.id });
      setSession(null);
      setResult(data.result ? { ...data.result, progression: data.progression } : null);
      setNotice(fromTimer ? 'Waktu habis.' : '');
    } catch (requestError) {
      setError(requestError.message);
      if (fromTimer) timerSubmitted.current = false;
    } finally {
      setBusy(false);
    }
  }, [session, busy]);

  useEffect(() => {
    if (!session || session.mode !== 'timed' || result) return undefined;
    const timer = window.setInterval(() => {
      const next = Math.max(0, 60 - Math.floor((Date.now() - startedAt.current) / 1000));
      setRemaining(next);
      if (next === 0 && !timerSubmitted.current && !busy) {
        timerSubmitted.current = true;
        handleFinish(true);
      }
    }, 250);
    return () => window.clearInterval(timer);
  }, [session, result, busy, handleFinish]);

  if (!game) return null;

  async function beginGame() {
    setBusy(true);
    setError('');
    setToast(null);
    setNotice('');
    setResult(null);
    setAnswer('');
    timerSubmitted.current = false;
    try {
      const data = await postGame({ action: 'start', game: gameKey, mode });
      setSession({ id: data.sessionId, mode: data.mode, question: data.question, guest: data.guest });
      startedAt.current = Date.now();
      setRemaining(60);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function sendAction(action, submittedAnswer) {
    if (!session || busy) return;
    setBusy(true);
    setError('');
    setToast(null);
    try {
      const data = await postGame({
        action,
        sessionId: session.id,
        ...(submittedAnswer === undefined ? {} : { answer: submittedAnswer }),
      });
      if (data.done) {
        setSession(null);
        setResult({
          ...data.result,
          progression: data.progression,
          answer: typeof data.answer === 'string' ? data.answer : null,
          explanation: data.explanation,
          lastResolution: data.answer && typeof data.answer === 'object'
            ? `${data.answer.leftTitle}: ${data.answer.left} · ${data.answer.rightTitle}: ${data.answer.right} (${data.answer.metric})`
            : '',
        });
        setToast(null);
      } else {
        setSession((current) => ({ ...current, question: data.question }));
        setToast(action === 'hint'
          ? null
          : {
            correct: Boolean(data.correct),
            answer: typeof data.answer === 'string' && gameKey !== 'movie-wordle' ? data.answer : '',
            explanation: data.explanation,
            values: data.answer && typeof data.answer === 'object'
              ? `${data.answer.leftTitle}: ${data.answer.left} · ${data.answer.rightTitle}: ${data.answer.right} (${data.answer.metric})`
              : '',
          });
      }
      if (action === 'hint') setNotice(data.hint);
      else {
        setNotice('');
        setAnswer('');
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  function submitText(event) {
    event.preventDefault();
    if (!answer.trim()) return;
    sendAction('answer', answer);
  }

  function replay() {
    if (mode === 'daily') {
      const practiceMode = { 'guess-movie': 'normal', trivia: 'ten', emoji: 'five', 'movie-wordle': 'practice' }[gameKey];
      setMode(practiceMode);
      setResult(null);
      setToast(null);
      setError('');
      return;
    }
    beginGame();
  }

  return (
    <div className="arcade-game-page">
      <div className="arcade-game-heading">
        <a href="/arcade" className="arcade-back-link">← Arcade</a>
        <span className="arcade-eyebrow">{game.category} / GAME {game.icon}</span>
        <h1>{game.title}</h1>
        <p>{game.description}</p>
      </div>

      {result ? (
        <ResultPanel result={result} game={game} mode={mode} onAgain={replay} />
      ) : session ? (
        <section className="arcade-play-panel">
          <div className="arcade-play-topline">
            <span>{GAME_MODES[gameKey][session.mode].label}</span>
            {session.mode === 'timed'
              ? <strong className={remaining <= 10 ? 'time-critical' : ''}>{remaining}s</strong>
              : <strong>{session.question.number || 1} / {session.question.total || 1}</strong>}
          </div>
          {session.question.total > 1 ? (
            <div className="arcade-round-track"><span style={{ width: `${((session.question.number - 1) / session.question.total) * 100}%` }} /></div>
          ) : null}

          {gameKey === 'guess-movie' ? (
            <div className="arcade-guess-layout">
              <div className="arcade-masked-poster-wrap">
                <Image
                  src={session.question.posterUrl}
                  alt="Poster film yang disamarkan"
                  className="arcade-masked-poster"
                  fill
                  sizes="(max-width: 620px) 68vw, 270px"
                  unoptimized
                  style={{ filter: `blur(${Math.max(3, 16 - session.question.hintsUsed * 4)}px)` }}
                />
                <span>IDENTIFY THE FILM</span>
              </div>
              <div className="arcade-game-prompt">
                <span className="arcade-eyebrow">WHICH MOVIE IS THIS?</span>
                <h2>Read the frame.</h2>
                <form className="arcade-answer-form" onSubmit={submitText}>
                  <input aria-label="Judul film" autoComplete="off" maxLength="100" onChange={(event) => setAnswer(event.target.value)} placeholder="Ketik judul film..." value={answer} />
                  <button disabled={busy || !answer.trim()} type="submit">{busy ? '...' : 'Guess'}</button>
                </form>
                <button className="arcade-text-button" disabled={busy || session.question.hintsUsed >= session.question.maxHints} onClick={() => sendAction('hint')} type="button">
                  Reveal a hint · −25 points
                </button>
                {notice ? <p className="arcade-hint-note">{notice}</p> : null}
              </div>
            </div>
          ) : null}

          {gameKey === 'trivia' ? (
            <div className="arcade-question-block">
              <span className="arcade-eyebrow">{session.question.category}</span>
              <h2>{session.question.prompt}</h2>
              <div className="arcade-choice-grid">
                {session.question.choices.map((choice, index) => (
                  <button className="arcade-choice-button" disabled={busy} key={choice} onClick={() => sendAction('answer', index)} type="button">
                    <span>{String.fromCharCode(65 + index)}</span>{choice}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {gameKey === 'emoji' ? (
            <div className="arcade-question-block arcade-emoji-block">
              <span className="arcade-eyebrow">DECODE THE MOVIE</span>
              <div className="arcade-emoji-clue" aria-label="Emoji clues">{session.question.emojis}</div>
              <form className="arcade-answer-form" onSubmit={submitText}>
                <input aria-label="Judul film dari emoji" autoComplete="off" maxLength="100" onChange={(event) => setAnswer(event.target.value)} placeholder="Film apa ini?" value={answer} />
                <button disabled={busy || !answer.trim()} type="submit">{busy ? '...' : 'Submit'}</button>
              </form>
            </div>
          ) : null}

          {gameKey === 'higher-lower' ? (
            <div className="arcade-higher-layout">
              {[session.question.left, session.question.right].map((movie, index) => (
                <div className="arcade-higher-card" key={`${movie.title}-${index}`}>
                  <Image src={movie.posterUrl} alt={`Poster ${movie.title}`} width={185} height={278} sizes="(max-width: 620px) 42vw, 185px" unoptimized />
                  <div className="arcade-higher-movie-name">{movie.title}</div>
                  {index === 0 ? <div className="arcade-known-value">{Number(movie.value).toFixed(1)} <small>{session.question.metricLabel}</small></div> : null}
                </div>
              ))}
              <p className="arcade-higher-question">Will the second film have a higher {session.question.metricLabel}?</p>
              <div className="arcade-higher-actions">
                <button disabled={busy} onClick={() => sendAction('answer', 'higher')} type="button">Higher</button>
                <button disabled={busy} onClick={() => sendAction('answer', 'lower')} type="button">Lower</button>
              </div>
            </div>
          ) : null}

          {gameKey === 'movie-wordle' ? (
            <div className="arcade-wordle-block">
              <span className="arcade-eyebrow">A FIVE-LETTER FILM TITLE</span>
              <p>Hijau: huruf dan posisi tepat. Amber: huruf ada, posisi berbeda.</p>
              <WordleGrid question={session.question} draft={answer} />
              <form className="arcade-answer-form arcade-wordle-form" onSubmit={submitText}>
                <input aria-label="Tebakan lima huruf" autoComplete="off" maxLength="5" onChange={(event) => setAnswer(event.target.value.replace(/[^a-z]/gi, '').slice(0, 5))} placeholder="LIMA HURUF" value={answer} />
                <button disabled={busy || answer.length !== 5} type="submit">{busy ? '...' : 'Enter'}</button>
              </form>
            </div>
          ) : null}

          <Feedback toast={toast} />
          {['endless', 'high-score'].includes(session.mode) ? (
            <button className="arcade-text-button arcade-stop-button" disabled={busy} onClick={() => handleFinish(false)} type="button">Finish this run</button>
          ) : null}
          {error ? <p className="arcade-error" role="alert">{error}</p> : null}
        </section>
      ) : (
        <section className="arcade-mode-panel">
          <span className="arcade-eyebrow">SELECT YOUR MODE</span>
          <h2>How do you want to play?</h2>
          <div className="arcade-mode-grid">
            {Object.entries(modes).map(([key, item]) => (
              <button className={`arcade-mode-option ${mode === key ? 'is-selected' : ''}`} key={key} onClick={() => setMode(key)} type="button">
                <span>{item.label}</span>
                <small>{key === 'daily' ? 'One daily run · bonus XP' : key === 'timed' ? '5 films · 60 seconds' : key === 'practice' ? 'Practice without limits' : `${item.questions} rounds`}</small>
              </button>
            ))}
          </div>
          <div className="arcade-mode-note">
            <span>XP is calculated and validated by the server.</span>
            <span>Daily challenges reset at 00:00 UTC.</span>
          </div>
          {error ? <p className="arcade-error" role="alert">{error}</p> : null}
          <button className="arcade-primary-button arcade-start-button" disabled={busy} onClick={beginGame} type="button">
            {busy ? 'Preparing game...' : 'Start playing'} <span aria-hidden="true">→</span>
          </button>
        </section>
      )}
    </div>
  );
}
