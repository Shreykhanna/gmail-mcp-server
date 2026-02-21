import z from "zod";
import { listLabels, readUnreadGmail } from "./read/readGmail.js";
import { getOAuth2Client } from "./auth/auth.js";
import { readGmail } from "./read/readGmail.js";
import { sendEmail } from "./send/sendEmail.js";
import { OAuth2Client } from "google-auth-library";
import { createDraftEmail } from "./draft/draftEmail.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { listCalendarEvents } from "./calendar/listCalendarEvents.js";
import { createCalendarEvent } from "./calendar/createCalendarEvents.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { google } from "googleapis";

let authClient: OAuth2Client;

const server = new McpServer(
  {
    name: "Gmail MCP",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

server.registerTool(
  "authenticate_gmail",
  {
    description: "Autenticate Gmail API access",
    inputSchema: z.object({
      accessToken: z.string(),
      refreshToken: z.string(),
      scope: z.string(),
      expiryAt: z.number(),
      tokenType: z.string(),
      clientSecret: z.string(),
      clientId: z.string(),
    }),
  },
  async ({
    accessToken,
    refreshToken,
    scope,
    expiryAt,
    tokenType,
    clientId,
    clientSecret,
  }) => {
    authClient = new google.auth.OAuth2(clientId, clientSecret);
    const normalizedType = tokenType
      ? tokenType.charAt(0).toUpperCase() + tokenType.slice(1).toLowerCase()
      : "Bearer";

    authClient.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
      scope: scope,
      expiry_date: expiryAt,
      token_type: normalizedType,
    });
    return {
      content: [
        {
          type: "text",
          text: "Gmail API authorised successfully.",
        },
      ],
    };
  },
);

server.registerTool(
  "list_gmail_labels",
  {
    description: "List Gmail labels using Gmail API",
  },
  async () => {
    const labelsData = await listLabels(authClient);
    return {
      content: [
        {
          type: "text",
          text: `Gmail Labels:\n${labelsData}`,
        },
      ],
    };
  },
);

server.registerTool(
  "send_email",
  {
    description: "Send an email to given email address using Gmail API",
    inputSchema: z.object({
      to: z.string().email().describe("Recipient email address"),
      subject: z.string().describe("Email subject"),
      body: z.string().describe("Email body content"),
    }),
  },
  async ({ to, subject, body }) => {
    const response = await sendEmail(to, subject, body, authClient);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(response?.data),
        },
      ],
    };
  },
);

server.registerTool(
  "summarise_email",
  {
    description: "Read emails from Gmail using Gmail API",
  },
  async () => {
    const mailContent = await readGmail(authClient);
    return {
      content: [
        {
          type: "text",
          text: "Emails fetched from Gmail:",
        },
      ],
      structuredContent: mailContent,
    };
  },
);

server.registerTool(
  "summarise_unread_emails",
  {
    description: "Read emails from Gmail using Gmail API",
  },
  async () => {
    const mailContent = await readUnreadGmail(authClient);
    return {
      content: [
        {
          type: "text",
          text: "Unread emails fetched from gmail:",
        },
      ],
      structuredContent: mailContent,
    };
  },
);

server.registerTool(
  "list_calendar_events",
  {
    description: "List calendar events in Gmail calendar using Gmail API",
  },
  async () => {
    const listEvents = await listCalendarEvents(authClient);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(listEvents),
        },
      ],
    };
  },
);

server.registerTool(
  "create_calendar_events",
  {
    description: "List calendar events in Gmail calendar using Gmail API",
    inputSchema: z.object({
      eventDetails: z.object({
        summary: z.string(),
        location: z.string(),
        description: z.string(),
        startTime: z.string(),
        endTime: z.string(),
        attendees: z
          .array(
            z.object({
              email: z.string().email(),
            }),
          )
          .default([]),
      }),
    }),
  },
  async ({ eventDetails }) => {
    const eventCreated = await createCalendarEvent(authClient, eventDetails);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(eventCreated),
        },
      ],
    };
  },
);

server.registerTool(
  "draft_email",
  {
    description: "Create a draft email in Gmail using Gmail API",
    inputSchema: z.object({
      to: z.string().email().describe("Recipient email address"),
      subject: z.string().describe("Email subject"),
      body: z.string().describe("Email body content"),
    }),
  },
  async ({ to, subject, body }) => {
    const draft = await createDraftEmail(authClient, to, subject, body);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(draft.data),
        },
      ],
    };
  },
);

const main = async () => {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Gmail MCP server is running and connected.");
};

main().catch((err) => {
  console.error("Failed to start Gmail MCP server:", err);
  process.exit(1);
});
