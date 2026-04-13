import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { SmartCallClient } from '../client.js'

export function registerBotTools(server: McpServer, client: SmartCallClient) {
  server.registerTool(
    'list_bots',
    {
      description: 'List all AI bots in a program. Each bot has its own conversation script and can be assigned to different lead segments.',
      inputSchema: {
        programId: z.string().describe('The program ID'),
      },
    },
    async ({ programId }) => {
      try {
        const result = await client.listBots(programId)
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        }
      } catch (err: any) {
        return {
          content: [{ type: 'text', text: `Failed to list bots: ${err.message}` }],
          isError: true,
        }
      }
    }
  )

  server.registerTool(
    'get_bot_script',
    {
      description: 'Get the conversation script (prompt) for an AI bot. The script defines how the bot talks to leads: greeting, objection handling, closing, etc.',
      inputSchema: {
        botId: z.string().describe('The bot ID'),
      },
    },
    async ({ botId }) => {
      try {
        const result = await client.getBotScript(botId)
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        }
      } catch (err: any) {
        return {
          content: [{ type: 'text', text: `Failed to get bot script: ${err.message}` }],
          isError: true,
        }
      }
    }
  )

  server.registerTool(
    'update_bot_script',
    {
      description: 'Update the conversation script (prompt) for an AI bot. This changes what the bot says during calls. The script should include greeting, main pitch, objection handling, and closing.',
      inputSchema: {
        botId: z.string().describe('The bot ID'),
        prompt: z.string().describe('The new conversation script/prompt for the bot'),
      },
    },
    async ({ botId, prompt }) => {
      try {
        const result = await client.updateBotScript(botId, prompt)
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        }
      } catch (err: any) {
        return {
          content: [{ type: 'text', text: `Failed to update bot script: ${err.message}` }],
          isError: true,
        }
      }
    }
  )

  server.registerTool(
    'download_lead_template',
    {
      description: 'Download the CSV/Excel template for bulk lead upload. The template includes required columns (phone) and optional variable columns based on the bot script.',
      inputSchema: {
        programId: z.string().describe('The program ID'),
        botId: z.string().optional().describe('Optional bot ID to get bot-specific template with custom variables'),
      },
    },
    async ({ programId, botId }) => {
      try {
        const result = await client.downloadLeadTemplate(programId, botId)
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        }
      } catch (err: any) {
        return {
          content: [{ type: 'text', text: `Failed to download template: ${err.message}` }],
          isError: true,
        }
      }
    }
  )
}
