# Documentation

The front door is the [root README](../README.md): what the project is, how to
install it, and how to run it. [`../CLAUDE.md`](../CLAUDE.md) is the working
guide — folder roles, naming, and the rules every change keeps.

Everything deeper lives here.

| File | What it is |
|---|---|
| [`RUNBOOK.md`](RUNBOOK.md) | Start the whole stack, and follow a conversation through all three pipelines |
| [`ROADMAP.md`](ROADMAP.md) | The staging plan, the data model, and a short record of what each stage shipped |
| [`decisions/`](decisions) | Why each piece is built the way it is, written when it was built |
| [`seo/`](seo) | Search research, keywords, content calendar, off-page playbook and measurement |

## Decisions

Design records. Each one is the reasoning behind a stage: what was chosen, what
was rejected, and what it cost. They are dated and not kept up to date after the
fact — when one disagrees with the code, the code is right.

| File | Built | Subject |
|---|---|---|
| [`decisions/stage-2.5-dropped.md`](decisions/stage-2.5-dropped.md) | 2026-09-12 | A paid voice provider, investigated and dropped |
| [`decisions/stage-4-accounts.md`](decisions/stage-4-accounts.md) | 2026-09-12 | Google sign-in, per-account conversations, consent |
| [`decisions/multi-person.md`](decisions/multi-person.md) | 2026-09-14 | One avatar per account, the directory, the admin portal |
| [`decisions/stage-5-memory.md`](decisions/stage-5-memory.md) | 2026-09-15 | Long-term memory and return reminders |
| [`decisions/owner-view.md`](decisions/owner-view.md) | 2026-09-15 | Owners reading their visitors, and the weekly summary email |
