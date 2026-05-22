.PHONY: dev typecheck test fmt lint

dev:
	bun run src/server/index.ts

typecheck:
	bun x tsc --noEmit

test:
	bunx vitest run

fmt:
	nix fmt
	bunx oxfmt src/ tests/ scripts/

lint:
	bunx oxlint --config .oxlintrc.json src/ tests/ scripts/
	bunx knip
