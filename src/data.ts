import path from "path";
import fs from "fs";


// thanks https://stackoverflow.com/a/26227660/19678893
const appdata_root = process.env.APPDATA || (process.platform == "darwin" ? process.env.HOME + "/Library/Application Support" : process.env.HOME + "/.config");

// returns the path relative to the appdata root directory
const appdata = (in_path: string): string => {
    return path.join(appdata_root, in_path);
}


export const data_dir = appdata("pi-tray");
export const in_data_dir = (in_path: string): string => {
    return path.join(data_dir, in_path);
}

fs.mkdirSync(data_dir, {recursive: true});

const grid_file_path = in_data_dir("grid.json");

export interface GridShape {
    /**
     * The number of rows in the grid shape.<br>
     * You could also think of this as the maximum possible row index + 1.
     */
    rows: number;

    /**
     * The number of columns in the grid shape.<br>
     * You could also think of this as the maximum possible column index + 1.
     */
    cols: number;
}

export type GridData = { [row_idx: number]: { [column_idx: number]: CellData } };

interface GridFile {
    shape: GridShape;
    row_data: GridData;
}

// create grid file if it doesnt exist
if (!fs.existsSync(grid_file_path)) {
    fs.writeFileSync(grid_file_path, JSON.stringify({
        shape: { rows: 0, cols: 0 },
        row_data: {}
    }), "utf-8");
}

let grid_data: GridData = {};
let grid_shape = { rows: 0, cols: 0 };

/**
 * Gets the loaded rows from the grid.json file.<br>
 * Call {@link reload_grid} to load the grid from the file before using this function.
 */
export const get_loaded_grid = (): GridData => {
    return grid_data;
}

/**
 * Gets the shape of the loaded grid.
 * @return the shape of the grid, with `rows` and `cols` properties.
 */
export const get_shape_of_loaded_grid = (): GridShape => {
    return grid_shape;
}

/**
 * (Re)loads the entire grid and shape from the grid.json file.
 * @return success of the reload operation, true if successful, false if the file does not exist or could not be read/parsed
 */
export const reload_grid = () => {
    if (!fs.existsSync(grid_file_path)) {
        console.warn(`Grid file does not exist at ${grid_file_path}, starting with empty grid.`);
        return false;
    }

    try {
        const raw = fs.readFileSync(grid_file_path, "utf-8");
        const parsed: GridFile = JSON.parse(raw);

        grid_shape = parsed.shape || { rows: 0, cols: 0 };
        grid_data = parsed.row_data || {};

        return true;
    } catch (error) {
        console.error("Failed to read or parse grid.json:", error);
        return false;
    }
}

export type GridChange = "shape" | {row_idx: number, col_idx: number};
export type GridChangeListener = (changes: GridChange[]) => Promise<void>;

const grid_changed_listener: GridChangeListener[] = [];

/**
 * Adds a listener that is called whenever the grid is changed.
 * @param listener the listener to add
 */
export const add_grid_change_listener = (listener: GridChangeListener) => {
    grid_changed_listener.push(listener);
}

// load initial grid
reload_grid();

console.log(`Loaded ${grid_shape.rows}x${grid_shape.cols} grid from data directory.`);

// listen for changes in the grid file
fs.watchFile(grid_file_path, { interval: 1000 }, (curr, prev) => {
    const old_grid = grid_data;
    const old_shape = grid_shape;

    if (reload_grid()) {
        console.log(`Grid file changed, reloaded ${grid_shape.rows}x${grid_shape.cols} grid.`);

        let changes: GridChange[] = [];

        // determine what changed
        if (old_shape.rows !== grid_shape.rows || old_shape.cols !== grid_shape.cols) {
            changes.push("shape");
        }

        // check for changes in the grid data
        // there may be a more efficient way by diffing curr and prev, but this is simpler
        for (let row_idx = 0; row_idx < grid_shape.rows; row_idx++) {
            for (let col_idx = 0; col_idx < grid_shape.cols; col_idx++) {
                const old_cell = old_grid[row_idx]?.[col_idx];
                const new_cell = grid_data[row_idx]?.[col_idx];

                if (JSON.stringify(old_cell) !== JSON.stringify(new_cell)) {
                    changes.push({ row_idx, col_idx });
                }
            }
        }

        // notify all listeners of the changes
        Promise.all(
            grid_changed_listener.map(listener =>
                listener(changes).catch(error => {
                    console.error("Error in rows changed listener:", error);
                })
            )
        );
    } else {
        console.warn("Failed to reload grid after file change.");
    }
});
