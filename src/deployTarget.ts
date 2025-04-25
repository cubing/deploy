import { PrintableShellCommand } from "printable-shell-command";
import { options } from "./options";
import type { TargetOptions } from "./targetEntries";

function ensureTrailingSlash(s: string): string {
  if (s.at(-1) !== "/") {
    return `${s}/`;
  }
  return s;
}

async function printAndRunSuccess(
  command: PrintableShellCommand,
): Promise<boolean> {
  command.print();
  if (!options["dry-run"]) {
    const { exited } = Bun.spawn(command.forBun());
    return (await exited) === 0;
  }
  return true;
}

async function printAndRun(command: PrintableShellCommand) {
  if (!(await printAndRunSuccess(command))) {
    throw new Error("Command failed.");
  }
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
    mkdirCommand.getPrintableCommand({ argumentLineWrapping: "inline" }),
  ]);

  console.log("--------");
  console.log(`Deploying from: ${localDistPath}`);
  console.log(`Deploying to: ${rsyncTarget}`);
  if (options["create-folder-on-server"]) {
    await printAndRun(sshMkdirCommand);
  }
  if (!(await printAndRunSuccess(rsyncCommand))) {
    if (
      await askYesNoWithDefaultYes(
        "Deployment failed. Try again by creating folder on the server?",
      )
    ) {
      await printAndRun(sshMkdirCommand);
      await printAndRun(rsyncCommand);
    }
  }
  console.log(`
Successfully deployed:

  ${url}
`);
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
