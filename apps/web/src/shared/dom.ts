export type Cleanup = () => void;

export function on(
  target: EventTarget | null,
  eventName: string,
  handler: EventListenerOrEventListenerObject
): Cleanup {
  if (!target) return () => {};
  target.addEventListener(eventName, handler);
  return () => target.removeEventListener(eventName, handler);
}

export function onAll(
  targets: Iterable<Element> | null,
  eventName: string,
  handler: EventListenerOrEventListenerObject
): Cleanup {
  if (!targets) return () => {};
  const cleanups: Cleanup[] = [];
  for (const target of targets) {
    cleanups.push(on(target, eventName, handler));
  }
  return () => cleanups.forEach((cleanup) => cleanup());
}
