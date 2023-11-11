/// <reference types="vite/client" />
/// <reference types="../@types/game.d.ts" />

type Unpacked<T> = T extends (infer R)[] ? R : never;

import * as handlebars from "handlebars";
var Handlebars: handlebars;
