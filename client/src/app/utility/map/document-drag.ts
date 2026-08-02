/**
 * Document-level mouse drag listeners (outside Angular's zone when registered there).
 * Prefer these over MapLibre canvas-only listeners so drags survive Zone.js.
 *
 * @returns cancel function that removes both listeners
 */
export function startDocumentDrag(handlers: {
  onMove: (event: MouseEvent) => void;
  onUp: () => void;
}): () => void {
  const onMove = (event: MouseEvent) => handlers.onMove(event);
  const onUp = () => {
    cancel();
    handlers.onUp();
  };
  window.addEventListener('mousemove', onMove, { passive: true });
  window.addEventListener('mouseup', onUp);
  const cancel = () => {
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
  };
  return cancel;
}
