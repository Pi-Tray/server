import type { Plugin } from "./types";

import fs from "fs";
import {createRequire} from "module";
import {in_plugin_env} from "./data";

// create a custom require resolver that looks at the node_modules of the plugin-env directory
const require_from_plugin_env = createRequire(in_plugin_env("package.json"));

// validated plugins, keyed by their full name e.g. @pi-tray/builtin/run_command
const loaded_plugins = new Map<string, Plugin>();

// every require cache entry that was created while loading a plugin, including the plugin's own dependencies
// tracked this way rather than by path so that symlinked (npm link) plugins outside plugin-env are cleared too
const plugin_module_paths = new Set<string>();

/**
 * Forgets every loaded plugin and removes their modules from the require cache.<br>
 * The next {@link load_plugin} call for each plugin will load it fresh from disk, re-running its top level code.
 */
export const clear_plugin_cache = () => {
    loaded_plugins.clear();

    for (const module_path of plugin_module_paths) {
        delete require_from_plugin_env.cache[module_path];
    }

    plugin_module_paths.clear();
}

/**
 * Loads a plugin module and validates its structure, or returns the already loaded copy.<br>
 * The module must export a plugin object as its default export with a `handle_push` function, and optionally a `display_name` string.<br>
 * Plugins stay loaded until {@link clear_plugin_cache} is called, which happens automatically when plugin-env's packages change.
 * @param name the module name to load
 * @return the loaded plugin object
 */
export const load_plugin = (name: string) => {
    const cached_plugin = loaded_plugins.get(name);
    if (cached_plugin) {
        return cached_plugin;
    }

    // remember what was already cached so we can tell which modules this plugin pulled in
    const cache_before_load = new Set(Object.keys(require_from_plugin_env.cache));

    const module = require_from_plugin_env(name);

    for (const module_path of Object.keys(require_from_plugin_env.cache)) {
        if (!cache_before_load.has(module_path)) {
            plugin_module_paths.add(module_path);
        }
    }

    if (!module || typeof module !== "object" || !module.default) {
        throw new Error(`Plugin ${name} does not export a valid plugin object as default.`);
    }

    const plugin = module.default;

    if (typeof plugin.handle_push !== "function") {
        throw new Error(`Plugin ${name} does not export a handle_push function.`);
    }

    if (typeof plugin.display_name !== "string") {
        plugin.display_name = name;
    }

    loaded_plugins.set(name, plugin as Plugin);
    return plugin as Plugin;
}

// installing, removing or updating packages changes these files, so drop every loaded plugin when they do
for (const watched_file of ["package.json", "package-lock.json"]) {
    fs.watchFile(in_plugin_env(watched_file), {interval: 1000}, () => {
        console.log(`${watched_file} in plugin-env changed, clearing plugin cache.`);
        clear_plugin_cache();
    });
}
