/** Serial room refreshes. A returning tab wakes immediately without overlapping requests. */
export function createRoomPoller(
  read: (signal: AbortSignal) => Promise<void>,
  onError: (error: unknown) => void,
  {intervalMs = 750, timeoutMs = 10_000} = {},
) {
  let stopped = false;
  let running = false;
  let queued = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let request: AbortController | undefined;

  async function refresh() {
    if (stopped) return;
    clearTimeout(timer);
    if (running) { queued = true; return; }
    running = true;
    const controller = new AbortController();
    request = controller;
    const deadline = setTimeout(() => controller.abort(), timeoutMs);
    try {
      await read(controller.signal);
    } catch (error) {
      if (!stopped) onError(error);
    } finally {
      clearTimeout(deadline);
      running = false;
      request = undefined;
      if (!stopped) {
        const delay = queued ? 0 : intervalMs;
        queued = false;
        timer = setTimeout(refresh, delay);
      }
    }
  }

  return {
    wake: () => { void refresh(); },
    stop: () => {
      stopped = true;
      queued = false;
      clearTimeout(timer);
      request?.abort();
    },
  };
}
