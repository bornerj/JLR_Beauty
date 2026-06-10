import { useEffect } from "react";

type BodyAttributes = {
  className?: string;
  id?: string;
};

export function useBodyAttributes({ className, id }: BodyAttributes) {
  useEffect(() => {
    const previousClass = document.body.className;
    const previousId = document.body.id;

    if (className !== undefined) {
      document.body.className = className;
    }
    if (id !== undefined) {
      document.body.id = id;
    }

    return () => {
      document.body.className = previousClass;
      document.body.id = previousId;
    };
  }, [className, id]);
}
