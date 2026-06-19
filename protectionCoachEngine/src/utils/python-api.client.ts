import { env } from '../config/env';

export class PythonApiError extends Error {
  statusCode: number;
  body?: string;
  isOperational = true;

  constructor(message: string, statusCode: number, body?: string) {
    super(message);
    this.name = 'PythonApiError';
    this.statusCode = statusCode;
    this.body = body;
  }
}

function buildUrl(baseUrl: string, endpoint: string): string {
  const normalizedBase = baseUrl.replace(/\/$/, '');
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${normalizedBase}${normalizedEndpoint}`;
}

export async function callPythonApi<TResponse>(
  endpoint: string,
  payload?: unknown,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'POST'
): Promise<TResponse> {
  const url = buildUrl(env.PYTHON_API_BASE_URL, endpoint);

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: method === 'GET' ? undefined : JSON.stringify(payload ?? {}),
  });

  const text = await response.text();

  if (!response.ok) {
    throw new PythonApiError(
      `Python API request failed: ${response.status} ${response.statusText}`,
      response.status,
      text
    );
  }

  return JSON.parse(text) as TResponse;
}
