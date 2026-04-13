---
name: smartcall
description: |
  Smart-Call AI outbound calling platform. Use when the user wants to push leads
  to an AI calling program, check call results, manage calling programs, update
  bot scripts, configure webhooks, or view calling statistics. Trigger on keywords:
  "call", "outbound", "leads", "smart-call", "dialing", "bot script", "webhook",
  "campaign", "phone", "intention", "connect rate".
allowed-tools:
  - Bash
  - Read
  - mcp
---

# Smart-Call Agent Toolkit

You are an AI assistant with access to the Smart-Call AI outbound calling platform.
Smart-Call automates enterprise-grade outbound phone calls using AI bots that can
hold natural conversations with leads, handle objections, and classify intent.

## Core Concepts

Before using the tools, understand these key concepts:

- **Program**: A calling campaign. Contains bots, leads, and dialing settings. Has a `runState` (RUNNING or PAUSED) and an `executionMode` (must be `Stream` for API-pushed leads).
- **Bot**: An AI agent within a program. Each bot has a conversation script (prompt) that defines its personality, pitch, objection handling, and closing behavior. Programs can have multiple bots for different stages (e.g., stage 1 = initial call, stage 2 = follow-up).
- **Lead (ThreadDetail)**: A phone number queued for calling. When pushed via API, gets a `threadDetailId` you can use to track it.
- **Thread**: A daily container that groups leads pushed on the same day. Created automatically.
- **TaskDetail**: A single call attempt. A lead can have multiple call attempts (retries). Each has `reached` status, `duration`, `intention`, and `intentionRate`.
- **Intention Levels**: `HIGH` (strong interest), `HESITATE` (uncertain), `LOW` (not interested), `UNKNOW` (AI hasn't analyzed yet).
- **Reached Status**: `REACHED` (answered), `UNREACHED` (not answered), `CALL_REJECTED` (declined), `EMPTY_PHONE` (invalid number), `SHUTDOWN` (phone off), `INVALID` (connected but too short to count).

## Setup & Authentication

### Step 1: Verify MCP Server is Connected

The Smart-Call MCP server must be configured. Run `verify_auth` to check.

If it fails or the tools are not available, the user needs to configure it:

**For Claude Desktop** (`claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "smartcall": {
      "command": "npx",
      "args": ["-y", "smartcall-agent-toolkit"],
      "env": {
        "SMARTCALL_API_KEY": "sk-your-api-key"
      }
    }
  }
}
```

**For Claude Code** (`.mcp.json` or `~/.claude/mcp.json`):
```json
{
  "mcpServers": {
    "smartcall": {
      "command": "npx",
      "args": ["-y", "smartcall-agent-toolkit"],
      "env": {
        "SMARTCALL_API_KEY": "sk-your-api-key"
      }
    }
  }
}
```

**API key**: Users get this from the Smart-Call dashboard → Settings → API Keys.

### Step 2: Always Verify First

Before any operation, call `verify_auth` to confirm:
- The API key is valid
- Which workspace it belongs to

If auth fails, do NOT proceed. Tell the user to check their API key.

## Available Tools (17 total)

### Authentication
| Tool | Parameters | Description |
|------|-----------|-------------|
| `verify_auth` | (none) | Verify API key, returns workspaceId |

### Lead Management
| Tool | Parameters | Description |
|------|-----------|-------------|
| `push_lead` | `programId` (required), `phone` (required), `variables` (optional object) | Push a phone number to a program. Returns `threadDetailId` for tracking. The lead will be queued and called automatically when the program is RUNNING. |
| `query_lead` | `threadId` OR (`programId` + `phone`) | Query a single lead's status and all call records. Returns reached status, duration, intention, recording URL, AI summary. |
| `batch_query_leads` | `threadIds` (comma-separated) OR `programId`, `date` (YYYY-MM-DD), `page`, `pageSize` (max 100) | Query multiple leads at once. Returns paginated list with latest call result per lead. Much more efficient than calling query_lead in a loop. |

### Program Management
| Tool | Parameters | Description |
|------|-----------|-------------|
| `list_programs` | `runState` (RUNNING/PAUSED), `page`, `pageSize` | List all programs in the workspace. Shows name, runState, executionMode, concurrency settings. |
| `control_program` | `programId`, `action` (start/pause) | Start or pause a program. When started, the auto-dialer begins calling queued leads. When paused, no new calls are initiated (in-progress calls continue). |
| `get_program_stats` | `programId`, `date` (YYYY-MM-DD, default today) | Get daily statistics: total calls, reached count, connect rate (%), intention breakdown (high/hesitate), average duration, and detailed status counts. |
| `get_dialing_config` | `programId` | Get current dialing settings: maxConcurrency, priorityStrategy (LIFO/FIFO), workTimeConfig, blockStartTime, blockEndTime. |
| `update_dialing_config` | `programId`, `maxConcurrency`, `priorityStrategy`, `blockStartTime`, `blockEndTime` | Update dialing settings. All fields optional, only provided fields are updated. |

### Bot Management
| Tool | Parameters | Description |
|------|-----------|-------------|
| `list_bots` | `programId` | List all bots in a program with their stage, enabled status, and agent config (LLM model, TTS, ASR). |
| `get_bot_script` | `botId` | Get the conversation script (prompt) for a bot. This is the core instruction that defines how the AI talks. |
| `update_bot_script` | `botId`, `prompt` | Update a bot's conversation script. Takes effect on the next call. Be careful: a bad script can tank connect rates. |
| `download_lead_template` | `programId`, `botId` (optional) | Get the CSV/Excel template for bulk lead upload. Includes required columns and custom variable columns. |

### Webhook
| Tool | Parameters | Description |
|------|-----------|-------------|
| `get_webhook` | `programId` | Get current webhook configuration. Shows URL and whether a signing secret is configured. |
| `update_webhook` | `programId`, `webhookUrl` (string or null), `webhookSecret` (optional) | Set or clear the webhook URL. When set, every settled call triggers a POST to this URL with call results. Set `webhookUrl` to null to disable. |

## Workflows

### 1. Push Leads and Monitor a Campaign

This is the most common workflow: push phone numbers, let the AI call them, check results.

```
Step 1: Find the right program
→ list_programs (optionally filter by runState: "RUNNING")
→ Note the programId and confirm executionMode is "Stream"

Step 2: Ensure program is running
→ If paused: control_program(programId, "start")

Step 3: Push leads
→ push_lead(programId, phone, { name: "John", company: "Acme" })
→ Save the returned threadDetailId

Step 4: Wait for calls to complete
→ Calls are made automatically by the auto-dialer
→ Typical turnaround: seconds to minutes depending on queue size

Step 5: Check results
→ query_lead(threadId: threadDetailId)
→ Look at: reached, duration, intention, intentionRate, summary
```

**Important**: The program's `executionMode` must be `Stream` to accept API-pushed leads. If it's `Batch`, the push will fail with "Program executionMode must be Stream".

### 2. Campaign Performance Review

```
Step 1: Get today's stats
→ get_program_stats(programId)
→ Key metrics: connectRate, totalCalls, reachedCount, highCount, hesitateCount

Step 2: Check recent results in detail
→ batch_query_leads(programId, date: "2025-01-15", pageSize: 50)
→ Filter by intention in the response

Step 3: If connect rate is low, check dialing config
→ get_dialing_config(programId)
→ Consider adjusting maxConcurrency or blockStartTime/blockEndTime

Step 4: If intention rate is low, review bot script
→ list_bots(programId)
→ get_bot_script(botId)
→ Suggest improvements to the script
```

### 3. Bot Script Optimization

```
Step 1: Get current script
→ list_bots(programId) to find the botId
→ get_bot_script(botId)

Step 2: Analyze the script
→ Check: greeting, value proposition, objection handling, closing
→ Identify weak points (too aggressive? too passive? missing objection handlers?)

Step 3: Update the script
→ update_bot_script(botId, newPrompt)
→ The new script takes effect on the NEXT call (in-progress calls keep the old script)

Step 4: Monitor impact
→ Wait for a batch of calls to complete
→ get_program_stats(programId) to compare before/after
```

**Script best practices**:
- Keep the greeting short and natural (under 15 seconds)
- Always include 3-5 objection handlers for common pushbacks
- Define clear intent classification criteria so the AI can tag correctly
- Include a graceful exit for when the lead says "not interested"
- Don't be too pushy, it tanks connect rates (people hang up faster)

### 4. Webhook Integration

```
Step 1: Set up webhook
→ update_webhook(programId, {
    webhookUrl: "https://your-app.com/api/smartcall-callback",
    webhookSecret: "your-secret-key"
  })

Step 2: Verify it's configured
→ get_webhook(programId)

Step 3: What your endpoint receives (POST):
{
  "event": "call.settled",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "data": {
    "programId": "...",
    "taskDetailId": "...",
    "threadDetailId": "...",
    "phone": "13800138000",
    "stage": 1,
    "reached": "REACHED",
    "duration": 45,
    "intention": "HIGH",
    "intentionRate": 85,
    "endTime": "2025-01-15T10:30:00.000Z",
    "isReached": true,
    "isIntention": true
  }
}

Step 4: Verify signature (if webhookSecret is set)
→ Check X-SmartCall-Signature header
→ HMAC-SHA256(request_body, webhookSecret) should match

Step 5: To disable webhook
→ update_webhook(programId, { webhookUrl: null })
```

### 5. Dialing Configuration Tuning

```
maxConcurrency: How many calls run at the same time
→ Higher = faster throughput, but may hit carrier limits
→ Recommended: 10-50 for most campaigns

priorityStrategy:
→ "LIFO" (Last In, First Out): newest leads get called first. Good for time-sensitive leads.
→ "FIFO" (First In, First Out): oldest leads get called first. Good for fairness.

blockStartTime / blockEndTime: Quiet hours (in minutes from midnight)
→ Example: blockStartTime=1260 (21:00), blockEndTime=480 (08:00) = no calls 9PM-8AM
→ Set to null to disable

workTimeConfig: JSON object defining daily work schedules
→ Managed through the dashboard UI, read-only via API
```

## Response Format

All API responses follow this structure:
```json
{
  "code": 0,       // 0 = success, -1 = error
  "msg": "success", // Error message when code is -1
  "data": { ... }   // Response data
}
```

Common error codes:
- **401**: Invalid or expired API key
- **403**: Program doesn't belong to your workspace
- **400**: Missing required parameters or invalid values
- **404**: Lead/program/bot not found

## Tips & Gotchas

1. **Always verify auth first** if it's the first interaction in a session.
2. **Use batch_query_leads** instead of looping query_lead. Max 100 threadIds per request.
3. **Program must be Stream mode** to accept pushed leads. Check `executionMode` in list_programs.
4. **Leads are deduplicated** by phone + threadId (daily container). Pushing the same phone twice on the same day re-queues the existing lead.
5. **Bot scripts are versioned**. Each update_bot_script increments the version. Old calls in progress keep the old script.
6. **Stats are aggregated daily**. Use the `date` parameter to query historical data.
7. **Connect rate** is calculated as `reachedCount / totalCalls * 100`. A healthy campaign is 30-60% depending on industry.
8. **Intention rate** = `(highCount + hesitateCount) / reachedCount * 100`. This measures how many answered calls showed interest.
9. **Webhook failures are silent**. If your endpoint is down, call results are NOT retried. Use batch_query_leads as a backup to catch missed events.
10. **Work time windows are in Beijing time (UTC+8)**. The auto-dialer respects these and won't call outside configured hours.
