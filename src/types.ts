// types.ts
export interface WebSocketClientConfig {
    url: string;
    accessToken?: string;
    autoConnect?: boolean;
    maxReconnectAttempts?: number;
    maxQueueSize?: number;
    idleTimeout?: number; // in milliseconds
    authTokenURL?: string; // Optional tokenURL for token issuance
    getToken?: () => Promise<string> | string;
}

export interface WebSocketClient {
    send: (message: Record<string, unknown>) => void;
    // subscribe: (channelName: string) => void;
    connect: () => void;
    disconnect: () => void;
    isReady: () => Promise<void>;
    getStatus: () => WebSocketClientState;
    onMessage: (listener: OnMessageHandler) => void;
    onError: (listener: OnErrorHandler) => void;
    onOpen: (listener: OnOpenHandler) => void;
    onClose: (listener: OnCloseHandler) => void;
    onIdle: (listener: OnIdleHandler) => void;
}

export enum WebSocketClientState {
    DISCONNECTED = "DISCONNECTED",
    CONNECTING = "CONNECTING",
    CONNECTED = "CONNECTED",
    CLOSING = "CLOSING",
    CLOSED = "CLOSED"
}

export type OnMessageHandler = (message: Record<string, unknown>) => void;
export type OnErrorHandler = (error: Event) => void;
export type OnOpenHandler = () => void;
export type OnCloseHandler = (event: CloseEvent) => void;
export type OnIdleHandler = () => void;
