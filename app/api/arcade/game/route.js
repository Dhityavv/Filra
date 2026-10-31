import { playGame, startGame } from '../../../../lib/arcade/engine';

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Body permintaan harus berupa JSON.' }, { status: 400 });
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return Response.json({ error: 'Body permintaan tidak valid.' }, { status: 400 });
  }
  if (body.action === 'start') return startGame(body);
  return playGame(body);
}
