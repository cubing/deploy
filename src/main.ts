#!/usr/bin/env bun

import { deployTarget } from "./deployTarget";
import { options, printHelpAndExit } from "./options";
import { targetEntries } from "./targetEntries";

if (options.help) {
  printHelpAndExit(0);
}

for (const [targetURL, targetOptions] of targetEntries) {
  if (targetURL === "$schema") {
    continue;
  }
  await deployTarget(targetURL, targetOptions);
}
