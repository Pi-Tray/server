import type {CellData} from "./types";

import {resolve_asset_url} from "./assets";

/**
 * Builds the set_cell payload for a cell, shared by every place that sends cells to clients.
 * @param col_idx the cell's column, sent as x
 * @param row_idx the cell's row, sent as y
 * @param cell the cell's data, or undefined for an empty cell
 */
export const build_cell_payload = (col_idx: number, row_idx: number, cell: CellData | undefined) => {
    return {
        x: col_idx,
        y: row_idx,
        text: cell?.text || "",
        is_icon: cell?.text_is_icon || false,
        // resolved here as clients don't know the file's extension or version
        background: resolve_asset_url(cell?.background),
    };
}
