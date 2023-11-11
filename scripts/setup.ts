import chalk from "chalk";
import fs from "fs-extra";
import { resolve } from "path";
import { registerSIGINT, run } from "./child_process.ts";

registerSIGINT();

const configPath = resolve(process.cwd(), "foundryconfig.json");
if (!(await fs.pathExists(configPath))) {
  console.error(
    `No config file found in ${chalk.bold(
      "/home/foundry/foundrydev/modules/FoundryVtt-Module-Template/foundryconfig.json"
    )} `
  );
  console.error(
    `Copy ${chalk.bold(
      "foundryconfig.example.json"
    )} and replace the values with your own`
  );
  //TODO: make wizard to setup from script
  process.exit(1);
}

const config = await fs.readJson(configPath, { throws: false });
if (typeof config !== "object" || config === null) {
  console.error(
    `${chalk.bold(
      "foundryconfig.json"
    )} does not have a valid format. Make sure it follows the format of ${chalk.bold(
      "foundryconfig.example.json"
    )}`
  );
  //TODO: validate config file format
  process.exit(1);
}

// Validate fields
for (const key in config) {
  const value = config[key];
  switch (key) {
    case "dataPath":
      if (!value) {
        console.error(
          `No ${chalk.bold(key)} found in ${chalk.bold(
            "foundryconfig.json"
          )} make sure to add it`
        );
        process.exit(1);
      }
      if (!(await fs.pathExists(value))) {
        console.error(
          `No Data directory found in ${chalk.bold(
            config.dataPath
          )}, verify there are no typos and that it's pointing to the right location`
        );
        process.exit(1);
      }
      break;

    case "systemPath":
      if (value) {
        if (!(await fs.pathExists(value))) {
          console.error(
            `No system directory found in ${chalk.bold(
              value
            )}, verify there are no typos and that it's pointing to the right location`
          );
          process.exit(1);
        }
        const manifest = await fs.readJson(`${value}/static/system.json`);
        switch (manifest.id) {
          case "pf2e":
            console.log("Building system");
            const pwd = process.cwd();
            console.log(pwd);
            process.chdir(value);

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
              `${config.systemPath}/static/lang`
            )) {
              console.log(file);
              await run([
                "ln",
                "-sf",
                `${config.systemPath}/static/lang/${file}`,
                `dist/types/`,
              ]);
            }
            await run(["rm", "-rf", `dist/types/types`]);
            await run(["rm", "-rf", `${pwd}/types/system`]);
            await run(["rm", "-rf", `${pwd}/types/foundry`]);
            await run([
              "ln",
              "-sf",
              `${config.systemPath}/dist/types`,
              `${pwd}/types/system`,
            ]);
            await run([
              "ln",
              "-sf",
              `${config.systemPath}/types/foundry`,
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
