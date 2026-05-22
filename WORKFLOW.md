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
    git clone --depth 1 git@github.com:conao3/bun-ghovas.git .
    git config user.name "Naoya Yamashita"
    git config user.email "conao3@gmail.com"
agent:
  max_concurrent_agents: 1
  max_turns: 10
codex:
  command: claude-app-server
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

These env vars are already exported in the shell:

- `LINEAR_API_KEY` — Linear GraphQL `https://api.linear.app/graphql` with `Authorization: $LINEAR_API_KEY` (no Bearer prefix)
- `GITHUB_TOKEN` — `gh` CLI is preconfigured

Helper to move the Linear issue by state name:

```bash
move_issue() {
  local state_name="$1"
  local issue_id state_id
  issue_id=$(curl -sS https://api.linear.app/graphql \
    -H "Authorization: $LINEAR_API_KEY" -H "Content-Type: application/json" \
    -d "{\"query\":\"query{issue(id:\\\"{{ issue.identifier }}\\\"){id}}\"}" \
    | jq -r '.data.issue.id')
  state_id=$(curl -sS https://api.linear.app/graphql \
    -H "Authorization: $LINEAR_API_KEY" -H "Content-Type: application/json" \
    -d "{\"query\":\"query{workflowStates(filter:{name:{eq:\\\"$state_name\\\"}}){nodes{id}}}\"}" \
    | jq -r '.data.workflowStates.nodes[0].id')
  curl -sS https://api.linear.app/graphql \
    -H "Authorization: $LINEAR_API_KEY" -H "Content-Type: application/json" \
    -d "{\"query\":\"mutation{issueUpdate(id:\\\"$issue_id\\\",input:{stateId:\\\"$state_id\\\"}){success}}\"}"
}
```

Helper to attach a PR URL to the Linear issue:

```bash
attach_pr() {
  local pr_url="$1"
  local issue_id
  issue_id=$(curl -sS https://api.linear.app/graphql \
    -H "Authorization: $LINEAR_API_KEY" -H "Content-Type: application/json" \
    -d "{\"query\":\"query{issue(id:\\\"{{ issue.identifier }}\\\"){id}}\"}" \
    | jq -r '.data.issue.id')
  curl -sS https://api.linear.app/graphql \
    -H "Authorization: $LINEAR_API_KEY" -H "Content-Type: application/json" \
    -d "{\"query\":\"mutation{attachmentLinkURL(issueId:\\\"$issue_id\\\",url:\\\"$pr_url\\\"){success}}\"}"
}
```

Branch name convention: `issue-{{ issue.identifier | downcase }}`.

## Route by current status

Read `{{ issue.state }}` and follow the matching block. Do not run blocks that do not match.

### Status: `Todo`

1. `move_issue "In Progress"`.
2. Implement the change described in the issue. Make focused edits, keep diffs small.
3. `make typecheck` (and `make test` if relevant) before committing.
4. Commit on branch `issue-{{ issue.identifier | downcase }}` with a Conventional Commits message that summarises the change.
5. `git push -u origin <branch>`.
6. `pr_url=$(gh pr create --fill --base master | tail -n1)` and `attach_pr "$pr_url"`.
7. `move_issue "Human Review"`.
8. Stop.

### Status: `In Progress`

The previous turn was interrupted mid-flight. Reconstruct what is missing:

1. `git status` and `gh pr list --head issue-{{ issue.identifier | downcase }} --json url --jq '.[0].url'` to see what has already happened.
2. Finish whichever step from the Todo block is incomplete (edits / typecheck / commit / push / PR / attach).
3. `move_issue "Human Review"`.
4. Stop.

### Status: `Rework`

Reviewer asked for changes on the PR. Gather feedback, apply, and bounce back.

1. Identify PR URL from Linear issue attachments (`curl ... attachments(...)`) or via `gh pr list --head issue-{{ issue.identifier | downcase }}`.
2. Collect all reviewer feedback:
   - `gh pr view <pr> --comments` — top-level PR comments
   - `gh api repos/conao3/bun-ghovas/pulls/<pr>/comments` — inline review comments
   - `gh pr view <pr> --json reviews --jq '.reviews[]'` — review summaries
3. For each actionable comment:
   - If valid, edit the file accordingly and stage.
   - If you disagree, post a short justified reply on the same thread (`gh api ... -X POST ... /comments/<id>/replies`) instead of editing.
4. If you made any edits, run `make typecheck` (and `make test` if relevant), commit with message `fix: address review feedback for {{ issue.identifier }}` and `git push`.
5. Reply to the PR (top-level comment) summarising what was changed or pushed back, one line per item.
6. `move_issue "Human Review"`.
7. Stop. Do **not** delete or recreate the branch; reuse the existing PR.

### Status: `Merging`

Human approved. Land the PR and close the loop.

1. Identify the PR URL/number for branch `issue-{{ issue.identifier | downcase }}`.
2. `gh pr merge <pr> --squash --delete-branch`.
3. Confirm merge: `gh pr view <pr> --json state --jq '.state'` should return `MERGED`.
4. `move_issue "Done"`.
5. Stop.

### Status: anything else (`Human Review`, `Backlog`, terminal states)

Stop immediately without touching anything. The orchestrator should not have routed here.

## Guardrails

- Never call `gh pr merge` outside the `Merging` branch.
- Never edit the issue body/description; only update state via `move_issue`.
- Never amend or force-push history that is already on `origin`. Make a new commit for fixes.
- If a step fails, retry once with adjusted args, then stop and post a single-line failure note as a top-level PR comment (if a PR exists) or as a Linear attachment otherwise.
