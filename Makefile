.PHONY: lint
lint:
	npx @biomejs/biome check ./src

.PHONY: format
format:
	npx @biomejs/biome check ./src

.PHONY: publish
publish:
	npm publish

.PHONY: update-readme-cli-help
update-readme-cli-help:
	bun x readme-cli-help --expect-exit-code 1 "bun run src/main.ts --help"

.PHONY: check-readme-cli-help
check-readme-cli-help:
	bun x readme-cli-help --expect-exit-code 1 --check-only "bun run src/main.ts --help"
