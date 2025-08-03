import {get_loaded_grid} from "../data";
import {load_plugin} from "../plugins";

export default (async (ws, payload) => {
    const grid = get_loaded_grid();

    const cell = grid[payload.y]?.[payload.x];
    if (!cell || !cell.plugin) {
        // nothing to run if the cell is empty or has no plugin

        // ack the push action
        ws.send(JSON.stringify({
            action: "push_ack",
            payload: {
                x: payload.x,
                y: payload.y,
            }
        }));

        return;
    }

    try {
        const plugin_name = typeof cell.plugin === "string" ? cell.plugin : cell.plugin.name;
        const plugin_config = typeof cell.plugin === "string" ? undefined : cell.plugin.config;

        const plugin = load_plugin(plugin_name);
        await plugin.handle_push({
            x: payload.x,
            y: payload.y,
            config: plugin_config,
            ws: ws
        });
    } catch (error) {
        console.error(`Error handling push for plugin ${cell.plugin}:`, error);

        // send an error message back to the client
        ws.send(JSON.stringify({
            action: "push_error",
            payload: {
                x: payload.x,
                y: payload.y,
            }
        }));

        return;
    }

    // ack the push action
    ws.send(JSON.stringify({
        action: "push_ack",
        payload: {
            x: payload.x,
            y: payload.y,
        }
    }));
}) as MessageHandler;
