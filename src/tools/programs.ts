import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { SmartCallClient } from '../client.js'

export function registerProgramTools(server: McpServer, client: SmartCallClient) {
  server.tool(
    'list_programs',
    'List all AI outbound calling programs in your workspace. Programs contain bots, leads, and dialing configurations. Filter by run state to see only active or paused programs.',
    {
      runState: z.enum(['RUNNING', 'PAUSED']).optional().describe('Filter by program state'),
      page: z.number().optional().describe('Page number (default 1)'),
      pageSize: z.number().optional().describe('Page size (default 20, max 100)'),
    },
    async ({ runState, page, pageSize }) => {
      try {
        const result = await client.listPrograms({ runState, page, pageSize })
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        }
      } catch (err: any) {
        return {
          content: [{ type: 'text', text: `Failed to list programs: ${err.message}` }],
          isError: true,
        }
      }
    }
  )

  server.tool(
    'control_program',
    'Start or pause an AI outbound calling program. When started, the program will automatically dial queued leads. When paused, no new calls will be made.',
    {
      programId: z.string().describe('The program ID to control'),
      action: z.enum(['start', 'pause']).describe('Action: "start" to begin dialing, "pause" to stop'),
    },
    async ({ programId, action }) => {
      try {
        const result = await client.controlProgram(programId, action)
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        }
      } catch (err: any) {
        return {
          content: [{ type: 'text', text: `Failed to ${action} program: ${err.message}` }],
          isError: true,
        }
      }
    }
  )

  server.tool(
    'get_program_stats',
    'Get calling statistics for a program: total calls, connected calls, average duration, intent breakdown (high/hesitate/low), and more. Optionally filter by date.',
    {
      programId: z.string().describe('The program ID'),
      date: z.string().optional().describe('Date filter (YYYY-MM-DD), defaults to today'),
    },
    async ({ programId, date }) => {
      try {
        const result = await client.getProgramStats(programId, { date })
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        }
      } catch (err: any) {
        return {
          content: [{ type: 'text', text: `Failed to get program stats: ${err.message}` }],
          isError: true,
        }
      }
    }
  )

  server.tool(
    'get_dialing_config',
    'Get the dialing configuration for a program: max concurrency, priority strategy (LIFO/FIFO), work time windows, and block time settings.',
    {
      programId: z.string().describe('The program ID'),
    },
    async ({ programId }) => {
      try {
        const result = await client.getDialingConfig(programId)
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        }
      } catch (err: any) {
        return {
          content: [{ type: 'text', text: `Failed to get dialing config: ${err.message}` }],
          isError: true,
        }
      }
    }
  )

  server.tool(
    'update_dialing_config',
    'Update dialing configuration for a program. Control concurrency, call priority, and work time windows.',
    {
      programId: z.string().describe('The program ID'),
      maxConcurrency: z.number().optional().describe('Max concurrent calls (e.g. 5)'),
      priorityStrategy: z.enum(['LIFO', 'FIFO']).optional().describe('Call priority: LIFO (newest first) or FIFO (oldest first)'),
      blockStartTime: z.number().nullable().optional().describe('Block start time in minutes from midnight (e.g. 720 = 12:00). Set null to disable.'),
      blockEndTime: z.number().nullable().optional().describe('Block end time in minutes from midnight (e.g. 840 = 14:00). Set null to disable.'),
    },
    async ({ programId, maxConcurrency, priorityStrategy, blockStartTime, blockEndTime }) => {
      try {
        const config: Record<string, any> = {}
        if (maxConcurrency !== undefined) config.maxConcurrency = maxConcurrency
        if (priorityStrategy !== undefined) config.priorityStrategy = priorityStrategy
        if (blockStartTime !== undefined) config.blockStartTime = blockStartTime
        if (blockEndTime !== undefined) config.blockEndTime = blockEndTime
        const result = await client.updateDialingConfig(programId, config)
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        }
      } catch (err: any) {
        return {
          content: [{ type: 'text', text: `Failed to update dialing config: ${err.message}` }],
          isError: true,
        }
      }
    }
  )
}
