export interface WebSocketClientConfig {
    readonly url: string;
    // TODO: Add other config options here
}

export type Payload = string | unknown;

export interface ClientState {
    messages: Payload[];
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
    use: (middleware: Middleware<ClientState>) => void;
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
export interface Action<T = Payload> {
    type: string;
    payload?: T;
}

// A state-updater function triggered by an event
export interface HandlerFn<S> {
    (state: S, payload: unknown): S | void;
}

export type NextFn = () => Promise<Action> | Action;

/** Middleware signature.
 *  The `context` includes the store, current action, etc.
 *  The `next` callback proceeds to the next middleware or final action.
 */
export type Middleware<S = unknown> = (
    context: MiddlewareContext<S>,
    next: NextFn
) => Promise<Action> | Action;

// Info passed to each middleware
export interface MiddlewareContext<S = unknown> {
    // Everything from the store’s middleware context:
    action: Action;
    state: S;
    // Plus references to the client, config, store, etc.:
    client: WebSocketClient;
    config: WebSocketClientConfig;
}

export interface Store<S> {
    setContext(ctx: Partial<MiddlewareContext<S>>): void;
    getState(): S;
    dispatch(eventName: string, payload?: unknown): Promise<Action> | Action;
    on<T = unknown>(eventName: string, callback: (payload: T) => void): void;
    off<T = unknown>(eventName: string, callback: (payload: T) => void): void;
    defineAction(eventName: string, handler: HandlerFn<S>): void;
    defineActions(
        actions: Array<{ event: string; handler: HandlerFn<S> }>
    ): void;
    use(...middlewares: Middleware<S>[]): void;
}

/**
 * A helper for registering multiple event-action mappings at once.
 * Each entry is { event, handler }.
 */
export interface ActionRegistration<S> {
    event: string;
    handler: HandlerFn<S>;
}
