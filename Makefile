.PHONY: build
build: setup
	bun run ./script/build.ts

.PHONY: check
check: lint test build check-package.json

.PHONY: test
test: lint check-readme-cli-help

.PHONY: lint
lint: setup check-readme-cli-help
	bun x @biomejs/biome check
	bun x tsc --noEmit --project .

.PHONY: format
format: setup update-readme-cli-help
	bun x @biomejs/biome check --write

.PHONY: check-package.json
check-package.json: build
	bun x --package @cubing/dev-config package.json check

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

.PHONY: deploy
deploy: setup
	mkdir -p ./dist/web
	cp -R ./src/web/ ./dist/web/
	bun run src/cli/main.ts

.PHONY: test
test: setup
	bun test

RM_RF = bun -e 'process.argv.slice(1).map(p => process.getBuiltinModule("node:fs").rmSync(p, {recursive: true, force: true, maxRetries: 5}))' --

.PHONY: clean
clean:
	${RM_RF} ./dist/

.PHONY: reset
reset: clean
	${RM_RF} ./node_modules/

.PHONY: prepublishOnly
prepublishOnly: clean check build
