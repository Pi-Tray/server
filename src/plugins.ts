import type { Plugin } from "./types";

/**
 * Loads a plugin module dynamically and validates its structure.<br>
 * The module must export a `handle_push` function, and optionally a `display_name` string.
 * @param name the module name to load
 * @return the loaded plugin object
 */
export const load_plugin = (name: string) => {
    // remove existing plugin from cache so code be easily changed without restarting the server
    // TODO: this means the module is reloaded on each button press! need a way to detect if the plugin file has changed, and if not then just return the cached version
    // TODO: doing this also allows plugins to do stuff at init reliably, although maybe its easier to do some sort of versioning in the grid data?
    // ^^ we could also validate basic plugin structure when grid data is updated if we known its consistent
    if (require.cache[require.resolve(name)]) {
        delete require.cache[require.resolve(name)];
    }

    const plugin = require(name);

    if (typeof plugin.handle_push !== "function") {
        throw new Error(`Plugin ${name} does not export a handle_push function.`);
    }

    if (typeof plugin.display_name !== "string") {
        plugin.display_name = name;
    }

    return plugin as Plugin;
}
