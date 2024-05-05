#!/usr/bin/env bun

import assert from "node:assert";
import { exit } from "node:process";
import { parseArgs } from "node:util";
import { argv } from "bun";

function printHelpAndExit(): void {
  console.log(
    `Usage: bun x @cubing/deploy

Deploy to a shared host like Dreamhost with minimal configuration.

Options:

    --help
    --dry-run
    --create-folder-on-server

Requires \`bun\` and \`rsync\` to be installed. Reads target URLs from a field in \`package.json\` in the current folder:

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
    "https://experiments.cubing.net/test/deploy": {
      "fromLocalDir": "./dist/custom-path/"
    }
  }
}
`,
  );
  exit(1);
}

const { values } = parseArgs({
  args: argv.slice(2),
  options: {
    "help": {
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

function barebonesShellEscape(s: string): string {
  return s.replaceAll('"', '\\"');
}

function printCommand(c: string[]): void {
  console.log(c.map((s) => `"${barebonesShellEscape(s)}"`).join(" "));
}

interface TargetOptions {
  fromLocalDir?: string
}

function ensureTrailingSlash(s: string): string {
  if (s.at(-1) !== "/") {
    return `${s}/`;
  }
  return s;
}

// TODO: reuse connections based on domain or host IP.
async function deployTarget(targetURL: string, targetOptions: TargetOptions): Promise<void> {
  targetURL = ensureTrailingSlash(targetURL); // // Only sync folder contents.
  const url = new URL(targetURL); // TODO: avoid URL encoding special chars

  let localDistPath: string;
  if (targetOptions.fromLocalDir) {
    localDistPath = ensureTrailingSlash(targetOptions.fromLocalDir);
  } else {
   localDistPath = ensureTrailingSlash(`./dist/web/${url.hostname}${url.pathname}`);
  }

  const rsyncCommand = ["rsync", "-avz"];
  // rsyncCommand.push("--mkpath"); // TODO: requires `rsync` v3.2.3 (https://stackoverflow.com/a/65435579) but Dreamhost is stuck on 3.1.3. 😖
  rsyncCommand.push("--exclude", ".DS_Store");
  rsyncCommand.push("--exclude", ".git"); // TODO: we probably don't need this?
  rsyncCommand.push(localDistPath);

  let login_host = url.hostname;
  if (url.username) {
    login_host = `${url.username}@${url.hostname}`;
  }

  const serverFolder = url.hostname + url.pathname;

  const rsyncTarget = `${login_host}:~/${serverFolder}`;
  rsyncCommand.push(rsyncTarget);

  const sshCommand = [
    "ssh",
    login_host,
    `mkdir -p "${barebonesShellEscape(serverFolder)}"`,
  ];

  console.log("--------");
  console.log(`Deploying from: ${localDistPath}`);
  console.log(`Deploying to: ${rsyncTarget}`);
  if (values["dry-run"]) {
    if (values["create-folder-on-server"]) {
      console.write("[--dry-run] ");
      printCommand(sshCommand);
    }
    console.write("[--dry-run] ");
    printCommand(rsyncCommand);
  } else {
    if (values["create-folder-on-server"]) {
      assert((await Bun.spawn(sshCommand).exited) === 0);
    }
    assert((await Bun.spawn(rsyncCommand).exited) === 0);
    console.log(`
Successfully deployed:

    ${url}
`);
  }
}

if (values.help) {
  printHelpAndExit();
}

const packageJSONFile = Bun.file("package.json");
if (! (await packageJSONFile.exists()) ) {
  console.error("Please run `@cubing/deploy` in a folder with a `package.json` file.")
  printHelpAndExit();
}
const packageJSON = await packageJSONFile.json();
const cubingDeployArgs: Record<string, TargetOptions>[] = packageJSON["@cubing/deploy"];
if (!cubingDeployArgs) {
  console.error("No `@cubing/deploy` entry was found in `package.json`.");
  printHelpAndExit();
}
if (typeof cubingDeployArgs !== "object") {
  console.error("The `@cubing/deploy` in `package.json` must be an object with URLs as keys.");
  printHelpAndExit();
}
// TODO: warn on unrecognized fields
const targetEntries = Object.entries(cubingDeployArgs);

if (targetEntries.length === 0) {
  printHelpAndExit();
}

for (const targetEntry of targetEntries) {
  await deployTarget(...targetEntry);
}
