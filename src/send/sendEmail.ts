import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";

export const sendEmail = async (
  to: string,
  subject: string,
  body: string,
  auth: OAuth2Client
) => {
  try {
    const gmail = google.gmail({ version: "v1", auth });
    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString(
      "base64"
    )}?=`;
    const messageParts = [
      `To: ${to}`,
      "Content-Type: text/html; charset=utf-8",
      "MIME-Version: 1.0",
      `Subject: ${utf8Subject}`,
      "",
      body,
    ];
    const message = messageParts.join("\r\n");
    const encodedMessage = Buffer.from(message)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const response = await gmail.users.messages.send({
      userId: "shrey.khanna.au@gmail.com",
      requestBody: {
        raw: encodedMessage,
      },
    });

    return response;
  } catch (error) {
    console.error("Error", error);
  }
};
