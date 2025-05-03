import { es2022 } from "@cubing/dev-config/esbuild/es2022";
import { build } from "esbuild";

await build({
  ...es2022,
  entryPoints: ["src/main.ts"],
  outdir: "./dist/bin/@cubing/deploy",
});
