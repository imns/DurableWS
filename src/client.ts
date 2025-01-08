import type { WebSocketClientConfig, WebSocketClient, EventBus } from "@/types";
import { defineEventBus } from "@/events/event-bus";

export function client(config: WebSocketClientConfig): WebSocketClient {
    let ws: WebSocket | null = null;
    const eventBus: EventBus = defineEventBus();

    function connect() {
        if (ws) {
            // If not closed, no need to reconnect
            if (ws.readyState !== WebSocket.CLOSED) {
                return;
            }
        }

        ws = new WebSocket(config.url);

        // Raw WebSocket events
        ws.onopen = () => {
            eventBus.emit("connect", undefined);
        };
        ws.onerror = (err) => {
            eventBus.emit("error", err);
        };
        ws.onclose = (closeEvent) => {
            eventBus.emit("close", closeEvent);
        };
        ws.onmessage = (messageEvent) => {
            eventBus.emit("message", messageEvent);
        };
    }

    function close() {
        ws?.close();
        ws = null;
    }

    function emit(data: unknown) {
        ws?.send(JSON.stringify(data));
    }

    function on<T = unknown>(eventName: string, handler: (payload: T) => void) {
        eventBus.on<T>(eventName, handler);
        return () => eventBus.off<T>(eventName, handler);
    }

    return {
        connect,
        close,
        on,
        emit
    };
}
