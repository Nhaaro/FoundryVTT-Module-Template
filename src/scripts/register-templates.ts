import { MODULE_NAME } from 'src/constants.ts';

const moduleTemplates = {
    [MODULE_NAME]: {
        // template: `modules/${MODULE_NAME}/templates/template.hbs`,
    },
};
const systemTemplates = {};

export const TEMPLATES = {
    ...moduleTemplates,
    ...systemTemplates,
};

/** Register Handlebars template partials */
export function registerTemplates(): void {
    function* flattenObject(
        obj: Record<string, unknown>,
        path: string[] = []
    ): Generator<string> {
        for (const [key, value] of Object.entries(obj)) {
            const newPath = path.concat(key);
            if (typeof value === 'string') {
                yield value;
            } else if (typeof value === 'object') {
                yield* flattenObject(value as typeof obj, newPath);
            }
        }
    }

    const flattenedTemplates = [...flattenObject(moduleTemplates)];
    console.debug(`${MODULE_NAME} | loadTemplates`, flattenedTemplates);
    loadTemplates(flattenedTemplates);
}
