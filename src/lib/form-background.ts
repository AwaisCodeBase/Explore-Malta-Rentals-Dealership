export const FORM_BACKGROUND_FILENAME = "form background 2.png";

export function getFormBackgroundPublicPath(): string {
  return `/${encodeURIComponent(FORM_BACKGROUND_FILENAME)}`;
}
