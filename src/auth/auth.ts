import fs from "node:fs";
import path from "node:path";
import { google } from "googleapis";
import { authenticate } from "@google-cloud/local-auth";

const CREDENTIALS = path.join(process.cwd(), "credentials", "credentials.json");
const TOKEN = path.join(process.cwd(), "credentials", "token.json");
const SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/calendar.events",
];

export async function getOAuth2Client() {
  const creds = JSON.parse(fs.readFileSync(CREDENTIALS, "utf8"));
  const client = creds.installed ?? creds.web;
  const oAuth2 = new google.auth.OAuth2(
    client.client_id,
    client.client_secret,
    client.redirect_uris?.[0]
  );

  if (fs.existsSync(TOKEN)) {
    oAuth2.setCredentials(JSON.parse(fs.readFileSync(TOKEN, "utf8")));
    return oAuth2;
  }

  const auth = await authenticate({ keyfilePath: CREDENTIALS, scopes: SCOPES });
  fs.writeFileSync(TOKEN, JSON.stringify(auth.credentials, null, 2));
  return auth;
}
