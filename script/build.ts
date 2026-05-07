import { es2022Lib } from "@cubing/dev-config/esbuild/es2022";
import { build } from "esbuild";

await build({
  ...es2022Lib(),
  entryPoints: [
    { in: "src/cli/main.ts", out: "./cli/main" },
    { in: "src/lib/index.ts", out: "./lib/@cubing/deploy/index" },
  ],
  outdir: "./dist",
});
