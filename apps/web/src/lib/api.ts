'use client';

// Cliente HTTP com access/refresh token e renovação automática.
const TOKEN_KEY = 'elshaday.accessToken';
const REFRESH_KEY = 'elshaday.refreshToken';

export function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function tryRefresh(): Promise<boolean> {
  const refreshToken = localStorage.getItem(REFRESH_KEY);
  if (!refreshToken) return false;
  const res = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) {
    clearTokens();
    return false;
  }
  const data = await res.json();
  setTokens(data.accessToken, data.refreshToken);
  return true;
}

const WAKING_MESSAGE =
  'O servidor está acordando (leva até 1 minuto no plano gratuito). Tentando de novo...';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function api<T = unknown>(
  path: string,
  options: RequestInit = {},
  retry = true,
  wakeRetries = 3,
): Promise<T> {
  const token = getToken();
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    // rede caiu ou proxy indisponível
    if (wakeRetries > 0) {
      await sleep(8_000);
      return api<T>(path, options, retry, wakeRetries - 1);
    }
    throw new ApiError(0, 'Sem conexão com o servidor. Verifique sua internet.');
  }

  // 502/503/504 = API hibernada no plano gratuito, acordando.
  // Repete algumas vezes antes de desistir.
  if ([502, 503, 504].includes(res.status)) {
    if (wakeRetries > 0) {
      await sleep(10_000);
      return api<T>(path, options, retry, wakeRetries - 1);
    }
    throw new ApiError(res.status, WAKING_MESSAGE);
  }

  if (res.status === 401 && retry && (await tryRefresh())) {
    return api<T>(path, options, false, wakeRetries);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message = Array.isArray(body.message)
      ? body.message.join(', ')
      : (body.message ?? 'Algo deu errado. Tente novamente em instantes.');
    throw new ApiError(res.status, message);
  }

  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

export const post = <T = unknown>(path: string, body?: unknown) =>
  api<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined });

export const patch = <T = unknown>(path: string, body?: unknown) =>
  api<T>(path, { method: 'PATCH', body: JSON.stringify(body) });
