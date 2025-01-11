import type {
    WebSocketClientConfig,
    ClientState,
    Action,
    WebSocketClient
} from "@/types";
import { defineStore } from "@/helpers/store";
import { safeJSONParse } from "@/utils";

function connectionReducer(state: ClientState, action: Action): ClientState {
    switch (action.type) {
        case "connecting":
            return { ...state };
        case "connected":
            return { ...state, connected: true };
        case "close":
            return { ...state, connected: false };
        case "retry":
            return { ...state };
        case "disconnect":
            return { ...state };
        default:
            return state;
    }
}

function messageReducer(state: ClientState, action: Action): ClientState {
    return {
        ...state,
        messages: [...state.messages, action.payload]
    };
}

function errorReducer(state: ClientState, action: Action): ClientState {
    console.error("errorReducer called", action.payload);
    return { ...state };
}

function rootReducer(state: ClientState, action: Action): ClientState {
    switch (action.type) {
        case "connecting":
        case "connected":
        case "close":
        case "retry":
        case "disconnect":
            return connectionReducer(state, action);

        case "message":
            return messageReducer(state, action);

        case "error":
            return errorReducer(state, action);

        default:
            return state;
    }
}

export function client(config: WebSocketClientConfig): WebSocketClient {
    let ws: WebSocket | null = null;

    const initialState: ClientState = {
        connected: false,
        messages: []
    };

    const store = defineStore<ClientState>(initialState, rootReducer);

    async function connect() {
        console.log("connect() called");

        // If the socket is already open or opening, don't reconnect
        // Using the native WebSocket API just to be 100% sure
        if (ws && ws.readyState !== WebSocket.CLOSED) {
            return;
        }

        // Dispatch "connecting" to update state (or do nothing special)
        store.dispatch("connecting");

        ws = new WebSocket(config.url);

        // Raw WebSocket events
        ws.onopen = () => {
            store.dispatch("connected");
        };
        ws.onclose = (closeEvent) => {
            console.log("onclose called", closeEvent);
            store.dispatch("close", closeEvent);
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
        send
    };
}
