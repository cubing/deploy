.PHONY: build
build: setup
	bun run ./script/build.ts

.PHONY: check
check: lint test build

.PHONY: test
test: lint check-readme-cli-help

.PHONY: lint
lint: setup check-readme-cli-help
	bun x @biomejs/biome check
	bun x tsc --noEmit --project .

.PHONY: format
format: setup update-readme-cli-help
	bun x @biomejs/biome check --write

.PHONY: publish
publish:
	npm publish

.PHONY: update-readme-cli-help
update-readme-cli-help: setup
	bun x readme-cli-help update

.PHONY: check-readme-cli-help
check-readme-cli-help: setup
	bun x readme-cli-help check

.PHONY: setup
setup:
	bun install --frozen-lockfile

.PHONY: clean
clean:
	rm -rf ./dist ./package-lock.json

.PHONY: deploy
deploy: setup
	mkdir -p ./dist/web
	cp -R ./src/web/ ./dist/web/
	bun run src/cli/main.ts

.PHONY: test
test: setup
	bun test

.PHONY: reset
reset: clean
	rm -rf ./node_modules

.PHONY: prepublishOnly
prepublishOnly: lint check-readme-cli-help clean build
