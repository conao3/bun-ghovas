---
tracker:
  kind: linear
  project_slug: "bun-ghovas-17a205ff027e"
  active_states:
    - Todo
    - In Progress
    - Merging
    - Rework
  terminal_states:
    - Closed
    - Cancelled
    - Canceled
    - Duplicate
    - Done
polling:
  interval_ms: 5000
workspace:
  root: ~/code/symphony-workspaces
hooks:
  after_create: |
    gh repo clone conao3/bun-ghovas . -- --depth 1
agent:
  max_concurrent_agents: 1
  max_turns: 10
codex:
  command: ANTHROPIC_MODEL=claude-sonnet-4-6 claude-app-server
  approval_policy: never
  thread_sandbox: workspace-write
  turn_sandbox_policy:
    type: workspaceWrite
---

You are working on Linear ticket `{{ issue.identifier }}`: {{ issue.title }}

Issue context:
- Identifier: {{ issue.identifier }}
- Title: {{ issue.title }}
- Current status: **{{ issue.state }}**
- URL: {{ issue.url }}

Description:
{% if issue.description %}
{{ issue.description }}
{% else %}
(No description provided.)
{% endif %}

## Tools

- Linear MCP server is connected (OAuth). Use `mcp__linear__save_issue` to update state (pass `state` by name: `"In Progress"`, `"Human Review"`, `"Done"`) and to attach PR URLs via `links: [{ url, title }]`. Use `mcp__linear__get_issue` / `mcp__linear__list_issues` for reads.
- `gh` CLI is available and authenticated. Use it for all GitHub operations.

Branch name convention: `issue-{{ issue.identifier | downcase }}`.

## Route by current status

Read `{{ issue.state }}` and follow the matching block. Do not run blocks that do not match.

### Status: `Todo`

1. Move the issue to `In Progress` via `mcp__linear__save_issue` with `id="{{ issue.identifier }}"`, `state="In Progress"`.
2. Implement the change described in the issue. Make focused edits, keep diffs small.
3. `make typecheck` (and `make test` if relevant) before committing.
4. Commit on branch `issue-{{ issue.identifier | downcase }}` with a Conventional Commits message that summarises the change.
5. `git push -u origin <branch>`.
6. Create the PR: `pr_url=$(gh pr create --fill --base master | tail -n1)`. Attach it to the issue via `mcp__linear__save_issue` with `id="{{ issue.identifier }}"`, `links=[{ url: "<pr_url>", title: "PR" }]`.
7. Move the issue to `Human Review` via `mcp__linear__save_issue`.
8. Stop.

### Status: `In Progress`

The previous turn was interrupted mid-flight. Reconstruct what is missing:

1. `git status` and `gh pr list --head issue-{{ issue.identifier | downcase }} --json url --jq '.[0].url'` to see what has already happened.
2. Finish whichever step from the `Todo` block is incomplete (edits / typecheck / commit / push / PR / attach).
3. Move the issue to `Human Review` via `mcp__linear__save_issue`.
4. Stop.

### Status: `Rework`

Reviewer asked for changes on the PR. Gather feedback, apply, and bounce back.

1. Identify the PR URL: `gh pr list --head issue-{{ issue.identifier | downcase }} --json url --jq '.[0].url'`.
2. Collect all reviewer feedback:
   - `gh pr view <pr> --comments` — top-level PR comments
   - `gh api repos/conao3/bun-ghovas/pulls/<pr>/comments` — inline review comments
   - `gh pr view <pr> --json reviews --jq '.reviews[]'` — review summaries
3. For each actionable comment:
   - If valid, edit the file accordingly and stage.
   - If you disagree, post a short justified reply on the same thread (`gh api ... -X POST ... /comments/<id>/replies`) instead of editing.
4. If you made any edits, run `make typecheck` (and `make test` if relevant), commit with message `fix: address review feedback for {{ issue.identifier }}` and `git push`.
5. Reply to the PR (top-level comment) summarising what was changed or pushed back, one line per item.
6. Move the issue to `Human Review` via `mcp__linear__save_issue`.
7. Stop. Do **not** delete or recreate the branch; reuse the existing PR.

### Status: `Merging`

Human approved. Land the PR and close the loop.

1. Identify the PR URL/number for branch `issue-{{ issue.identifier | downcase }}`.
2. `gh pr merge <pr> --squash --delete-branch`.
3. Confirm merge: `gh pr view <pr> --json state --jq '.state'` should return `MERGED`.
4. Move the issue to `Done` via `mcp__linear__save_issue`.
5. Stop.

### Status: anything else (`Human Review`, `Backlog`, terminal states)

Stop immediately without touching anything. The orchestrator should not have routed here.

## Guardrails

- Never call `gh pr merge` outside the `Merging` branch.
- Never edit the issue body/description; only update state via `mcp__linear__save_issue`.
- Never amend or force-push history that is already on `origin`. Make a new commit for fixes.
- If a step fails, retry once with adjusted args, then stop and post a single-line failure note as a top-level PR comment (if a PR exists) or as a Linear attachment via `mcp__linear__save_issue` with `links` otherwise.
