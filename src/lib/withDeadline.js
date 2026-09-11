export class TimeoutError extends Error {
  constructor(label, timeoutMs) {
    super(`${label}: tiempo de espera excedido (${timeoutMs} ms)`);
    this.name = 'TimeoutError';
    this.code = 'OPERATION_TIMEOUT';
  }
}

function abortReason(signal) {
  return signal?.reason instanceof Error
    ? signal.reason
    : new DOMException('Operación cancelada', 'AbortError');
}

/**
 * Executes an async work function with a strict timeout deadline.
 * If the work doesn't settle before timeoutMs, rejects with TimeoutError and aborts internal signal.
 */
export function withDeadline(
  work,
  {
    timeoutMs = 7000,
    signal = null,
    label = 'Operación',
  } = {}
) {
  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    let settled = false;
    let timer = null;

    function cleanup() {
      if (timer) clearTimeout(timer);
      if (signal) signal.removeEventListener('abort', onParentAbort);
    }

    function settle(callback, value) {
      if (settled) return;
      settled = true;
      cleanup();
      callback(value);
    }

    function fail(error) {
      if (settled) return;
      settle(reject, error);
      controller.abort(error);
    }

    function onParentAbort() {
      fail(abortReason(signal));
    }

    if (signal?.aborted) {
      fail(abortReason(signal));
      return;
    }

    if (signal) {
      signal.addEventListener('abort', onParentAbort, { once: true });
    }

    timer = setTimeout(() => {
      fail(new TimeoutError(label, timeoutMs));
    }, timeoutMs);

    Promise.resolve()
      .then(() => {
        if (controller.signal.aborted) {
          throw abortReason(controller.signal);
        }
        return work(controller.signal);
      })
      .then(
        value => settle(resolve, value),
        error => settle(reject, error)
      );
  });
}
