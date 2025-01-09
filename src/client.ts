import type {
    WebSocketClientConfig,
    WebSocketClient,
    EventBus,
    StateMachine
} from "@/types";
import { defineEventBus } from "@/helpers/event-bus";
import { defineStateMachine } from "@/helpers/state-machine";
import { safeJSONParse } from "@/utils";

export function client(config: WebSocketClientConfig): WebSocketClient {
    let ws: WebSocket | null = null;
    const eventBus: EventBus = defineEventBus();
    const sm: StateMachine = defineStateMachine(eventBus);

    async function connect() {
        if (ws) {
            // If not closed, no need to reconnect
            if (ws.readyState !== WebSocket.CLOSED) {
                return;
            }
        }

        sm.transition("connecting");

        ws = new WebSocket(config.url);

        // Raw WebSocket events
        ws.onopen = () => sm.transition("connected");
        ws.onclose = () => sm.transition("close");
        ws.onerror = (err) => {
            eventBus.emit("error", err);
        };
        ws.onmessage = (event) => {
            const message = safeJSONParse<unknown>(event.data);
            eventBus.emit("message", message);
        };
    }

    function close() {
        ws?.close();
        ws = null;
    }

    function send(data: unknown) {
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
        send
    };
}
