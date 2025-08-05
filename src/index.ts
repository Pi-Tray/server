import WebSocket from "ws";
import minimist from "minimist";

import type { MessageData, MessageHandler } from "./types";

// ensure data init scripts run
import "./data";

import {register_notifiers} from "./notifiers";

import * as _handlers from "./handlers";
const handlers: { [action: string]: MessageHandler | undefined } = _handlers;
Object.freeze(handlers);

// TODO: set host and port from data dir
// TODO: pass custom data directory as argument

const args = minimist(process.argv.slice(2));
const port = args.port || 8080;
const host = args.host || "127.0.0.1";

if (host === "127.0.0.1" || host === "localhost") {
    console.warn("Warning: Using localhost. Server will not be accessible from other devices on network. You should specify a --host= argument to choose an interface to host on.");
}

if (host === "0.0.0.0") {
    console.warn("Warning: Using 0.0.0.0. Server will be hosted on all interfaces! Be careful with this, as it will allow anyone on the network to connect to your server. Do NOT forward the assigned port.");
}

console.log(`Starting WebSocket server on ws://${host}:${port}`);

const server = new WebSocket.Server({ port, host });

server.on("connection", ws => {
    console.log("Client connected");
    register_notifiers(ws);

    ws.on("message", async (message) => {
        const decoded = message.toString();
        console.log(`Received message: ${decoded}`);

        const data = JSON.parse(decoded) as MessageData;

        // find the handler for the action
        const handler = handlers[data.action];
        if (handler) {
            try {
                // call the handler with the payload
                await handler(ws, data.payload);
            } catch (error) {
                console.error(`Error handling action "${data.action}":`, error);

                ws.send(JSON.stringify({
                    action: "error",
                    payload: {
                        for: data
                    }
                }));
            }
        } else {
            console.warn(`No handler for action "${data.action}"`);

            ws.send(JSON.stringify({
                action: "invalid",
                payload: {
                    for: data
                }
            }));
        }
    });

    // welcome message
    ws.send(JSON.stringify({
        action: "hello",
        payload: {
            motd: "Served fresh!"
        }
    }));
});
