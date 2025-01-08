import type { WebSocketClientConfig, WebSocketClient } from "@/types";
import { defineEventBus } from "@/events/event-bus";

export function client(config: WebSocketClientConfig): WebSocketClient {
    const eventBus = defineEventBus();

    return {};
}
