import { exit } from "node:process";
import { printHelpAndExit } from "./options";

export interface TargetOptions {
  fromLocalDir?: string;
  additionalExcludes?: string[];
}
const targetOptionsFields = { fromLocalDir: true, additionalExcludes: true }; // TODO: make this more DRY

const packageJSONFile = Bun.file("package.json");
if (!(await packageJSONFile.exists())) {
  console.error(
    "Please run `@cubing/deploy` in a folder with a `package.json` file.",
  );
  printHelpAndExit(1);
}
const packageJSON = await packageJSONFile.json();
const cubingDeployArgs: Record<string, TargetOptions>[] =
  packageJSON["@cubing/deploy"];
if (!cubingDeployArgs) {
  console.error("No `@cubing/deploy` entry was found in `package.json`.");
  printHelpAndExit(1);
}
if (typeof cubingDeployArgs !== "object") {
  console.error(
    "The `@cubing/deploy` in `package.json` must be an object with URLs as keys.",
  );
  printHelpAndExit(1);
}

export const targetEntries = Object.entries(cubingDeployArgs);

if (targetEntries.length === 0) {
  printHelpAndExit(1);
}

// TODO: proper schema validation
let anyInvalidOptions = false;
for (const [targetURL, targetOptions] of targetEntries) {
  for (const key of Object.keys(targetOptions)) {
    if (!(key in targetOptionsFields)) {
      console.error(`Unknown option for target: ${targetURL}`);
      console.error(`Unknown option key: ${key}`);
      anyInvalidOptions = true;
    }
  }
}
if (anyInvalidOptions) {
  exit(1);
}
