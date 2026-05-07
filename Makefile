.PHONY: build
build: build-js build-types

.PHONY: build-js
build-js: setup
	bun run -- ./script/build.ts

.PHONY: build-types
build-types: setup
	bun x -- bun-dx --package @typescript/native-preview tsgo -- --project ./tsconfig.types.json

.PHONY: check
check: lint build check-package.json

.PHONY: lint
lint: lint-biome lint-typescript check-readme-cli-help

.PHONY: lint-biome
lint-biome: setup
	bun x -- bun-dx --package @biomejs/biome biome -- check

.PHONY: lint-typescript
lint-typescript: setup
	bun x -- bun-dx --package @typescript/native-preview tsgo -- --project ./tsconfig.json

.PHONY: format
format: setup update-readme-cli-help
	bun x -- bun-dx --package @biomejs/biome biome -- check --write

.PHONY: check-package.json
check-package.json: build
	bun x -- bun-dx --package @cubing/dev-config package.json -- check

.PHONY: publish
publish:
	npm publish

.PHONY: update-readme-cli-help
update-readme-cli-help: setup
	bun x readme-cli-help update

.PHONY: check-readme-cli-help
check-readme-cli-help: setup
	bun x -- bun-dx --package readme-cli-help readme-cli-help -- check

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
