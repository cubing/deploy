import { argv, exit } from "node:process";

import { parseArgs } from "node:util";

export function printHelpAndExit(exitCode: number): void {
  console.log(
    `Usage: npx @cubing/deploy (or: bun x @cubing/deploy)

Deploy to a shared host like Dreamhost with minimal configuration.

Options:

    --help
    --dry-run
    --create-folder-on-server

Requires \`rsync\` to be installed. Reads target URLs from a field in \`package.json\` in the current folder:

{
  "@cubing/deploy": {
    "https://experiments.cubing.net/test/deploy": {}
  },
}

This example will be deployed from the following folder:

    ./dist/web/experiments.cubing.net/test/deploy/

The following ignored patterns are always included:

- \`.git\`
- \`.DS_Store\` (impossible to prevent macOS from creating)

Target URLs may include any of the following options:

{
  "@cubing/deploy": {
    "$schema": "./node_modules/@cubing/deploy/config-schema.json",
    "https://experiments.cubing.net/test/deploy": {
      "fromLocalDir": "./dist/custom-path/",
      "additionalExcludes": [".cache"]
    }
  }
}
`,
  );
  exit(exitCode);
}

export const { values: options } = parseArgs({
  args: argv.slice(2),
  options: {
    help: {
      type: "boolean",
    },
    "dry-run": {
      type: "boolean",
    },
    "create-folder-on-server": {
      type: "boolean",
    },
  },
  strict: true,
});
