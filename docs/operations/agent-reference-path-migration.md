# Agent Reference Path Migration

## Purpose

This instruction applies to Antigravity, Claude Code, and Codex working in
this repository. It records the approved documentation partition and prevents
silent changes to user-authored material.

## Current locations

| Material | Current repository path |
| --- | --- |
| User-authored Vibe Clinic rebranding plans | `docs/plans/[user-docs] vibe-clinic-rebranding/` |
| Handoff records | `docs/handoff/` |
| Operational documents | `docs/operations/` |
| Documentation images | `docs/assets/` |
| VS Code extension | `integrations/vscode-extension/` |
| Claude Vibe Check integration | `integrations/claude-vibe-check/` |
| MCP server | `backend/mcp-server/index.js` |

## Legacy-to-current reference map

| Do not create or refer to | Refer to instead |
| --- | --- |
| `# Vibe Clinic (바이브 클리닉) 리브랜딩 구현 계획/` | `docs/plans/[user-docs] vibe-clinic-rebranding/` |
| `GPT-handoff/` | `docs/handoff/gpt-handoff/` |
| `docs/plans/rebranding/` | `docs/plans/[user-docs] vibe-clinic-rebranding/` |
| `vscode-extension/` | `integrations/vscode-extension/` |
| `claude_vibe_check_mode/` | `integrations/claude-vibe-check/` |
| `mcp-server/index.js` | `backend/mcp-server/index.js` |

## Mandatory handling rule

Before moving, renaming, or deleting a user-authored file or folder, an agent
must state the exact old absolute path, proposed new absolute path, reason,
and recovery path, then receive explicit user approval. A repository cleanup,
partition plan, or inferred intent is not approval.

## Tool instruction

- Antigravity, Claude Code, and Codex must update only their project-local
  references according to this table.
- Do not change external tool configuration, credentials, or user files unless
  that action has separately been approved.