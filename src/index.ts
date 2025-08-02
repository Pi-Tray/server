import WebSocket from "ws";
import minimist from "minimist";

const args = minimist(process.argv.slice(2));
const port = args.port || 8080;
const host = args.host || "127.0.0.1";

if (host === "127.0.0.1" || host === "localhost") {
    console.warn("Warning: Using localhost. Server will not be accessible from other devices on network. You should specify a --host= argument to choose an interface to host on.");
}

console.log(`Starting WebSocket server on ws://${host}:${port}`);

const server = new WebSocket.Server({ port, host });

server.on("connection", ws => {
    console.log("Client connected");

    ws.on("message", message => {
        // decode message as UTF-8 string
        const decoded = message.toString();
        console.log(`Received message: ${decoded}`);

        ws.send(`Echo: ${decoded}`);
    });

    ws.send("Welcome from server!");
});
