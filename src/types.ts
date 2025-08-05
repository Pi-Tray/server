import type WebSocket from "ws";

/**
 * The action to perform in a WebSocket message.<br>
 * E.g. "hello", "set_text", "push", etc.
 */
export type MessageAction = string;

/**
 * The payload for a WebSocket message, can be anything, but must be json serialisable.
 */
export type MessagePayload = any | undefined;

export interface MessageData {
    action: MessageAction;
    payload: MessagePayload;
}

/**
 * A function that handles a WebSocket message.<br>
 * Each module (except `index.ts`) in the `src/handlers` directory should export a default function with this signature.<br>
 * Then it should be added as an export in `src/handlers/index.ts`.<br>
 * The name of the export should match the action it handles.
 */
export type MessageHandler = (ws: WebSocket, data: MessagePayload) => Promise<void>;

export interface PluginConfigReference {
    /**
     * The name of the plugin to use.
     */
    name: string;

    /**
     * The configuration for the plugin, if any.
     */
    config?: { [key: string]: any };
}

/**
 * A reference to a plugin, either by name or by a configuration object.<br>
 * If the plugin has no configuration, it can be referenced by name only, just providing the name as a string.
 */
export type PluginReference = string | PluginConfigReference;

/**
 * The data structure for a cell in the grid.<br>
 * This is loaded from the data directory, specifically from the `rows` directory.
 * @param text the text to display in the cell (default: empty string)
 * @param text_is_icon whether the text should be treated as a Lucide icon name (default: false)
 * @param plugin the name of the plugin that runs when the cell is clicked, or a configuration object for the plugin (default: no plugin)
 */
export interface CellData {
    text?: string;
    text_is_icon?: boolean;

    plugin?: PluginReference;
}


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
