import { useEffect, useState } from "react";

export const usePortalTarget = (selector: string): Element | null => {
  const [target, setTarget] = useState<Element | null>(() => {
    if (typeof document === "undefined") return null;
    return document.querySelector(selector);
  });

  useEffect(() => {
    if (typeof document === "undefined") return;

    const currentTarget = document.querySelector(selector);
    if (currentTarget) {
      if (currentTarget !== target) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setTarget(currentTarget);
      }
      return;
    }
    if (target) return;

    const observer = new MutationObserver(() => {
      const nextTarget = document.querySelector(selector);
      if (!nextTarget) return;
      setTarget(nextTarget);
      observer.disconnect();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, [selector, target]);

  return target;
};
