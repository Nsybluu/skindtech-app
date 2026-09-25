/**
 * A fake network for the service tests. Importing this module replaces the global `fetch`:
 * every request is recorded in `requests` and answered by `fake.handler`, so no test ever
 * reaches a real backend. Each test file runs in its own process, so the replacement is isolated.
 */

const BASE = 'http://api.test';

export type Handler = (url: string, init: RequestInit) => Promise<Response> | Response;

export type RecordedRequest = {
  path: string;
  method: string;
  headers: Headers;
  body: unknown;
  form?: FormData;
};

export const fake: { handler: Handler } = {
  handler: () => {
    throw new Error('no handler');
  },
};

export const requests: RecordedRequest[] = [];

(globalThis as { fetch: unknown }).fetch = async (url: string, init: RequestInit = {}) => {
  requests.push({
    path: url.replace(BASE, ''),
    method: init.method ?? 'GET',
    headers: new Headers(init.headers),
    body: typeof init.body === 'string' ? JSON.parse(init.body) : undefined,
    ...(init.body instanceof FormData ? { form: init.body } : {}),
  });
  return fake.handler(url, init);
};

export const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
export const noContent = () => new Response(null, { status: 204 });
export const failure = (status: number, code: string) => json(status, { status: 'failed', error: { code } });
export const paths = () => requests.map((request) => request.path);
export const resetRequests = () => {
  requests.length = 0;
};

export function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/** Lets already-resolved promises (and their `.then` callbacks) run. */
export const tick = () => new Promise((resolve) => setImmediate(resolve));
