// client.ts
import type { WebSocketClientConfig, WebSocketClient, Action } from "@/types";
import { defineStore } from "@/helpers/store";
import { safeJSONParse } from "@/utils";

interface MyState {
    connected: boolean;
    messages: string[];
}

function rootReducer(state: MyState, action: Action): MyState {
    switch (action.type) {
        case "connecting":
            return { ...state };
        case "open":
            return { ...state, connected: true };
        case "close":
            console.log("close called");
            return { ...state, connected: false };
        case "message":
            console.log("message called");
            console.log("payload =>", action.payload);
            return {
                ...state,
                messages: [...state.messages, String(action.payload)]
            };
        case "error":
            console.log("error called");
            // You could track the error or do something else
            return { ...state };
        default:
            return state;
    }
}

export function client(config: WebSocketClientConfig): WebSocketClient {
    let ws: WebSocket | null = null;

    const store = defineStore<MyState>(
        {
            connected: false,
            messages: [],
            ...config
        },
        rootReducer
    );

    // Listen to overall state changes for debugging
    store.on("state-changed", (payload: { type: string; state: MyState }) => {
        console.log(`EventBus => ${payload.type} caused state:`, payload.state);
    });

    async function connect() {
        console.log("connect() called");

        if (ws && ws.readyState !== WebSocket.CLOSED) {
            // If the socket is already open or opening, don't reconnect
            return;
        }

        // Dispatch "connecting" to update state (or do nothing special)
        store.dispatch("connecting");

        ws = new WebSocket(config.url);

        // Raw WebSocket events
        ws.onopen = () => {
            store.dispatch("open");
        };
        ws.onclose = () => {
            store.dispatch("close");
        };
        ws.onerror = (err) => {
            console.log("onerror called");
            store.dispatch("error", err);
        };
        ws.onmessage = (event) => {
            console.log("onmessage called");
            const message = safeJSONParse<unknown>(event.data);
            store.dispatch("message", message);
        };
    }

    function close() {
        ws?.close();
        ws = null;
    }

    function send(data: unknown) {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(data));
        } else {
            console.warn("WebSocket not open. Could not send message:", data);
        }
    }

    // Return an unsubscribe function so the caller can remove the handler
    function on<T = unknown>(eventName: string, handler: (payload: T) => void) {
        store.on<T>(eventName, handler);
        return () => store.off<T>(eventName, handler);
    }

    return {
        connect,
        close,
        on,
        send,
        // Expose store.use so users can add their own single-function middlewares
        use: store.use
    };
}
