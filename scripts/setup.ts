import chalk from "chalk";
import fs from "fs-extra";
import { registerSIGINT, run } from "./child_process.ts";
import { flatten } from "../utils/types/flatten.ts";

registerSIGINT();

//TODO: merge with vite Logger util
const prefixBase = chalk.bold("[Setup]");
const prefix = (color = chalk.blue) => `${color(prefixBase)}`;
const logger = {
  log: (message?: any, ...optionalParams: any[]) =>
    console.log(`${prefix()} ${message}`, ...optionalParams),
  info: (message?: any, ...optionalParams: any[]) =>
    console.info(`${prefix(chalk.white)} ${message}`, ...optionalParams),
  error: (message?: any, ...optionalParams: any[]) =>
    console.error(`${prefix(chalk.red)} ${message}`, ...optionalParams),
};

const config = (
  await import("../foundryconfig.json", { assert: { type: "json" } })
).default;
const flattenedConfig = flatten(config);

// Validate fields
for (const key in flattenedConfig) {
  switch (key as keyof typeof flattenedConfig) {
    case "dataPath":
      if (!config.dataPath) {
        logger.error(
          `No ${chalk.bold(key)} found in ${chalk.bold(
            "foundryconfig.json"
          )} make sure to add it`
        );
        process.exit(1);
      }
      if (!(await fs.pathExists(config.dataPath))) {
        logger.error(
          `No Data directory found in ${chalk.bold(
            config.dataPath
          )}, verify there are no typos and that it's pointing to the right location`
        );
        process.exit(1);
      }
      break;

    case "system.path":
      if (config.system.path) {
        if (!(await fs.pathExists(config.system.path))) {
          logger.error(
            `No system directory found in ${chalk.bold(
              config.system.path
            )}, verify there are no typos and that it's pointing to the right location`
          );
          process.exit(1);
        }
        const manifest = await fs.readJson(
          `${config.system.path}/static/system.json`
        );
        switch (manifest.id) {
          case "pf2e":
            logger.log("Building system");
            const pwd = process.cwd();
            process.chdir(config.system.path);

            await run(["npm", "run", "clean"]);

            await run(["npm", "ci"]);
            await run(["npm", "run", "build"]);
            await run([
              "node_modules/.bin/tsc",
              "--declaration",
              "true",
              "--emitDeclarationOnly",
              "true",
              "--noemit",
              "false",
              "--outdir",
              "dist/types",
              "--newLine",
              "lf",
            ]);

            for (const file of await fs.readdir(
              `${config.system.path}/static/lang`
            )) {
              await run([
                "ln",
                "-sf",
                `${config.system.path}/static/lang/${file}`,
                `dist/types/`,
              ]);
            }
            await run(["rm", "-rf", `dist/types/types`]);
            await run(["rm", "-rf", `${pwd}/types/system`]);
            await run(["rm", "-rf", `${pwd}/types/foundry`]);
            await run([
              "ln",
              "-sf",
              `${config.system.path}/dist/types`,
              `${pwd}/types/system`,
            ]);
            await run([
              "ln",
              "-sf",
              `${config.system.path}/types/foundry`,
              `${pwd}/types/foundry`,
            ]);

            break;

          default:
            break;
        }
      }
      break;
  }
}
