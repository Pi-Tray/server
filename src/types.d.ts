import type WebSocket from "ws";

declare global {
    type MessagePayload = any | undefined;

    interface MessageData {
        action: string;
        payload: MessagePayload;
    }

    type MessageHandler = (ws: WebSocket, data: MessagePayload) => void;
}
