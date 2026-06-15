let _baseUrl = 'http://localhost:8787';

export function initApiClient(baseUrl: string) {
  _baseUrl = baseUrl;
}

const getBaseUrl = () => _baseUrl;

export type ErrorType<T = unknown> = T;

export async function customFetch<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const baseUrl = getBaseUrl();
  const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;

  const response = await fetch(fullUrl, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: response.statusText }));
    const error = new Error((body as { error?: string }).error ?? `HTTP ${response.status}`);
    (error as Error & { status: number }).status = response.status;
    throw error;
  }

  const text = await response.text();
  return text ? (JSON.parse(text) as T) : (undefined as T);
}
