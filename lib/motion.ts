/**
 * "go" is the single switch that starts entrance animations.
 * It is off while the intro or a page transition curtain is covering the screen,
 * and turns on the moment the curtain starts to open.
 */
const root = () => document.documentElement;

export function setGo(on: boolean) {
  const d = root();
  if (on) {
    d.dataset.go = "1";
    d.dataset.ready = "1";
    window.dispatchEvent(new Event("app:go"));
  } else {
    delete d.dataset.go;
  }
}

/** Run cb as soon as entrance animations are allowed. Returns a cleanup function. */
export function whenGo(cb: () => void): () => void {
  if (root().dataset.go) {
    cb();
    return () => {};
  }
  let done = false;
  const run = () => {
    if (done) return;
    done = true;
    window.removeEventListener("app:go", run);
    clearTimeout(t);
    cb();
  };
  window.addEventListener("app:go", run);
  // Safety net so content can never stay hidden.
  const t = window.setTimeout(run, 7000);
  return () => {
    done = true;
    window.removeEventListener("app:go", run);
    clearTimeout(t);
  };
}
