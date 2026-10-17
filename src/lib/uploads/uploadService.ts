import { UploadRejectedError } from "./errors";
import { uploadToS3ByKey } from "@/lib/s3";
import type { UploadedFileResult, UploadFileOptions } from "./types";
import { validateUploadFile } from "./validators";

function resolveUploadFolder(options: UploadFileOptions): "vehicles" | "documents" | "users" {
  const candidate = options.folderHint?.trim().toLowerCase();
  if (candidate === "vehicles" || candidate === "documents" || candidate === "users") {
    return candidate;
  }

  return "documents";
}

function keyFromPublicUrl(publicUrl: string): string {
  const marker = ".amazonaws.com/";
  const markerIndex = publicUrl.indexOf(marker);
  if (markerIndex === -1) {
    return publicUrl;
  }

  return publicUrl.slice(markerIndex + marker.length);
}

function sanitizeBookingFolderKey(value: string | undefined): string {
  if (!value) {
    return "unassigned";
  }

  const normalized = value
    .trim()
    .replace(/[/\\]+/g, "-")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "unassigned";
}

function categoryDocumentFolder(category: UploadFileOptions["category"]): string {
  switch (category) {
    case "customer_license":
    case "additional_driver_license":
      return "license-documents";
    case "customer_passport":
    case "additional_driver_passport":
      return "id-documents";
    case "payment_proof":
      return "payment-proof";
    default:
      return "documents";
  }
}

export async function uploadFile(
  file: File | null | undefined,
  options: UploadFileOptions,
): Promise<UploadedFileResult> {
  const validation = validateUploadFile(file);
  if (!validation.ok) {
    throw new UploadRejectedError(validation.message, validation.status);
  }

  if (!(file instanceof File)) {
    throw new UploadRejectedError("No file uploaded", 400);
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(await file.arrayBuffer());
  } catch {
    throw new UploadRejectedError("Unable to read uploaded file", 400);
  }

  if (buffer.length !== validation.file.size) {
    throw new UploadRejectedError("Uploaded file size mismatch", 400);
  }

  const folder = resolveUploadFolder(options);
  const bookingKey = sanitizeBookingFolderKey(options.bookingTempRef);
  const objectKey = [
    folder,
    "bookings",
    bookingKey,
    categoryDocumentFolder(options.category),
    `${crypto.randomUUID()}-${validation.file.originalName}`,
  ].join("/");
  let publicUrl: string;
  try {
    publicUrl = await uploadToS3ByKey(file, objectKey);
  } catch (error) {
    if (error instanceof Error && error.message.includes("Missing required environment variable")) {
      throw new UploadRejectedError("Upload service is not configured", 500);
    }

    throw new Error("S3 upload failed", { cause: error });
  }

  const relativePath = keyFromPublicUrl(publicUrl);
  const fileName = relativePath.split("/").at(-1) || validation.file.originalName;

  return {
    category: options.category,
    originalName: validation.file.originalName,
    mimeType: validation.file.mimeType,
    size: validation.file.size,
    fileName,
    relativePath,
    publicUrl,
  };
}
