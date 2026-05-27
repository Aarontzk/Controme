# CLAUDE.md

This project's instructions are shared with Codex. The canonical content lives in
**AGENTS.md** and is imported below — edit `AGENTS.md`, not this file, so both agents stay
in sync.

@AGENTS.md

---

## Claude Code specifics

- **Skills**: `.claude/skills/<name>/SKILL.md` are auto-discovered. Invoke as slash commands
  (e.g. `/create-project`, `/create-collection`, `/review-code`, `/create-tests`) or let
  them load as background context. Full catalog in §4 of AGENTS.md.
- **Subagents**: the user's global `~/.claude/agents/` (planner, architect, tdd-guide,
  code-reviewer, security-reviewer, build-error-resolver, e2e-runner, refactor-cleaner,
  doc-updater) are available — prefer them over re-deriving review/planning logic here.
- **MCP**: copy `.mcp.json.example` → `.mcp.json` (gitignored) and fill tokens. Preconfigured
  Buildpad/DaaS/platform servers (`buildpad`, `daas`, `buildpad-platform`) are the project's
  backend + Amplify management tools.
- **Collaboration**: Codex runs in parallel in another tab. Follow the branch-per-task and
  pull-before-push rules in §0 of AGENTS.md to avoid conflicts.
