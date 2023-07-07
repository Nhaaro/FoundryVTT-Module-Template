import esbuild from "esbuild";
import fs from "fs-extra";
import path, { resolve } from "path";
import { defineConfig } from "vite";
import checker from "vite-plugin-checker";
import { viteStaticCopy } from "vite-plugin-static-copy";
import tsconfigPaths from "vite-tsconfig-paths";
import packageJSON from "./package.json" assert { type: "json" };
import { MODULE_NAME } from "src/constants.ts";

const [outDir] = (() => {
  const configPath = resolve(process.cwd(), "foundryconfig.json");
  const config = fs.readJSONSync(configPath, { throws: false });
  const outDir =
    config instanceof Object
      ? path.join(config.dataPath, "modules", config.systemName ?? MODULE_NAME)
      : path.join(__dirname, "dist/");
  return [outDir] as const;
})();

const config = defineConfig(({ command, mode }) => {
  const buildMode = mode === "production" ? "production" : "development";

  const plugins = [checker({ typescript: true }), tsconfigPaths()];
  // Handle minification after build to allow for tree-shaking and whitespace minification
  // "Note the build.minify option does not minify whitespaces when using the 'es' format in lib mode, as it removes
  // pure annotations and breaks tree-shaking."
  if (buildMode === "production") {
    plugins.push(
      {
        name: "minify",
        renderChunk: {
          order: "post",
          async handler(code, chunk) {
            return chunk.fileName.endsWith(".mjs")
              ? esbuild.transform(code, {
                  keepNames: true,
                  minifyIdentifiers: false,
                  minifySyntax: true,
                  minifyWhitespace: true,
                })
              : code;
          },
        },
      },
      ...viteStaticCopy({
        targets: [
          { src: "README.md", dest: "." },
          { src: "CHANGELOG.md", dest: "." },
          { src: "CONTRIBUTING.md", dest: "." },
          { src: "UNLICENSE", dest: "." },
        ],
      })
    );
  } else {
    plugins.push(
      // Foundry expects all esm files listed in system.json to exist: create empty vendor module when in dev mode
      {
        name: "touch-vendor-mjs",
        apply: "build",
        writeBundle: {
          async handler() {
            fs.closeSync(fs.openSync(path.resolve(outDir, "vendor.mjs"), "w"));
          },
        },
      },
      // Vite HMR is only preconfigured for css files: add handler for HBS templates
      {
        name: "hmr-handler",
        apply: "serve",
        handleHotUpdate(context) {
          if (
            context.file.endsWith(".hbs") &&
            !context.file.startsWith(outDir)
          ) {
            const basePath = context.file.slice(
              context.file.indexOf("templates/")
            );
            console.log(`Updating template at ${basePath}`);
            fs.promises
              .copyFile(context.file, `${outDir}/${basePath}`)
              .then(() => {
                context.server.ws.send({
                  type: "custom",
                  event: "template-update",
                  data: {
                    path: `modules/${MODULE_NAME}/${basePath}`,
                  },
                });
              });
          }
        },
      }
    );
  }

  // Create dummy files for vite dev server
  if (command === "serve") {
    const message =
      "This file is for a running vite dev server and is not copied to a build";
    fs.writeFileSync("./index.html", `<h1>${message}</h1>\n`);
    if (!fs.existsSync("./styles")) fs.mkdirSync("./styles");
    fs.writeFileSync(`./styles/${MODULE_NAME}.css`, `/** ${message} */\n`);
    fs.writeFileSync(
      `./${MODULE_NAME}.mjs`,
      `/** ${message} */\n\nimport "./src/${MODULE_NAME}.ts";\n`
    );
    fs.writeFileSync("./vendor.mjs", `/** ${message} */\n`);
  }

  return {
    publicDir: "static",
    base: command === "build" ? "./" : `/modules/${MODULE_NAME}/`,
    define: {
      BUILD_MODE: JSON.stringify(buildMode),
    },
    resolve: {
      alias: {
        "@actor": path.resolve(__dirname, "types/src/module/actor"),
        "@item": path.resolve(__dirname, "types/src/module/item"),
        "@module": path.resolve(__dirname, "types/src/module"),
        "@scene": path.resolve(__dirname, "types/src/module/scene"),
        "@scripts": path.resolve(__dirname, "types/src/scripts"),
        "@system": path.resolve(__dirname, "types/src/module/system"),
        "@util": path.resolve(__dirname, "types/src/util"),
      },
    },
    server: {
      port: 30001,
      open: "/game",
      proxy: {
        [`^(?!/modules/${MODULE_NAME})`]: "http://localhost:30000/",
        "/socket.io": {
          target: `ws://localhost:30000`,
          ws: true,
        },
      },
    },
    esbuild: { keepNames: true },
    build: {
      outDir,
      emptyOutDir: true,
      sourcemap: buildMode === "development",
      minify: false,
      lib: {
        name: MODULE_NAME,
        entry: "src/scripts/module.ts",
        formats: ["es"],
        fileName: MODULE_NAME,
      },
      rollupOptions: {
        output: {
          assetFileNames: ({ name }): string =>
            name === "style.css" ? `styles/${MODULE_NAME}.css` : name!,
          chunkFileNames: "[name].mjs",
          entryFileNames: `${MODULE_NAME}.mjs`,
          manualChunks: {
            vendor:
              buildMode === "production" && "dependencies" in packageJSON
                ? Object.keys(packageJSON.dependencies as object)
                : [],
          },
        },
        watch: { buildDelay: 100 },
      },
    },
    plugins,
    css: {
      devSourcemap: buildMode === "development",
    },
  };
});

export default config;
