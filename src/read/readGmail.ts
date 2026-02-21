import { google } from "googleapis";
import { getEmailBody } from "../helper/getEmailBody.js";
import { OAuth2Client } from "google-auth-library";

type EmailItem = {
  id: string | null | undefined;
  headers: {
    from?: string;
    subject?: string;
  };
  snippet?: string | null;
  body?: string | null;
};

const buildEmailItem = (message: any): EmailItem => {
  const headers = message.data.payload?.headers;
  const subject = headers?.find(
    (h: { name: string }) => h.name === "Subject",
  )?.value;
  const from = headers?.find((h: { name: string }) => h.name === "From")?.value;
  return {
    id: message.data.id,
    headers: {
      from: from,
      subject: subject,
    },
    snippet: message.data.snippet,
    body: getEmailBody(message.data.payload),
  };
};

const fetchMessages = async (
  auth: OAuth2Client,
  options: { maxResults?: number; query?: string } = {},
) => {
  const gmail = google.gmail({ version: "v1", auth });
  const res = await gmail.users.messages.list({
    userId: "me",
    maxResults: options.maxResults ?? 10,
    q: options.query,
  });

  const messages = res.data.messages ?? [];
  if (messages.length === 0) {
    return { emails: [] as EmailItem[] };
  }

  const emailItems = await Promise.all(
    messages.map(async (msg) => {
      const message = await gmail.users.messages.get({
        userId: "me",
        id: msg.id!,
        format: "full",
      });
      return buildEmailItem(message);
    }),
  );

  return { emails: emailItems };
};

export const readGmail = async (auth: OAuth2Client) => {
  try {
    console.error("AUTH IN READGMAIL", auth);
    return await fetchMessages(auth, { maxResults: 10 });
  } catch (err) {
    console.error("Failed to read Gmail:", err);
  }
};

export const readUnreadGmail = async (auth: OAuth2Client, maxResults = 10) => {
  try {
    console.error("AUTH IN READUNREADGMAIL", auth);
    return await fetchMessages(auth, {
      maxResults,
      query: "is:unread is:important",
    });
  } catch (err) {
    console.error("Failed to read unread Gmail:", err);
  }
};

export async function listLabels(auth: OAuth2Client) {
  const gmail = google.gmail({ version: "v1", auth });

  const result = await gmail.users.labels.list({ userId: "me" });
  const labels = result.data.labels;
  if (!labels || labels.length === 0) {
    console.error("No labels found.");
    return;
  }
  console.error("Labels:", labels);
}
