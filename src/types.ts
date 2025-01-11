export interface WebSocketClientConfig {
    readonly url: string;
    // TODO: Add other config options here
}

export type Message = string | unknown;

export interface ClientState {
    messages: Message[];
    connected: boolean;
    connectionState: SocketState;
}

export interface WebSocketClient {
    connect: () => Promise<void>;
    close: () => void;
    send: (data: unknown) => void;
    /**
     * Subscribe to an event, returning an unsubscribe function
     */
    on: (eventName: string, handler: (payload: unknown) => void) => () => void;
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

// Store
export interface Action<T = Message> {
    type: string;
    payload?: T;
}
