const postcssPresetEnv = require("postcss-preset-env");
const postcssNested = require("postcss-nested");
const cssNano = require("cssnano");

module.exports = (ctx) => ({
  inject: false, // Don't inject CSS into <HEAD>
  map: ctx.env === "development" ? ctx.map : false,
  sourceMap: ctx.env === "development" ? ctx.map : false,
  plugins: [
    postcssPresetEnv(),
    postcssNested(),
    ctx.env === "development" ? cssNano() : undefined,
  ],
});
