import type {
    WebSocketClientConfig,
    ClientState,
    WebSocketClient,
    Store,
    Middleware
} from "@/types";
import { SocketState } from "@/types";
import { defineStore } from "@/helpers/store";
import { safeJSONParse } from "@/utils";
import connectionActions from "@/actions/connection-handlers";
import { onMessage } from "@/actions/message-handlers";
import { pingpong, logger } from "@/middleware/pingpong";

export function client(config: WebSocketClientConfig): WebSocketClient {
    let ws: WebSocket | null = null;

    const initialState: ClientState = {
        connected: false,
        connectionState: SocketState.IDLE,
        messages: []
    };

    const store = defineStore<ClientState>(initialState);
    store.defineActions(connectionActions);
    store.defineAction("message", onMessage);

    const api = (store: Store<ClientState>): WebSocketClient => {
        return {
            async connect() {
                console.log("connect() called");
                if (ws && ws.readyState !== WebSocket.CLOSED) {
                    return;
                }
                store.dispatch("connecting");
                ws = new WebSocket(config.url);

                ws.onopen = () => {
                    store.dispatch("connected");
                };
                ws.onclose = (closeEvent) => {
                    store.dispatch("close", closeEvent);
                };
                ws.onerror = (err) => {
                    console.log("onerror called");
                    store.dispatch("error", err);
                };
                ws.onmessage = (event) => {
                    const message = safeJSONParse<unknown>(event.data);
                    store.dispatch("message", message);
                };
            },
            close() {
                ws?.close();
                ws = null;
            },
            send(data: unknown) {
                if (ws && ws.readyState === WebSocket.OPEN) {
                    if (typeof data === "string") {
                        ws.send(data);
                    } else {
                        ws.send(JSON.stringify(data));
                    }
                } else {
                    console.warn(
                        "WebSocket not open. Could not send message:",
                        data
                    );
                }
            },
            on<T = unknown>(eventName: string, handler: (payload: T) => void) {
                store.on<T>(eventName, handler);
                return () => store.off<T>(eventName, handler);
            },
            use(middleware: Middleware<ClientState>) {
                store.use(middleware);
            }
        };
    };

    const clientApi = api(store);

    // Set the additional context that gets passed to each middleware
    store.setContext({
        client: clientApi,
        config
    });

    // Add internal middleware
    store.use(pingpong);
    store.use(logger);

    return clientApi;
}
