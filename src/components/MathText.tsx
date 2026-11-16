import katex from "katex";
import { useMemo } from "react";
export function MathText({
  value,
  block = false,
}: {
  value: string;
  block?: boolean;
}) {
  const html = useMemo(
    () =>
      katex.renderToString(value, {
        displayMode: block,
        throwOnError: false,
        trust: false,
        strict: "ignore",
        output: "htmlAndMathml",
      }),
    [value, block],
  );
  return (
    <span
      className={block ? "math-formula" : "math-inline"}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
