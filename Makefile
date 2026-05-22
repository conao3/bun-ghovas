.PHONY: dev typecheck test fmt

dev:
	bun run src/server/index.ts

typecheck:
	bun x tsc --noEmit

test:
	bun test

fmt:
	nix fmt
