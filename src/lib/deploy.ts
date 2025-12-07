import { PrintableShellCommand } from "printable-shell-command";
import type { Args } from "./args";

const DEFAULT_EXCLUDES = [".DS_Store", ".git", ".jj", "node_modules"];

export interface TargetOptions {
  username?: string;
  fromLocalDir?: string;
  skipDefaultExcludes?: true | string[];
  additionalExcludes?: string[];
}

export const targetOptionsFields = {
  username: true,
  fromLocalDir: true,
  skipDefaultExcludes: true,
  additionalExcludes: true,
}; // TODO: make this more DRY

function ensureTrailingSlash(s: string): string {
  if (s.at(-1) !== "/") {
    return `${s}/`;
  }
  return s;
}

// TODO: reuse connections based on domain or host IP.
export async function deploy(
  targetURL: string,
  targetOptions?: TargetOptions,
  runtimeArgs?: Args,
): Promise<void> {
  async function printAndRun(command: PrintableShellCommand) {
    command.print();
    if (!runtimeArgs?.["dry-run"]) {
      await command.spawnTransparently().success;
    }
  }

  targetURL = ensureTrailingSlash(targetURL); // Only sync folder contents.

  const url = new URL(targetURL); // TODO: avoid URL encoding special chars
  if (url.username) {
    throw new Error(
      "URL must not contain a username. Specify this in the options or your SSH config instead.",
    );
  }
  if (url.password) {
    throw new Error(
      "URL must not contain a password. Specify this in your SSH config instead.",
    );
  }

  let localDistPath: string;
  if (targetOptions?.fromLocalDir) {
    localDistPath = ensureTrailingSlash(targetOptions.fromLocalDir);
  } else {
    localDistPath = ensureTrailingSlash(
      `./dist/web/${url.hostname}${url.pathname}`,
    );
  }

  const serverFolder = url.hostname + url.pathname;
  const login_host = (() => {
    if (targetOptions?.username) {
      // Encode username by round-tripping it through a URL.
      const tempURL = new URL("https://example.com");
      tempURL.username = targetOptions.username;
      const { username } = tempURL;
      if (username !== targetOptions) {
        console.warn(
          "WARNING: Encoded username does not match the specified username. Is it valid?",
        );
      }

      return `${username}@${url.hostname}`;
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

    if (targetOptions?.skipDefaultExcludes !== true) {
      const toSkip = new Set(targetOptions?.skipDefaultExcludes ?? []);
      for (const pattern of DEFAULT_EXCLUDES) {
        if (!toSkip.has(pattern)) {
          rsyncCommandArgs.push(["--exclude", pattern]);
        }
      }
    }
    for (const additionalExclude of targetOptions?.additionalExcludes ?? []) {
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
  if (runtimeArgs?.["create-folder-on-server"]) {
    await printAndRun(sshMkdirCommand);
  }
  try {
    await printAndRun(rsyncCommand);
  } catch (e) {
    if (
      await askYesNo(
        "Deployment failed. Try again by creating folder on the server?",
        { default: "y" },
      )
    ) {
      await printAndRun(sshMkdirCommand);
      await printAndRun(rsyncCommand);
    } else {
      throw e;
    }
  }
  const printURL = new URL(url);
  console.log(`
Successfully deployed:

  ${printURL}
`);
}

async function askYesNo(
  question: string,
  options?: { default?: "y" | "n" },
): Promise<boolean> {
  function letter(c: string) {
    return options?.default === c ? c.toUpperCase() : c;
  }
  while (true) {
    const readline = (await import("node:readline")).createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    const q = (await import("node:util"))
      .promisify(readline.question)
      .bind(readline) as unknown as (question: string) => Promise<string>;
    const yn = `${letter("y")}/${letter("n")}`;
    const response: string = await q(`${question} (${yn}) `);
    readline.close();
    const choice = response.toLowerCase() || options?.default;
    if (choice === "y") {
      return true;
    }
    if (choice === "n") {
      return false;
    }
  }
}
