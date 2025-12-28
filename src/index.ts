import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { listLabels } from "./helper/read/readGmail.js";
import { readGmail } from "./helper/read/readGmail.js";
import { createDraftEmail } from "./helper/draft/draftEmail.js";
import { sendEmail } from "./helper/send/sendEmail.js";
import z from "zod";

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
    const labelsData = await listLabels();
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
    const mailContent = await readGmail();
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
