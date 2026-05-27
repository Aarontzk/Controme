# Codex setup for this repo

Codex auto-loads **`AGENTS.md`** (repo root) — that's the main instruction file. No action
needed for instructions.

## MCP servers

Codex reads MCP config from your **global** `~/.codex/config.toml`, not from a project file.
The project's MCP servers are defined in [`config.toml`](./config.toml) (gitignored, holds
tokens). To enable them in Codex:

1. Open `~/.codex/config.toml` (create it if missing).
2. Copy the `[mcp_servers.*]` blocks from this folder's `config.toml` into it.
3. Restart Codex.

These servers (`buildpad`, `daas`, `buildpad-platform`) are the project's DaaS backend +
Buildpad CLI + Amplify management tools (see `AGENTS.md` §5).

### Native streamable-HTTP form (newer Codex)

`config.toml` bridges the HTTP servers through `npx mcp-remote` for maximum compatibility.
If your Codex build supports native streamable-HTTP MCP, you can replace each bridged block
with:

```toml
[mcp_servers.daas]
url = "https://9a3f669b-fd50-453c-a111-cc09b113ef39.daas3.buildpad.ai/api/mcp"
bearer_token = "<DAAS_ACCESS_TOKEN>"   # real value lives in .codex/config.toml (gitignored)
```

(Key names for remote MCP vary by Codex version — check `codex --help` / docs if it doesn't
connect, and fall back to the `mcp-remote` form which works over stdio everywhere.)

## Skills

Codex does not auto-discover this repo's `.claude/skills/`. When a task matches a skill,
open `.claude/skills/<name>/SKILL.md` and follow it. See `AGENTS.md` §4 for the catalog.
