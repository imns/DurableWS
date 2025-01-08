import { client } from "./client";
import type { WebSocketClient, WebSocketClientConfig } from "./types";

// Singleton instance of the WebSocketClient
let instance: WebSocketClient | null = null;
export function defineClient(config: WebSocketClientConfig) {
    if (instance) return instance;
    instance = client(config);
    return instance;
}
