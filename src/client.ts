import type {
    WebSocketClientConfig,
    ClientState,
    WebSocketClient
} from "@/types";
import { SocketState } from "@/types";
import { defineStore } from "@/helpers/store";
import { safeJSONParse } from "@/utils";

export function client(config: WebSocketClientConfig): WebSocketClient {
    let ws: WebSocket | null = null;

    const initialState: ClientState = {
        connected: false,
        connectionState: SocketState.IDLE,
        messages: []
    };

    const store = defineStore<ClientState>(initialState);

    function onConnecting(state: ClientState) {
        console.log("onConnecting called");
        return { ...state, connectionState: SocketState.CONNECTING };
    }

    store.defineAction("connecting", onConnecting);

    store.defineAction("connected", (state) => {
        console.log("connected action called");
        return {
            ...state,
            connected: true,
            connectionState: SocketState.CONNECTED
        };
    });

    store.defineAction("message", (state, payload) => {
        console.log("message action called", payload);
        return { ...state, messages: [...state.messages, payload] };
    });

    store.defineAction("close", (state) => {
        console.log("close action called");
        return {
            ...state,
            connected: false,
            connectionState: SocketState.CLOSED
        };
    });

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
            console.log("onopen called");
            store.dispatch("connected");
        };
        ws.onclose = (closeEvent) => {
            /*
            CloseEvent:
            - code: number
            - reason: string
            - wasClean: boolean
            */
            console.log("onclose called");

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
