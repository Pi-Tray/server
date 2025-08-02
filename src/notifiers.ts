import type { WebSocket } from "ws";

import { add_rows_changed_listener, get_shape_of_loaded_rows } from "./data";

export const register_notifiers = (ws: WebSocket) => {
    let last_shape = get_shape_of_loaded_rows();
    const on_rows_changed = async () => {
        const shape = get_shape_of_loaded_rows();

        if (shape.rows === last_shape.rows && shape.cols === last_shape.cols) {
            // shape has not changed, notifying would be redundant and expensive
            return;
        }

        console.log("Notifying client of shape change");

        ws.send(JSON.stringify({
            action: "size",
            payload: shape
        }));
    }

    add_rows_changed_listener(on_rows_changed);
}
