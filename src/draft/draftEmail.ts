import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";

const makeRawEmail = ({
  to,
  subject,
  body,
  from,
}: {
  to: string;
  subject: string;
  body: string;
  from: string;
}) => {
  const message = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    ``,
    `${body}`,
  ].join("\n");
  return Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
};

export const createDraftEmail = async (
  auth: OAuth2Client,
  to: string,
  subject: string,
  body: string
) => {
  // Implementation for creating a draft email
  const gmail = google.gmail({ version: "v1", auth });
  const raw = makeRawEmail({ to, subject, body, from: "me" });
  const draft = await gmail.users.drafts.create({
    userId: "me",
    requestBody: {
      message: {
        raw,
      },
    },
  });
  return draft;
};
