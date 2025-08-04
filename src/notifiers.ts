import type { WebSocket } from "ws";

import {add_grid_change_listener, get_loaded_grid, get_shape_of_loaded_grid, GridChangeListener} from "./data";

export const register_notifiers = (ws: WebSocket) => {
    const shape_changed = async () => {
        console.log("Notifying client of shape change");

        // send the updated shape of the grid to the client
        ws.send(JSON.stringify({
            action: "size",
            payload: get_shape_of_loaded_grid()
        }));
    }

    const grid_changed: GridChangeListener = async (changes) => {
        const grid = get_loaded_grid();

        for (const change of changes) {
            if (change === "shape") {
                shape_changed();
                continue;
            }

            // TODO: determine if text changed or just plugin (which we dont send)
            console.log(`Notifying client of cell change at ${change.row_idx},${change.col_idx}`);

            // TODO: randomly breaking, grid state is not consistent when cell change occurs

            const cell = grid[change.row_idx]?.[change.col_idx];
            if (!cell) {
                // cell has become an empty cell, send empty text
                ws.send(JSON.stringify({
                    action: "set_text",
                    payload: {
                        x: change.col_idx,
                        y: change.row_idx,
                        text: "",
                        is_icon: false
                    }
                }));
            }

            // send the updated cell to the client
            ws.send(JSON.stringify({
                action: "set_text",
                payload: {
                    x: change.col_idx,
                    y: change.row_idx,
                    text: cell.text || "",
                    is_icon: cell.text_is_icon || false
                }
            }));
        }
    }

    add_grid_change_listener(grid_changed);
}
