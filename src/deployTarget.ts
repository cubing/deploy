import assert from "node:assert";
import { options } from "./options";
import type { TargetOptions } from "./targetEntries";
import { PrintableShellCommand } from "printable-shell-command";

function ensureTrailingSlash(s: string): string {
  if (s.at(-1) !== "/") {
    return `${s}/`;
  }
  return s;
}

// TODO: reuse connections based on domain or host IP.
export async function deployTarget(
  targetURL: string,
  targetOptions: TargetOptions,
): Promise<void> {
  // biome-ignore lint/style/noParameterAssign: Safety mechanism.
  targetURL = ensureTrailingSlash(targetURL); // Only sync folder contents.

  const url = new URL(targetURL); // TODO: avoid URL encoding special chars

  let localDistPath: string;
  if (targetOptions.fromLocalDir) {
    localDistPath = ensureTrailingSlash(targetOptions.fromLocalDir);
  } else {
    localDistPath = ensureTrailingSlash(
      `./dist/web/${url.hostname}${url.pathname}`,
    );
  }

  const serverFolder = url.hostname + url.pathname;
  const login_host = (() => {
    if (url.username) {
      return `${url.username}@${url.hostname}`;
    }
    return url.hostname;
  })();
  const rsyncTarget = `${login_host}:~/${serverFolder}`;

  const rsyncCommand = (() => {
    const rsyncCommandArgs: (string | [string, string])[] = ["-avz"];

    /* TODO: The built-in macOS version is super old and doesn't support `--mkpath`. */
    // if (options["create-folder-on-server"]) {
    //   rsyncCommandArgs.push("--mkpath");
    // }

    rsyncCommandArgs.push(["--exclude", ".DS_Store"]);
    rsyncCommandArgs.push(["--exclude", ".git"]);
    for (const additionalExclude of targetOptions.additionalExcludes ?? []) {
      rsyncCommandArgs.push(["--exclude", additionalExclude]);
    }
    rsyncCommandArgs.push(localDistPath);

    rsyncCommandArgs.push(rsyncTarget);
    return new PrintableShellCommand("rsync", rsyncCommandArgs);
  })();

  const mkdirCommand = new PrintableShellCommand("mkdir", ["-p", serverFolder]);
  const sshMkdirCommand = new PrintableShellCommand("ssh", [
    login_host,
    mkdirCommand.getPrintableCommand(),
  ]);

  console.log("--------");
  console.log(`Deploying from: ${localDistPath}`);
  console.log(`Deploying to: ${rsyncTarget}`);
  if (options["dry-run"]) {
    if (options["create-folder-on-server"]) {
      console.log("[--dry-run] The following command would be run:");
      sshMkdirCommand.print();
    }
    console.log("[--dry-run] The following command would be run:");
    rsyncCommand.print();
  } else {
    if (options["create-folder-on-server"]) {
      assert((await Bun.spawn(sshMkdirCommand.forBun()).exited) === 0);
    }
    if ((await Bun.spawn(rsyncCommand.forBun()).exited) !== 0) {
      if (
        await askYesNoWithDefaultYes(
          "Deployment failed. Try again by creating folder on the server?",
        )
      ) {
        assert((await Bun.spawn(sshMkdirCommand.forBun()).exited) === 0);
        assert((await Bun.spawn(rsyncCommand.forBun()).exited) === 0);
      }
    }
    console.log(`
Successfully deployed:

    ${url}
`);
  }
}

async function askYesNoWithDefaultYes(question: string): Promise<boolean> {
  const readline = (await import("node:readline")).createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const q = (await import("node:util"))
    .promisify(readline.question)
    .bind(readline) as unknown as (question: string) => Promise<string>;
  const response: string = await q(`${question} (Y/n) `);
  return response.toLowerCase() === "y";
}
