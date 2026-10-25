import fs from "node:fs";
import path from "node:path";
import {
  FORM_BACKGROUND_FILENAME,
  getFormBackgroundPublicPath,
} from "@/lib/form-background";

export function getFormBackgroundSrc(): string {
  const publicPath = getFormBackgroundPublicPath();
  const filePath = path.join(process.cwd(), "public", FORM_BACKGROUND_FILENAME);

  try {
    const { mtimeMs } = fs.statSync(filePath);
    return `${publicPath}?v=${mtimeMs}`;
  } catch {
    return publicPath;
  }
}
