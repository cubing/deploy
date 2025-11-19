import { exit } from "node:process";
import { Path } from "path-class";
import { printHelpAndExit } from "../lib/args";
import { type TargetOptions, targetOptionsFields } from "../lib/deploy";

export async function getTargetEntries() {
  const packageJSONPath = new Path("./package.json");
  if (!(await packageJSONPath.existsAsFile())) {
    console.error(
      "Please run `@cubing/deploy` in a folder with a `package.json` file.",
    );
    printHelpAndExit(1);
  }
  const packageJSON: {
    "@cubing/deploy"?: Record<string, TargetOptions>[];
  } = await packageJSONPath.readJSON();
  const cubingDeployArgs = packageJSON["@cubing/deploy"];
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

  const targetEntries = Object.entries(cubingDeployArgs);

  if (targetEntries.length === 0) {
    printHelpAndExit(1);
  }

  // TODO: proper schema validation
  let anyInvalidOptions = false;
  for (const [targetURL, targetOptions] of targetEntries) {
    if (targetURL === "$schema") {
      continue;
    }
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
  return targetEntries;
}
