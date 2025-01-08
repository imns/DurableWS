export interface WebSocketClientConfig {
    url: string;
    // TODO: Add other config options here
}

export interface WebSocketClient {
    // TODO: Add other methods here
}

interface Message {
    type: string;
    payload: Record<string, unknown>;
}

export interface EventBus {
    on<T = unknown>(eventName: string, handler: (payload: T) => void): void;
    off<T = unknown>(eventName: string, handler: (payload: T) => void): void;
    emit<T = unknown>(eventName: string, payload: T): void;
}
