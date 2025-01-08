export interface WebSocketClientConfig {
    url: string;
    // TODO: Add other config options here
}

export interface WebSocketClient {
    connect: () => void;
    close: () => void;
    emit: (data: unknown) => void;
    on: (eventName: string, handler: (payload: unknown) => void) => void;
}

export interface EventBus {
    on<T = unknown>(eventName: string, handler: (payload: T) => void): void;
    off<T = unknown>(eventName: string, handler: (payload: T) => void): void;
    emit<T = unknown>(eventName: string, payload: T): void;
}
