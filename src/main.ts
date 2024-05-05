#!/usr/bin/env bun

import { deployTarget } from "./deployTarget";
import { options, printHelpAndExit } from "./options";
import { targetEntries } from "./targetEntries";

if (options.help) {
  printHelpAndExit();
}

for (const [targetURL, targetOptions] of targetEntries) {
  await deployTarget(targetURL, targetOptions);
}
