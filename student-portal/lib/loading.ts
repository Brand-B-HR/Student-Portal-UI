/**
 * Global in-flight request tracker behind the loading overlay.
 *
 * A plain module rather than React context, so the API client — which isn't a
 * component — can report without anything being threaded through props.
 * Components read it with useSyncExternalStore.
 *
 * It counts requests rather than holding a boolean: with a flag, three
 * overlapping calls would clear the indicator as soon as the *first* one
 * finished. The overlay lifts only when the last request settles.
 */

/** Wait this long before showing. Most calls finish first, so the overlay
 *  never appears for them — without this every fast action flashes a blocker. */
const SHOW_DELAY_MS = 180;

let inFlight = 0;
let visible = false;
let timer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function setVisible(next: boolean) {
  if (visible === next) return;
  visible = next;
  emit();
}

export function subscribeLoading(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Snapshot for useSyncExternalStore — already debounced by SHOW_DELAY_MS. */
export function getLoadingVisible(): boolean {
  return visible;
}

/**
 * Runs `request` with the overlay showing.
 *
 * Pass `silent` for calls that already have their own feedback, or that must
 * not block: optimistic toggles, button-level "Posting…" states, and anything
 * long-running or polled. A blocking overlay on a 60-second poll would freeze
 * the app.
 */
export async function tracked<T>(request: () => Promise<T>, silent = false): Promise<T> {
  if (silent) return request();

  inFlight++;
  if (inFlight === 1 && timer === null) {
    timer = setTimeout(() => {
      timer = null;
      // Re-check: everything may have settled inside the delay.
      if (inFlight > 0) setVisible(true);
    }, SHOW_DELAY_MS);
  }

  try {
    return await request();
  } finally {
    inFlight--;
    if (inFlight === 0) {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      setVisible(false);
    }
  }
}
