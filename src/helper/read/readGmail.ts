import path from "node:path";
import process from "node:process";
import { authenticate } from "@google-cloud/local-auth";
import { google } from "googleapis";
import fs from "node:fs";
import { getEmailBody } from "../getEmailBody.js";

const SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];

const CREDENTIALS_PATH = path.join(
  process.cwd(),
  "credentials",
  "credentials.json"
);

if (!fs.existsSync(CREDENTIALS_PATH)) {
  console.error("Credentials file not found:", CREDENTIALS_PATH);
  process.exit(1);
}

export const readGmail = async () => {
  try {
    const auth = await authenticate({
      keyfilePath: CREDENTIALS_PATH,
      scopes: SCOPES,
    });
    const gmail = google.gmail({ version: "v1", auth });
    const res = await gmail.users.messages.list({
      userId: "me",
      maxResults: 10,
    });
    const messages = res.data.messages;
    if (!messages || messages.length === 0) {
      console.error("No messages found.");
      return;
    }

    for (const msg of messages ?? []) {
      const message = await gmail.users.messages.get({
        userId: "me",
        id: msg.id!,
        format: "full",
      });

      const headers = message.data.payload?.headers;
      const subject = headers?.find((h) => h.name === "Subject")?.value;
      const from = headers?.find((h) => h.name === "From")?.value;
      const snippet = message.data.snippet;
      const mailContent = {
        emails: [
          {
            id: msg.id,
            headers: {
              from: from,
              subject: subject,
            },
            snippet: snippet,
            body: getEmailBody(message.data.payload),
          },
        ],
      };

      return mailContent;
    }
  } catch (err) {
    console.error("Failed to read Gmail:", err);
    process.exit(1);
  }
};

export async function listLabels() {
  const auth = await authenticate({
    keyfilePath: CREDENTIALS_PATH,
    scopes: SCOPES,
  });
  const gmail = google.gmail({ version: "v1", auth });

  const result = await gmail.users.labels.list({ userId: "me" });
  const labels = result.data.labels;
  if (!labels || labels.length === 0) {
    console.error("No labels found.");
    return;
  }
  console.error("Labels:", labels);
}

await readGmail();
