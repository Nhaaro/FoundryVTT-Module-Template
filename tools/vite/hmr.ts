// Adapted from https://gitlab.com/foundryvtt_pathfinder1e/foundryvtt-pathfinder1/-/blob/master/module/hmr.mjs

// This if enables following code to be tree-shaken away when not using the development server
if (import.meta.hot) {
  // Handle hot reloading of handlebars templates
  import.meta.hot.on(
    "handlebars:update",
    ({ file, content, foundryBaseDir }) => {
      const templatesDir = `${foundryBaseDir}/templates/`;

      const compiled = Handlebars.compile(content);
      Handlebars.registerPartial(file, compiled);
      _templateCache[file] = compiled;
      console.debug(
        `[vite] handlebars compiled template: ${file.replace(templatesDir, "")}`
      );

      // Rerender opened applications to make use of updated templates
      for (const appId in ui.windows) {
        const window = ui.windows[appId];
        if (window.template === file) {
          window.render(true);
          console.debug(`[vite] handlebars hot updated: ${window.title}`);
        }
      }
    }
  );

  // Handle hot reloading of handlebars templates
  import.meta.hot.on("languages:update", ({ file, content, lang }) => {
    if (game.i18n.lang === lang) {
      game.i18n.translations = {
        ...game.i18n.translations,
        ...JSON.parse(content),
      };

      // Rerender opened applications to make use of updated localization strings
      for (const appId in ui.windows) {
        const window = ui.windows[appId];
        window.render(true);
      }
      console.debug(`[vite] language hot updated: ${file}`);
    }
  });
}
