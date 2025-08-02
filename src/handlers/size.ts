import {get_shape_of_loaded_rows} from "../data";

export default ((ws, payload) => {
    const shape = get_shape_of_loaded_rows();

    ws.send(JSON.stringify({
        action: "size",
        payload: shape
    }));
}) as MessageHandler;
