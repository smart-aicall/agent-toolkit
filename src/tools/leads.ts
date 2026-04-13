import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { SmartCallClient } from '../client.js'

export function registerLeadTools(server: McpServer, client: SmartCallClient) {
  server.tool(
    'push_lead',
    'Push a phone number to an AI outbound calling program. The lead will be queued and called automatically by the AI bot. Returns a threadId you can use to query the call result later.',
    {
      programId: z.string().describe('The program ID to push the lead to'),
      phone: z.string().describe('Phone number to call (e.g. 13800138000)'),
      variables: z.record(z.string(), z.any()).optional().describe('Custom variables for the call script (e.g. { name: "John", company: "Acme" })'),
    },
    async ({ programId, phone, variables }) => {
      try {
        const result = await client.pushLead({ programId, phone, variables })
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        }
      } catch (err: any) {
        return {
          content: [{ type: 'text', text: `Failed to push lead: ${err.message}` }],
          isError: true,
        }
      }
    }
  )

  server.tool(
    'query_lead',
    'Query the status and call results of a lead. Returns call records with AI intent analysis, duration, recording URL, and conversation summary. Use threadId (returned by push_lead) or programId + phone to look up.',
    {
      threadId: z.string().optional().describe('The threadId returned by push_lead'),
      programId: z.string().optional().describe('Program ID (use with phone)'),
      phone: z.string().optional().describe('Phone number (use with programId)'),
    },
    async ({ threadId, programId, phone }) => {
      try {
        const result = await client.queryLead({ threadId, programId, phone })
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        }
      } catch (err: any) {
        return {
          content: [{ type: 'text', text: `Failed to query lead: ${err.message}` }],
          isError: true,
        }
      }
    }
  )

  server.tool(
    'batch_query_leads',
    'Query status and call results for multiple leads at once. Filter by threadIds, programId, or date. More efficient than calling query_lead repeatedly.',
    {
      threadIds: z.array(z.string()).optional().describe('List of threadIds to query'),
      programId: z.string().optional().describe('Filter by program ID'),
      date: z.string().optional().describe('Filter by date (YYYY-MM-DD)'),
      page: z.number().optional().describe('Page number (default 1)'),
      pageSize: z.number().optional().describe('Page size (default 20, max 100)'),
    },
    async ({ threadIds, programId, date, page, pageSize }) => {
      try {
        const result = await client.batchQueryLeads({ threadIds, programId, date, page, pageSize })
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        }
      } catch (err: any) {
        return {
          content: [{ type: 'text', text: `Failed to batch query leads: ${err.message}` }],
          isError: true,
        }
      }
    }
  )
}
