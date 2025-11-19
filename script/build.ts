import { es2022Lib } from "@cubing/dev-config/esbuild/es2022";
import { build } from "esbuild";
import { PrintableShellCommand } from "printable-shell-command";

await build({
  ...es2022Lib(),
  entryPoints: [
    { in: "src/cli/main.ts", out: "./cli/main" },
    { in: "src/lib/index.ts", out: "./lib/@cubing/deploy/index" },
  ],
  outdir: "./dist",
});

await new PrintableShellCommand("bun", [
  "x",
  "tsc",
  "--project",
  "./tsconfig.build.json",
]).shellOut();
