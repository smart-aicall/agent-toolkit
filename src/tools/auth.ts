import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { SmartCallClient } from '../client.js'

export function registerAuthTools(server: McpServer, client: SmartCallClient) {
  server.tool(
    'verify_auth',
    'Verify your API key is valid and see which workspace it belongs to. Call this first to confirm your credentials are working.',
    {},
    async () => {
      try {
        const result = await client.verifyAuth()
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        }
      } catch (err: any) {
        return {
          content: [{ type: 'text', text: `Auth verification failed: ${err.message}` }],
          isError: true,
        }
      }
    }
  )
}
