// Adapted from https://gitlab.com/foundryvtt_pathfinder1e/foundryvtt-pathfinder1/-/blob/master/tools/foundry-config.mjs

import * as chokidar from "chokidar";
import path from "node:path";
import fs from "fs-extra";
import { Plugin, ViteDevServer } from "vite";
import Logger from "./logger.ts";

let server: ViteDevServer;
let watcher: chokidar.FSWatcher;

/**
 * A plugin that watches the `publicDir` for changes to `.hbs` files, triggering a hot reload within Foundry
 */
export default function handlebarsReload(): Plugin {
  return {
    name: "languages-hot-reload",
    configureServer(resolvedServer) {
      server = resolvedServer;
    },

    configResolved(config) {
      const logger = new Logger(config.logger);
      const watchPath = path.resolve(config.publicDir, "languages/*.json");
      watcher = chokidar.watch(watchPath);

      // Clean up base dir to determine file placement within Foundry
      const foundryBaseDir = config.base
        .split(path.sep)
        .join(path.posix.sep)
        .replace(/^\/+|\/+$/g, "");

      watcher.on("change", async (file) => {
        if (file.endsWith("json")) {
          // Transform OS path into Foundry-suitable path
          const filepathUrl = path
            .relative(config.publicDir, file)
            .split(path.sep)
            .join(path.posix.sep)
            .replace(/^\/+|\/+$/g, "");
          const foundryPath = `${foundryBaseDir}/${filepathUrl}`;

          // Shortened relative path for display purposes
          const fileFromRoot = path.relative(config.root, file);
          const lang = file
            .replace(`${config.publicDir}/languages/`, "")
            .replace(".json", "");

          // Trigger hot reload within dev server/Foundry
          const content = await fs.readFile(file, { encoding: "utf8" });
          logger.info(`Reload ${fileFromRoot} as ${foundryPath}`);
          server.ws.send({
            type: "custom",
            event: "languages:update",
            data: { file: foundryPath, content, lang },
          });

          // Also copy template to `dist` to persist the change
          const distFile = path.resolve(
            config.build.outDir,
            path.relative(config.publicDir, file)
          );
          await fs.copy(file, distFile);
          logger.info(
            `Copied ${fileFromRoot} to ${distFile.replace(
              config.build.outDir,
              foundryBaseDir
            )}`
          );
        }
      });
    },

    async buildEnd() {
      await watcher.close();
    },
  };
}
