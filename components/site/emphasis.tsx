type Segment = { text: string; em: boolean };

/** Split "I craft *memorable* brands" into plain and emphasised segments. */
export function parseEmphasis(text: string): Segment[] {
  return text
    .split(/(\*[^*]+\*)/g)
    .filter(Boolean)
    .map((part) =>
      part.startsWith("*") && part.endsWith("*")
        ? { text: part.slice(1, -1), em: true }
        : { text: part, em: false },
    );
}

/**
 * Words for per-word animation. A word can mix styles — in "*remember*." the
 * period stays attached to the emphasised word instead of floating after a space.
 */
export function splitWords(text: string): Segment[][] {
  const words: Segment[][] = [];
  let joinNext = false;
  for (const seg of parseEmphasis(text)) {
    const tokens = seg.text.split(/(\s+)/).filter(Boolean);
    for (const token of tokens) {
      if (/^\s+$/.test(token)) {
        joinNext = false;
        continue;
      }
      if (joinNext && words.length > 0) words[words.length - 1].push({ text: token, em: seg.em });
      else words.push([{ text: token, em: seg.em }]);
      joinNext = true;
    }
  }
  return words;
}

/** Renders `*word*` markup as serif italic accent text. */
export function Emphasis({ text }: { text: string }) {
  return (
    <>
      {parseEmphasis(text).map((seg, i) =>
        seg.em ? (
          <span key={i} className="em-serif">
            {seg.text}
          </span>
        ) : (
          seg.text
        ),
      )}
    </>
  );
}

export function WordPieces({ pieces }: { pieces: Segment[] }) {
  return (
    <>
      {pieces.map((p, i) =>
        p.em ? (
          <span key={i} className="em-serif pr-[0.04em]">
            {p.text}
          </span>
        ) : (
          p.text
        ),
      )}
    </>
  );
}
