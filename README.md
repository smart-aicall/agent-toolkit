# @smartcall/mcp-server

MCP Server for [Smart-Call](https://halfcall.cn) AI Outbound Calling Platform.

Give any AI agent the power of enterprise-grade AI outbound calling. Push leads, manage calling programs, update bot scripts, and query call results, all through the [Model Context Protocol](https://modelcontextprotocol.io).

## Features

- **Lead Management**: Push phone numbers to calling programs, query call results with AI intent analysis
- **Program Control**: List, start, and pause outbound calling programs
- **Bot Script Editing**: Read and update AI conversation scripts on the fly
- **Dialing Configuration**: Adjust concurrency, priority strategy, and work time windows
- **Call Analytics**: Get program-level statistics including connect rates and intent breakdowns
- **Batch Operations**: Query multiple leads at once by threadId, programId, or date

## Quick Start

### 1. Get your API key

Log in to your Smart-Call dashboard, go to **Settings > API Keys**, and create a new key.

### 2. Configure in Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "smartcall": {
      "command": "npx",
      "args": ["-y", "@smartcall/mcp-server"],
      "env": {
        "SMARTCALL_API_KEY": "sk-your-api-key-here"
      }
    }
  }
}
```

### 3. Configure in Claude Code

Add to your `.mcp.json` (project-level) or `~/.claude/mcp.json` (global):

```json
{
  "mcpServers": {
    "smartcall": {
      "command": "npx",
      "args": ["-y", "@smartcall/mcp-server"],
      "env": {
        "SMARTCALL_API_KEY": "sk-your-api-key-here"
      }
    }
  }
}
```

## Available Tools

### Authentication

| Tool | Description |
|------|-------------|
| `verify_auth` | Verify your API key and see which workspace it belongs to |

### Lead Management

| Tool | Description |
|------|-------------|
| `push_lead` | Push a phone number to a calling program. Returns a threadId for tracking. |
| `query_lead` | Query call status and results by threadId or programId + phone |
| `batch_query_leads` | Query multiple leads at once. Filter by threadIds, programId, or date. |

### Program Management

| Tool | Description |
|------|-------------|
| `list_programs` | List all programs in your workspace. Filter by RUNNING/PAUSED state. |
| `control_program` | Start or pause a calling program |
| `get_program_stats` | Get calling statistics: total calls, connect rate, intent breakdown |
| `get_dialing_config` | Get dialing settings: concurrency, priority, work time windows |
| `update_dialing_config` | Update dialing settings |

### Bot Management

| Tool | Description |
|------|-------------|
| `list_bots` | List all AI bots in a program |
| `get_bot_script` | Get the conversation script for a bot |
| `update_bot_script` | Update a bot's conversation script |
| `download_lead_template` | Download the CSV template for bulk lead upload |

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SMARTCALL_API_KEY` | Yes | - | Your Smart-Call API key |
| `SMARTCALL_BASE_URL` | No | `https://api.halfcall.cn` | API base URL |
| `SMARTCALL_TIMEOUT` | No | `30000` | Request timeout in ms |

## Example Conversations

**Push a lead and check results:**
> "Push phone number 13800138000 to program abc123 with name=John and company=Acme, then check the call result when it's done."

**Monitor a campaign:**
> "Show me today's stats for program abc123. How many calls connected? What's the intent breakdown?"

**Update a bot script:**
> "Get the current script for bot xyz789, then update it to be more friendly in the greeting."

**Batch check results:**
> "Query all leads pushed to program abc123 on 2025-01-15. Show me the ones with high intent."

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run locally
SMARTCALL_API_KEY=sk-xxx npm start

# Watch mode
npm run dev
```

## License

MIT
