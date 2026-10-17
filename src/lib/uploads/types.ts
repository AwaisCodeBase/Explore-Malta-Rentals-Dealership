export const UPLOAD_CATEGORIES = [
  "customer_license",
  "customer_passport",
  "additional_driver_license",
  "additional_driver_passport",
  "payment_proof",
] as const;

export type UploadCategory = (typeof UPLOAD_CATEGORIES)[number];

export type UploadedFileResult = {
  category: UploadCategory;
  originalName: string;
  mimeType: string;
  size: number;
  fileName: string;
  relativePath: string;
  publicUrl: string;
};

export type UploadFileOptions = {
  category: UploadCategory;
  /** Optional stable folder key for grouping uploads before booking save */
  bookingTempRef?: string | undefined;
  /** Alternative to bookingTempRef; same sanitization rules */
  folderHint?: string | undefined;
};

export type UploadSuccessResponse = {
  success: true;
  file: UploadedFileResult;
};

export type UploadErrorResponse = {
  success: false;
  message: string;
};

export type UploadApiResponse = UploadSuccessResponse | UploadErrorResponse;
