import type { ReactElement, ReactNode } from "react";
import { isSegmented, STYLE_CLASS_MAP, type PageTextValue } from "../../modules/public-site/pageTexts";

type RichTextContext = { fullName?: string };

type RichTextProps = {
  value: PageTextValue;
  context?: RichTextContext;
  className?: string;
};

const applyContext = (text: string, context?: RichTextContext): string => {
  if (!context?.fullName) return text;
  return text.replace(/\{fullName\}/g, context.fullName);
};

export const RichText = ({ value, context, className }: RichTextProps): ReactElement => {
  if (isSegmented(value)) {
    const children: ReactNode[] = value.map((segment, index) => {
      const resolved = applyContext(segment.text, context);
      const cls = STYLE_CLASS_MAP[segment.style];
      if (!cls) return resolved;
      return (
        <span className={cls} key={index}>
          {resolved}
        </span>
      );
    });
    return className ? <span className={className}>{children}</span> : <>{children}</>;
  }

  const resolved = applyContext(value, context);
  return className ? <span className={className}>{resolved}</span> : <>{resolved}</>;
};
