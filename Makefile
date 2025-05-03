.PHONY: build
build: setup
	bun run ./script/build.ts

.PHONY: test
test: lint check-readme-cli-help

.PHONY: lint
lint: setup
	bun x @biomejs/biome check
	bun x tsc --noEmit --project .

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
	rm -rf ./dist/bin ./package-lock.json

.PHONY: deploy
deploy: setup
	bun run src/main.ts

.PHONY: reset
reset: clean
	rm -rf ./node_modules

.PHONY: prepublishOnly
prepublishOnly: lint check-readme-cli-help clean build
