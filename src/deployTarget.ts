import assert from "node:assert";
import { options } from "./options";
import type { TargetOptions } from "./targetEntries";

function barebonesShellEscape(s: string): string {
  return s.replaceAll('"', '\\"');
}

function printCommand(c: string[]): void {
  console.log(c.map((s) => `"${barebonesShellEscape(s)}"`).join(" "));
}

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
  if (options["dry-run"]) {
    if (options["create-folder-on-server"]) {
      console.write("[--dry-run] ");
      printCommand(sshCommand);
    }
    console.write("[--dry-run] ");
    printCommand(rsyncCommand);
  } else {
    if (options["create-folder-on-server"]) {
      assert((await Bun.spawn(sshCommand).exited) === 0);
    }
    assert((await Bun.spawn(rsyncCommand).exited) === 0);
    console.log(`
Successfully deployed:

    ${url}
`);
  }
}
