export interface WebSocketClientConfig {
    url: string;
    // TODO: Add other config options here
}

export interface WebSocketClient {
    connect: () => Promise<void>;
    close: () => void;
    send: (data: unknown) => void;
    /**
     * Subscribe to an event, returning an unsubscribe function
     */
    on: (eventName: string, handler: (payload: unknown) => void) => () => void;
    /**
     * Let users attach single-function middlewares
     */
    use: (...middlewares: MiddlewareWithContext<any>[]) => void;
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

// Middleware
export interface Action<P = unknown> {
    type: string;
    payload?: P;
}
/**
 * Single-function middleware signature:
 * (ctx) => returns an Action or void
 */
export interface MiddlewareWithContext<S> {
    (ctx: MiddlewareContext<S>): Action | void;
}

export interface MiddlewareContext<S> {
    action: Action;
    store: {
        getState: () => S;
        dispatch: (action: Action) => Action | void;
    };
    next: Next;
}

export type Next = (action: Action) => Action | void;
