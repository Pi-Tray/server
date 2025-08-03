import type WebSocket from "ws";

interface PluginPushHandlerData {
    /**
     * The x coordinate of the button that was pushed.
     */
    x: number;

    /**
     * The y coordinate of the button that was pushed.
     */
    y: number;

    /**
     * The configuration specified for the plugin, if any.
     */
    config?: { [key: string]: any } | undefined;

    /**
     * The open WebSocket connection to the client.
     */
    ws: WebSocket;
}

export type PluginPushHandler = (data: PluginPushHandlerData) => Promise<void>;

type PluginConfigTemplate_PrimitiveFieldType = "string" | "number" | "boolean";
type PluginConfigTemplate_FieldType = PluginConfigTemplate_PrimitiveFieldType | "array" | "object";

type PluginConfigTemplate_BaseField = {
    type: PluginConfigTemplate_FieldType | PluginConfigTemplate_FieldType[];
    description?: string;
    optional?: true;
};

type PluginConfigTemplate_PrimitiveField = PluginConfigTemplate_BaseField & {
    type: PluginConfigTemplate_PrimitiveFieldType;
};

type PluginConfigTemplate_PrimitiveUnionField = PluginConfigTemplate_BaseField & {
    type: PluginConfigTemplate_PrimitiveFieldType[];
};

type PluginConfigTemplate_ArrayField = PluginConfigTemplate_BaseField & {
    type: "array";
    items: PluginConfigTemplate_Field
};

type PluginConfigTemplate_ObjectField = PluginConfigTemplate_BaseField & {
    type: "object";
    properties: {
        [key: string]: PluginConfigTemplate_Field;
    };
};

type PluginConfigTemplate_Field =
    | PluginConfigTemplate_PrimitiveField
    | PluginConfigTemplate_PrimitiveUnionField
    | PluginConfigTemplate_ArrayField
    | PluginConfigTemplate_ObjectField;

/**
 * The configuration template for a plugin.<br>
 * @note You cannot currently use object or array as in a union with other types. A field cannot be both a string and an object, for example.<br>
 * You can still use union types as the type of an object property or array item, however (see example below).
 * @example
 * name: {
 *     type: "string",
 *     description: "The name to use"
 * },
 * data: {
 *     type: "object",
 *     optional: true,
 *     description: "Optional data to use",
 *     properties: {
 *         value: {
 *             type: ["string", "number"],
 *             description: "The value to use, can be a string or a number"
 *         },
 *         arguments: {
 *             type: "array",
 *             optional: true,
 *             description: "Optional array of string or number arguments",
 *             items: {type: ["string", "number"]}
 *         }
 *     }
 * }
 */
export type PluginConfigTemplate = {
    [key: string]: PluginConfigTemplate_Field;
};

export interface Plugin {
    /**
     * The display name of the plugin to show in editors.<br>
     * You should specify this, but otherwise it will default to the name of the module.
     */
    display_name?: string;

    /**
     * The configuration template for the plugin, if any.<br>
     * This will NOT be validated by the server, but allows editors to provide a UI for configuring/checking the plugin.
     */
    config_template?: PluginConfigTemplate;

    /**
     * The function that is fired when a button using this plugin is pushed.
     */
    handle_push: PluginPushHandler;
}

/**
 * Loads a plugin module dynamically and validates its structure.<br>
 * The module must export a `handle_push` function, and optionally a `display_name` string.
 * @param name the module name to load
 * @return the loaded plugin object
 */
export const load_plugin = (name: string) => {
    // remove existing plugin from cache so code be easily changed without restarting the server
    // TODO: this means the module is reloaded on each button press! need a way to detect if the plugin file has changed, and if not then just return the cached version
    // TODO: doing this also allows plugins to do stuff at init reliably, although maybe its easier to do some sort of versioning in the grid data?
    // ^^ we could also validate basic plugin structure when grid data is updated if we known its consistent
    if (require.cache[require.resolve(name)]) {
        delete require.cache[require.resolve(name)];
    }

    const plugin = require(name);

    if (typeof plugin.handle_push !== "function") {
        throw new Error(`Plugin ${name} does not export a handle_push function.`);
    }

    if (typeof plugin.display_name !== "string") {
        plugin.display_name = name;
    }

    return plugin as Plugin;
}
