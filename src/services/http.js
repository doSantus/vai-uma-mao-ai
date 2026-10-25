// Timeout também vale para as requisições HTTPS realizadas pelo SDK do Supabase.
export function createTimeoutFetch(fetcher, timeoutMs = 20000) {
  return async (url, options = {}) => {
    const controller = new AbortController();
    const abort = () => controller.abort();
    if (options.signal?.aborted) abort();
    options.signal?.addEventListener('abort', abort);
    const timer = setTimeout(abort, timeoutMs);
    try { return await fetcher(url, { ...options, signal: controller.signal }); }
    finally { clearTimeout(timer); options.signal?.removeEventListener('abort', abort); }
  };
}
