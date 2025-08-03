import type WebSocket from "ws";

declare global {
    /**
     * The action to perform in a WebSocket message.<br>
     * E.g. "hello", "set_text", "push", etc.
     */
    type MessageAction = string;

    /**
     * The payload for a WebSocket message, can be anything, but must be json serialisable.
     */
    type MessagePayload = any | undefined;

    interface MessageData {
        action: MessageAction;
        payload: MessagePayload;
    }

    /**
     * A function that handles a WebSocket message.<br>
     * Each module (except `index.ts`) in the `src/handlers` directory should export a default function with this signature.<br>
     * Then it should be added as an export in `src/handlers/index.ts`.<br>
     * The name of the export should match the action it handles.
     */
    type MessageHandler = (ws: WebSocket, data: MessagePayload) => Promise<void>;

    interface PluginConfigReference {
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
    type PluginReference = string | PluginConfigReference;

    /**
     * The data structure for a cell in the grid.<br>
     * This is loaded from the data directory, specifically from the `rows` directory.
     * @param text the text to display in the cell (default: empty string)
     * @param text_is_icon whether the text should be treated as a Lucide icon name (default: false)
     * @param plugin the name of the plugin that runs when the cell is clicked, or a configuration object for the plugin (default: no plugin)
     */
    interface CellData {
        text?: string;
        text_is_icon?: boolean;

        plugin?: PluginReference;
    }
}
