/* eslint-disable */
import { CleanWebpackPlugin } from "clean-webpack-plugin";
import CopyPlugin from "copy-webpack-plugin";
import ESLintPlugin from "eslint-webpack-plugin";
import { join, resolve } from "path";
import { sync } from "glob";

/// <reference path="node_modules/webpack-dev-server/types/lib/Server.d.ts"/>
import type { Configuration } from "webpack";
import type { Configuration as DevServerConfiguration } from "webpack-dev-server";

const allTemplates = () => {
  return sync("**/*.hbs", { cwd: join(__dirname, "static/templates") })
    .map((file) => `"modules/template/templates/${file}"`)
    .join(", ");
};

export default (env: Configuration) => {
  const defaults: Configuration = {
    watch: false,
    mode: "development",
  };

  const environment = { ...defaults, ...env };
  const isDevelopment = environment.mode === "development";

  const devServer: DevServerConfiguration = {
    hot: true,
    proxy: [
      {
        context: (pathname) => {
          return !pathname.match("^/sockjs");
        },
        target: "http://localhost:30000",
        ws: true,
      },
    ],
    devMiddleware: {
      writeToDisk: true,
    },
  };
  const config: Configuration = {
    entry: "./src/scripts/module.ts",
    watch: environment.watch,
    devtool: "inline-source-map",
    stats: "minimal",
    mode: environment.mode,
    resolve: {
      extensions: [".wasm", ".mjs", ".ts", ".js", ".json"],
    },
    output: {
      filename: "./scripts/module.js",
      path: resolve(__dirname, "dist"),
      publicPath: "",
    },
    devServer,
    module: {
      rules: [
        isDevelopment
          ? {
              test: /\.hbs/,
              loader: "raw-loader",
            }
          : {
              test: /\.hbs/,
              loader: "null-loader",
            },
        {
          test: /\.ts$/,
          use: [
            "ts-loader",
            "webpack-import-glob-loader",
            "source-map-loader",
            {
              loader: "string-replace-loader",
              options: {
                search: '"__ALL_TEMPLATES__"',
                replace: allTemplates,
              },
            },
          ],
        },
        {
          test: /\.scss$/,
          use: [
            "style-loader",
            {
              loader: "css-loader",
              options: {
                sourceMap: isDevelopment,
                url: false,
              },
            },
          ],
        },
      ],
    },
    plugins: [
      new CleanWebpackPlugin(),
      new ESLintPlugin({
        extensions: ["ts"],
      }),
      new CopyPlugin({
        patterns: [
          {
            from: "UNLICENSE",
            noErrorOnMissing: true,
          },
          {
            from: "README.md",
            noErrorOnMissing: true,
          },
          {
            from: "static",
            noErrorOnMissing: true,
          },
        ],
      }),
    ],
  };

  if (!isDevelopment) {
    delete config.devtool;
  }

  return config;
};
