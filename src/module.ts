import "../utils/vite/hmr.ts";
import "./styles/module.css";

import { MODULE_NAME } from "src/constants.ts";
import { registerTemplates } from "./scripts/register-templates.ts";

type Payload<Action extends string> = {
  action: Action;
};
export interface ActionRequest extends Payload<"action"> {
  key: "key";
}

export type SocketPayload = ActionRequest;

Hooks.once("init", async function () {
  // Register stuff with the Foundry client
  registerTemplates();
});

Hooks.once("ready", async function () {
  console.log(`${MODULE_NAME} | Ready`);

  game.socket.on(`module.${MODULE_NAME}`, ({ action, ...payload }) => {
    switch (action) {
      default:
        console.groupCollapsed(`${MODULE_NAME}::${action}`);
        console.log(payload);
        console.groupEnd();
        break;
    }
  });
});
