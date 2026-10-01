import type {IncomingMessage, ServerResponse} from "http";

import fs from "fs";
import path from "path";

import {in_data_dir} from "./data";

export const assets_dir = in_data_dir("assets");
fs.mkdirSync(assets_dir, {recursive: true});

const CONTENT_TYPES: Record<string, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
    gif: "image/gif",
    svg: "image/svg+xml",
};

// a lowercase uuid with an allowed image extension, so nothing else in the data dir can ever be requested
const ASSET_PATH_PATTERN = /^\/assets\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.(png|jpe?g|webp|gif|svg)$/;

const send_status = (response: ServerResponse, status_code: number, headers: Record<string, string> = {}) => {
    response.writeHead(status_code, headers);
    response.end();
}

/**
 * HTTP handler that serves files from the assets folder, and nothing else.<br>
 * Only `/assets/<uuid>.<image extension>` is accepted, any query string (e.g. `?v=` for cache busting) is ignored.
 * @param request the incoming request
 * @param response the response to write to
 */
export const handle_asset_request = (request: IncomingMessage, response: ServerResponse) => {
    if (request.method !== "GET" && request.method !== "HEAD") {
        send_status(response, 405, {Allow: "GET, HEAD"});
        return;
    }

    // parse rather than slicing the raw url, the base is only needed because request.url is relative
    const url_path = new URL(request.url ?? "/", "http://localhost").pathname;
    const path_match = url_path.match(ASSET_PATH_PATTERN);

    if (!path_match) {
        send_status(response, 404);
        return;
    }

    const [, asset_id, extension] = path_match;
    const file_path = path.join(assets_dir, `${asset_id}.${extension}`);

    fs.stat(file_path, (stat_error, stats) => {
        if (stat_error || !stats.isFile()) {
            send_status(response, 404);
            return;
        }

        response.writeHead(200, {
            "Content-Type": CONTENT_TYPES[extension],
            "Content-Length": stats.size,
            // urls carry ?v=<mtime>, so a replaced file gets a new url and this can be cached forever
            "Cache-Control": "public, max-age=31536000, immutable",
            "X-Content-Type-Options": "nosniff",
            // svgs can contain scripts, this stops them running if an asset url is ever opened directly rather than via <img>
            "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
        });

        if (request.method === "HEAD") {
            response.end();
            return;
        }

        fs.createReadStream(file_path)
            .on("error", () => response.destroy())
            .pipe(response);
    });
}
