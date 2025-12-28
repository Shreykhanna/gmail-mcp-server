import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { listLabels } from "./read/readGmail.js";
import { readGmail } from "./read/readGmail.js";
import { createDraftEmail } from "./draft/draftEmail.js";
import { sendEmail } from "./send/sendEmail.js";
import z from "zod";
import path from "node:path";
import fs from "node:fs";
import { authenticate } from "@google-cloud/local-auth";

const SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];

const CREDENTIALS_PATH = path.join(
  process.cwd(),
  "credentials",
  "credentials.json"
);
const auth = await authenticate({
  keyfilePath: CREDENTIALS_PATH,
  scopes: SCOPES,
});

if (!fs.existsSync(CREDENTIALS_PATH)) {
  console.error("Credentials file not found:", CREDENTIALS_PATH);
  process.exit(1);
}

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
  "list_gmail_labels",
  {
    description: "List Gmail labels using Gmail API",
  },
  async () => {
    const labelsData = await listLabels(auth);
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
  "read_gmail",
  {
    description: "Read emails from Gmail using Gmail API",
  },
  async () => {
    const mailContent = await readGmail(auth);
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
    const draft = await createDraftEmail(
      process.env.GMAIL_AUTH || "",
      to,
      subject,
      body
    );
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
