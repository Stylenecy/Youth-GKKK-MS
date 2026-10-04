import type { CSSProperties, ReactNode } from "react";

export interface Word {
  text: string;
  /** Extra classes for this word (e.g. the italic accent). */
  className?: string;
  /** Attach to the previous word with no space (punctuation after an accent). */
  tight?: boolean;
}

/**
 * Server-side character split for the hero headline.
 *
 * Elsye's title rises letter by letter out of a mask (ref E01). Doing the
 * split here instead of in SplitText means the animation is plain CSS and
 * starts at first paint, before any JavaScript has loaded. Each character
 * gets its index as `--i`; the line's start time is `--d` on the line.
 *
 * Screen readers get the sentence once, from `label`; the split copy is
 * aria-hidden so it is not spelled out letter by letter.
 */
export default function SplitChars({
  lines,
  label,
}: {
  lines: { words: Word[]; delay: number }[];
  label: string;
}): ReactNode {
  return (
    <>
      <span className="sr-only">{label}</span>
      <span aria-hidden="true">
        {lines.map((line, li) => {
          let i = 0;
          return (
            <span
              key={li}
              className="lp-line"
              style={{ "--d": `${line.delay}s` } as CSSProperties}
            >
              <span>
                {line.words.map((w, wi) => (
                  <span key={wi}>
                    <span className={`lp-word ${w.className ?? ""}`}>
                      {Array.from(w.text).map((ch, ci) => (
                        <span
                          key={ci}
                          className="lp-char"
                          style={{ "--i": i++ } as CSSProperties}
                        >
                          {ch}
                        </span>
                      ))}
                    </span>
                    {wi < line.words.length - 1 && !line.words[wi + 1].tight ? " " : null}
                  </span>
                ))}
              </span>
            </span>
          );
        })}
      </span>
    </>
  );
}
