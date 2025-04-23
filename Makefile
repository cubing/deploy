.PHONY: lint
lint: setup
	bun x @biomejs/biome check

.PHONY: format
format: setup
	bun x @biomejs/biome check --write

.PHONY: publish
publish:
	npm publish

.PHONY: update-readme-cli-help
update-readme-cli-help: setup
	bun x readme-cli-help "bun run src/main.ts --help"

.PHONY: check-readme-cli-help
check-readme-cli-help: setup
	bun x readme-cli-help --check-only "bun run src/main.ts --help"

.PHONY: setup
setup:
	bun install --frozen-lockfile

.PHONY: clean
clean:
	rm -rf ./package-lock.json

.PHONY: deploy
deploy: setup
	# Since `@cubing/deploy` is the repo package, we can invoke it by package name instead of manually specifying the entry point.
	bun x @cubing/deploy

.PHONY: reset
reset: clean
	rm -rf ./node_modules

.PHONY: prepublishOnly
prepublishOnly: lint check-readme-cli-help
