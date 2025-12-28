import { decodeBase64 } from "./decoder/decodeBase64.js";

export const getEmailBody = (payload: any): string | null => {
  // Case 1: Simple body
  if (payload.body?.data) {
    return decodeBase64(payload.body.data);
  }

  // Case 2: Multipart
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        return decodeBase64(part.body.data);
      }
    }

    // fallback to HTML if plain text not found
    for (const part of payload.parts) {
      if (part.mimeType === "text/html" && part.body?.data) {
        return decodeBase64(part.body.data);
      }
    }
  }

  return null;
};
