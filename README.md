# @cubing/deploy

Dreamhost-compatible deploys using [`bun`](https://bun.sh/) and `rsync`.

1. Install:

```shell
bun add --development @cubing/deploy
# or
npm install --save-dev @cubing/deploy
```

2. Add URLs to `package.json`:

```json
{
  "@cubing/deploy": {
    "https://experiments.cubing.net/test/deploy": {}
  }
}
```

3. Run:

```shell
bun x @cubing/deploy
```

## Help

````cli-help
Usage: npx @cubing/deploy (or: bun x @cubing/deploy)

Deploy to a shared host like Dreamhost with minimal configuration.

Runtime arguments:

    --help
    --dry-run
    --create-folder-on-server

Requires `rsync` to be installed. Reads target URLs from a field in `package.json` in the current folder:

{
  "$schema": "./node_modules/@cubing/deploy/config-schema.package.json",
  "@cubing/deploy": {
    "https://experiments.cubing.net/test/deploy": {}
  }
}

This example will be deployed from the following folder:

    ./dist/web/experiments.cubing.net/test/deploy/

The following ignored patterns are always included:

- `.DS_Store` (impossible to prevent macOS from creating)
- `.git`
- `.jj`
- `node_modules`

Target URLs may include any of the following options:

{
  "@cubing/deploy": {
    "$schema": "./node_modules/@cubing/deploy/config-schema.json",
    "https://experiments.cubing.net/test/deploy": {
      "username": "myusername",
      "fromLocalDir": "./dist/custom-path/",
      "skipDefaultExcludes": ["node_modules"],
      "additionalExcludes": [".cache"]
    }
  }
}
````
