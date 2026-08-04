type ApiCallerOptions = RequestInit & {
  baseUrl: string;
};

function joinUrl(baseUrl: string, path: string) {
  return `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

export async function apiCaller<T>(path: string, { baseUrl, ...init }: ApiCallerOptions): Promise<T> {
  const response = await fetch(joinUrl(baseUrl, path), {
    ...init,
    headers: {
      ...(init.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(init.headers ?? {}),
    },
  });
  const contentType = response.headers.get('content-type') ?? '';
  const body = contentType.includes('application/json') ? await response.json() as unknown : await response.text();

  if (!response.ok) {
    throw new Error(apiErrorMessage(body) ?? `Request failed with status ${response.status}`);
  }

  return body as T;
}

export function apiErrorMessage(body: unknown): string | null {
  if (typeof body === 'string') return body || null;
  if (!body || typeof body !== 'object') return null;
  const data = body as Record<string, unknown>;
  const message = data.message ?? data.error ?? data.errorMessage;
  return typeof message === 'string' ? message : null;
}
