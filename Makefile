.PHONY: lint
lint:
	npx @biomejs/biome check

.PHONY: format
format:
	npx @biomejs/biome check --write

.PHONY: publish
publish:
	npm publish

.PHONY: update-readme-cli-help
update-readme-cli-help:
	bun x readme-cli-help "bun run src/main.ts --help"

.PHONY: check-readme-cli-help
check-readme-cli-help:
	bun x readme-cli-help --check-only "bun run src/main.ts --help"

.PHONY: clean
clean:
	rm -rf ./package-lock.json

.PHONY: reset
reset: clean
	rm -rf ./node_modules

.PHONY: prepublishOnly
prepublishOnly: lint check-readme-cli-help
