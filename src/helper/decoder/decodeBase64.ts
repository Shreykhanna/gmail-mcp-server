export const decodeBase64 = (data: string): string => {
  const base64 = data.replace(/-/g, "+").replace(/_/g, "/");

  const buffer = Buffer.from(base64, "base64");
  return buffer.toString("utf-8");
};
