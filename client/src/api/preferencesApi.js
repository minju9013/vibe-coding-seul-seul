const API_BASE = '/api';

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function parseJsonOrThrow(res) {
  let body;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  if (!res.ok) {
    const message = body?.message || `요청 실패 (${res.status})`;
    throw new ApiError(message, res.status);
  }
  return body;
}

export async function getPreferences() {
  const res = await fetch(`${API_BASE}/preferences`);
  return parseJsonOrThrow(res);
}

export async function putPreferences(payload) {
  const res = await fetch(`${API_BASE}/preferences`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseJsonOrThrow(res);
}
