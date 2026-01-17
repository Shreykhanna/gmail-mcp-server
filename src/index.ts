import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { listLabels } from "./read/readGmail.js";
import { readGmail } from "./read/readGmail.js";
import { createDraftEmail } from "./draft/draftEmail.js";
import { sendEmail } from "./send/sendEmail.js";
import z from "zod";
import { getOAuth2Client } from "./auth/auth.js";
import { OAuth2Client } from "google-auth-library";
import { listCalendarEvents } from "./calendar/listCalendarEvents.js";
import { createCalendarEvent } from "./calendar/createCalendarEvents.js";

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
  }
);

server.registerTool(
  "authenticate_gmail",
  {
    description: "Autenticate Gmail API access",
  },
  async () => {
    authClient = await getOAuth2Client();
    return {
      content: [
        {
          type: "text",
          text: "Gmail API authorised successfully.",
        },
      ],
    };
  }
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
  }
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
  }
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
  }
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
  }
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
            })
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
  }
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
  }
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
