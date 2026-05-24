# attempts-cap patch verification

The Symphony orchestrator has been rebuilt with `symphony-attempts-cap.patch`. The
`agent.max_attempts_per_issue` field is configurable in `WORKFLOW.md`; when the per-issue
attempt counter reaches that cap, the agent prompt receives `final_attempt: true` and
must follow the `{% if final_attempt %}` branch (no implementation, summary + Cancelled).
