#!/usr/bin/env bun

import { exit } from "node:process";
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

// TODO: all the sub-processes have exited at this point (as can be verified by
// tracking their PIDs). Why does `bun` hang if we don't force the program to
// exit?
exit(0);
