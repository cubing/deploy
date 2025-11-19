#!/usr/bin/env bun

import { getArgs, printHelpAndExit } from "../lib/args";
import { deploy } from "../lib/deploy";
import { getTargetEntries } from "./targetEntries";

const args = getArgs();

if (args.help) {
  printHelpAndExit(0);
}

for (const [targetURL, targetOptions] of await getTargetEntries()) {
  if (targetURL === "$schema") {
    continue;
  }
  // TODO: continue to next target even on failure?
  await deploy(targetURL, targetOptions, args);
}
