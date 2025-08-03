import {get_loaded_grid} from "../data";

export default ((ws, payload) => {
    const grid = get_loaded_grid();

    // iterate over the grid and send each button's text
    // TODO: bundle all buttons into one message
    for (let row_idx of Object.keys(grid)) {
        const row = grid[row_idx as unknown as number];

        for (let col_idx of Object.keys(row)) {
            const cell = row[col_idx as unknown as number];

            if (cell) {
                ws.send(JSON.stringify({
                    action: "set_text",
                    payload: {
                        x: parseInt(col_idx, 10),
                        y: parseInt(row_idx, 10),
                        text: cell.text,
                        is_icon: cell.text_is_icon
                    }
                }));
            }
        }
    }

    return;
}) as MessageHandler;
