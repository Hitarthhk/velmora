type Playback = {
  stop: () => void;
  then: (resolve: () => void, reject?: () => void) => Promise<void>;
};

type Options = {
  start: () => Playback;
  finishVisuals: () => void;
  onComplete: () => void;
  timeoutMs: number;
  viewport?: Window;
  visibility?: Document;
};

/** Completion is independent of Motion's promise. All exit paths settle to
 * the same visible hero and release the gate exactly once. */
export function playHimalayanDive({
  start, finishVisuals, onComplete, timeoutMs,
  viewport = window, visibility = document,
}: Options) {
  let controls: Playback | undefined;
  let disposed = false;
  let finished = false;
  const initialWidth = viewport.innerWidth;
  const orientation = viewport.screen.orientation;
  const deadline = viewport.performance.now() + timeoutMs;
  let timer: number | undefined;

  const removeListeners = () => {
    if (timer !== undefined) viewport.clearTimeout(timer);
    viewport.removeEventListener("resize", resize);
    orientation?.removeEventListener("change", finish);
    visibility.removeEventListener("visibilitychange", visibilityChanged);
  };
  const stop = () => {
    // A failed playback implementation must never prevent gate completion.
    try { controls?.stop(); } catch { /* settle the page independently */ }
  };
  const finish = () => {
    if (disposed || finished) return;
    finished = true;
    removeListeners();
    stop();
    try { finishVisuals(); } finally { onComplete(); }
  };
  const resize = () => {
    // Mobile browser chrome changes height without changing composition width.
    if (Math.abs(viewport.innerWidth - initialWidth) > 1) finish();
  };
  const visibilityChanged = () => {
    if (visibility.visibilityState === "hidden" || viewport.performance.now() >= deadline) finish();
  };

  timer = viewport.setTimeout(finish, timeoutMs);
  viewport.addEventListener("resize", resize);
  orientation?.addEventListener("change", finish);
  visibility.addEventListener("visibilitychange", visibilityChanged);
  try {
    if (visibility.visibilityState === "hidden") {
      finish();
    } else {
      controls = start();
      void controls.then(finish, finish).catch(finish);
    }
  } catch {
    finish();
  }

  return () => {
    disposed = true;
    removeListeners();
    if (!finished) stop();
  };
}
