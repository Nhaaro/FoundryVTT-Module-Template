module.exports = (ctx) => ({
  inject: false, // Don't inject CSS into <HEAD>
  map: ctx.env === "development" ? ctx.map : false,
  sourceMap: ctx.env === "development" ? ctx.map : false,
  plugins: {
    autoprefixer: {},
    "postcss-preset-env": {},
    "postcss-nested": {},
    cssnano: ctx.env === "development" ? {} : false,
  },
});
