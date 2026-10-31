export async function readJsonObject(request) {
  try {
    const body = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return { error: Response.json({ error: 'Body permintaan tidak valid.' }, { status: 400 }) };
    }
    return { body };
  } catch {
    return { error: Response.json({ error: 'Body harus berupa JSON yang valid.' }, { status: 400 }) };
  }
}
