/** Split homepage closing CTA title into two editorial headline lines. */
export function splitQuickCtaTitle(title: string): readonly [string, string] {
  const trimmed = title.trim();

  if (trimmed.includes("\n")) {
    const [line1, ...rest] = trimmed.split("\n");
    const line2 = rest.join("\n").trim();
    if (line1.trim() && line2) return [line1.trim(), line2];
  }

  for (const separator of [" — ", " – ", " - ", ", "]) {
    const index = trimmed.indexOf(separator);
    if (index === -1) continue;

    const line1 = trimmed.slice(0, index + (separator === ", " ? separator.length : 0)).trim();
    const line2 = trimmed.slice(index + separator.length).trim();
    if (line1 && line2) return [line1, line2];
  }

  const words = trimmed.split(/\s+/);
  if (words.length <= 2) return [trimmed, ""];

  const midpoint = Math.ceil(words.length / 2);
  return [words.slice(0, midpoint).join(" "), words.slice(midpoint).join(" ")];
}

/** Split description into muted body and closing emphasis line. */
export function splitQuickCtaDescription(description: string): {
  muted: string;
  close: string;
} {
  const trimmed = description.trim();
  const lastSentenceBreak = trimmed.lastIndexOf(". ");

  if (lastSentenceBreak !== -1 && lastSentenceBreak < trimmed.length - 8) {
    return {
      muted: trimmed.slice(0, lastSentenceBreak + 1).trim(),
      close: trimmed.slice(lastSentenceBreak + 2).trim(),
    };
  }

  return { muted: trimmed, close: "" };
}
