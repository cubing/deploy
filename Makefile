.PHONY: lint
lint:
	npx @biomejs/biome check ./src

.PHONY: format
format:
	npx @biomejs/biome check ./src

.PHONY: publish
publish:
	npm publish
