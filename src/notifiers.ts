import type { WebSocket } from "ws";

import {add_grid_change_listener, get_shape_of_loaded_grid, GridChangeListener} from "./data";

export const register_notifiers = (ws: WebSocket) => {
    const grid_changed: GridChangeListener = async (changes) => {
        if (!changes.includes("shape")) {
            // only run if the shape has changed
            return;
        }

        console.log("Notifying client of shape change");
        ws.send(JSON.stringify({
            action: "size",
            payload: get_shape_of_loaded_grid()
        }));
    }

    add_grid_change_listener(grid_changed);
}
