export interface WebSocketClientConfig {
    url: string;
    // TODO: Add other config options here
}

export interface WebSocketClient {
    connect: () => void;
    close: () => void;
    send: (data: unknown) => void;
    on: (eventName: string, handler: (payload: unknown) => void) => void;
}

export type SocketEvent =
    | "connecting"
    | "connected"
    | "close"
    | "retry"
    | "disconnect";
export interface EventBus {
    on<T = unknown>(eventName: string, handler: (payload: T) => void): void;
    off<T = unknown>(eventName: string, handler: (payload: T) => void): void;
    emit<T = unknown>(eventName: string, payload?: T): void;
}

export enum SocketState {
    IDLE = "IDLE", // not yet connected
    CONNECTING = "CONNECTING",
    CONNECTED = "CONNECTED",
    RECONNECTING = "RECONNECTING",
    CLOSED = "CLOSED"
}

export interface StateMachine {
    transition: (event: SocketEvent) => SocketState;
    getState: () => SocketState;
}
