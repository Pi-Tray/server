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


// in the data directory, there is a rows directory
// inside the rows directory, there are directories for each row named 0 to n
// inside each row directory, there are cell files for each column named 0.json to n.json
const rows_dir = in_data_dir("rows");
const in_rows_dir = (in_path: string): string => {
    return path.join(rows_dir, in_path);
}

fs.mkdirSync(rows_dir, { recursive: true });

type LoadedRows = { [row_idx: number]: { [column_idx: number]: CellData } };
let rows: LoadedRows = {};

/**
 * Gets the loaded rows from the data directory.<br>
 * Call {@link reload_all_rows} to load the rows from the data directory before using this function.
 */
export const get_loaded_rows = (): LoadedRows => {
    return rows;
}

/**
 * Gets the shape of the loaded rows, i.e. the shape of the grid.
 * @returns an object of rows (maximum row index + 1) and cols (maximum column index + 1)
 */
export const get_shape_of_loaded_rows = (): {rows: number, cols: number} => {
    // TODO: this might be a dumb way about it. it means if they want blank rows, we need to create a "maximum cell" e.g. for 4x8, we need 3/7.json to exist, even if it is empty
    // TODO: it would be better to store shape in a separate file and not bother with this

    const row_count = Object.keys(rows).length;
    if (row_count === 0) {
        return { rows: 0, cols: 0 };
    }

    const max_row_idx = Math.max(...Object.keys(rows).map(row => parseInt(row, 10)));
    if (max_row_idx < 0) {
        return { rows: 0, cols: 0 };
    }

    // find the maximum column index across all rows
    let max_column_index = -1;
    for (const row_idx in rows) {
        const column_indices = Object.keys(rows[row_idx]).map(col => parseInt(col, 10));
        if (column_indices.length > 0) {
            const max_col_idx_in_row = Math.max(...column_indices);
            if (max_col_idx_in_row > max_column_index) {
                max_column_index = max_col_idx_in_row;
            }
        }
    }

    return { rows: max_row_idx + 1, cols: max_column_index + 1 };
}

/**
 * (Re)loads all rows from the data directory.
 */
const reload_all_rows = () => {
    rows = {};

    // read all directory names in the rows directory, filtering for directories that are numeric and sorting them
    // parses the directory names as integers and filters out NaN values
    const row_dirs = fs.readdirSync(rows_dir)
        .filter(file => fs.statSync(in_rows_dir(file)).isDirectory())
        .map(file => parseInt(file, 10))
        .filter(n => !isNaN(n))
        .sort((a, b) => a - b);

    // reload each row
    for (const row_idx of row_dirs) {
        reload_row(row_idx);
    }
}

/**
 * (Re)loads a specific row from the data directory.
 * @param row_idx the index of the row to reload
 */
const reload_row = (row_idx: number) => {
    const row_path = in_rows_dir(row_idx.toString());
    if (!fs.existsSync(row_path)) {
        console.warn(`Row ${row_idx} does not exist, cannot reload.`);
        return;
    }

    // read all cell filenames in the row directory, filtering for files that are numeric and sorting them
    // slices off the ".json" extension and converts them to integers
    const column_idxes = fs.readdirSync(row_path)
        .filter(file => file.endsWith(".json"))
        .map(file => parseInt(file.replace(".json", ""), 10))
        .filter(n => !isNaN(n))
        .sort((a, b) => a - b);

    rows[row_idx] = {};

    for (const column_idx of column_idxes) {
        reload_cell(row_idx, column_idx);
    }
}

/**
 * (Re)loads a specific cell in a row.
 * @param row_idx the index of the row
 * @param column_idx the index of the column
 */
const reload_cell = (row_idx: number, column_idx: number) => {
    const row_path = in_rows_dir(row_idx.toString());
    if (!fs.existsSync(row_path)) {
        console.warn(`Row ${row_idx} does not exist, cannot reload column ${column_idx}.`);
        return;
    }

    const cell_path = path.join(row_path, `${column_idx}.json`);
    if (!fs.existsSync(cell_path)) {
        console.warn(`Column ${column_idx} does not exist in row ${row_idx}, cannot reload.`);
        return;
    }

    let cell_data: CellData;
    try {
        cell_data = JSON.parse(fs.readFileSync(cell_path, "utf-8"));
    } catch (error) {
        console.error(`Error reading column data for row ${row_idx}, column ${column_idx}:`, error);
        return;
    }

    if (!rows[row_idx]) {
        rows[row_idx] = {};
    }

    rows[row_idx][column_idx] = cell_data;
}

// TODO: once we know how to determine what changed, we could pass relevant data to the listeners?
const rows_changed_listeners: (() => Promise<void>)[] = [];

/**
 * Adds a listener that is called whenever the rows are reloaded.
 * @param listener the listener to add
 */
export const add_rows_changed_listener = (listener: () => Promise<void>) => {
    rows_changed_listeners.push(listener);
}

// reload all rows initially
reload_all_rows();

const shape = get_shape_of_loaded_rows();
console.log(`Loaded ${shape.rows}x${shape.cols} grid from data directory.`);

// listen for changes in the rows directory
fs.watch(rows_dir, { recursive: true }, (eventType, filename) => {
    // for now, just reload all rows on any change
    // TODO: in future, employ an optimised approach:
    // - if a directory is created in the rows directory, load it as a new row
    // - if a directory is deleted, remove the row
    // - if a directory is renamed, reload all rows
    // - if the contents of a row is changed (creation rename deletion), reload that row
    // - if a specific cell in a row is edited, reload just that cell

    console.log(`Detected change in rows directory: ${eventType} on ${filename}`);
    reload_all_rows();

    const shape = get_shape_of_loaded_rows();
    console.log(`Reloaded ${shape.rows}x${shape.cols} grid from data directory.`);

    // notify all listeners that the rows have changed
    Promise.all(
        rows_changed_listeners.map(listener =>
            listener().catch(error => {
                console.error("Error in rows changed listener:", error);
            })
        )
    );
});
