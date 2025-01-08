import type {
    WebSocketClientConfig,
    WebSocketClient,
    OnMessageHandler,
    OnErrorHandler,
    OnOpenHandler,
    OnCloseHandler,
    OnIdleHandler
} from "./types";
import { WebSocketClientState } from "./types";

let instance: WebSocketClient | null = null;

export async function defineClient(
    config: WebSocketClientConfig
): Promise<WebSocketClient> {
    if (instance) {
        return instance;
    }

    let ws: WebSocket | null = null;

    const maxQueueSize = config.maxQueueSize || 10;

    const messageQueue: Record<string, unknown>[] = [];

    // Auth
    let token: string | undefined;

    // Reconnect
    const maxReconnectAttempts = config.maxReconnectAttempts || 5;
    const reconnectTimeouts = Array.from(
        { length: maxReconnectAttempts },
        (_, i) => Math.pow(2, i) * 1000
    );

    // Idle
    const idleTimeoutDuration = config.idleTimeout || 5 * 60 * 1000; // Default to 5 minutes
    let idleTimeout: NodeJS.Timeout;

    const resetIdleTimer = () => {
        clearTimeout(idleTimeout);
        idleTimeout = setTimeout(() => {
            listeners.idle.forEach((listener) => listener());
        }, idleTimeoutDuration);
    };

    // Monitor user activity
    window.addEventListener("mousemove", resetIdleTimer);
    window.addEventListener("keydown", resetIdleTimer);
    window.addEventListener("mousedown", resetIdleTimer);

    // Initialize the idle timer
    resetIdleTimer();

    // Grab or create a client token
    if (config.getToken) {
        token = await config.getToken();
    } else if (!token && config.authTokenURL) {
        // Default token fetching logic if `getToken` is not provided but `authBaseUrl` is
        const tokenData = await fetch(config.authTokenURL).then((r) =>
            r.json()
        );
        token = tokenData.token;
    }

    const reconnect = (attempt = 0) => {
        let wsUrl = config.url;
        if (token) {
            // Adding 'Authorization' header would be ideal, but it's not supported by WebSocket API
            wsUrl += `?token=${encodeURIComponent(token)}`;
        }
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            // Try to send all the messages in the queue
            /* eslint-disable  @typescript-eslint/no-explicit-any */
            let message: any;
            while (messageQueue.length > 0) {
                message = messageQueue.shift();
                try {
                    if (message && ws?.readyState === WebSocket?.OPEN) {
                        ws.send(JSON.stringify(message));
                    } else {
                        throw new Error(
                            "Message not sent due to WebSocket not being in OPEN state"
                        );
                    }
                } catch (err) {
                    console.error(err);
                    // If sending the message failed, put it back into the queue
                    messageQueue.unshift(message);
                    // localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
                    break;
                }
            }

            listeners.open.forEach((listener) => listener());
        };

        ws.onmessage = (event: MessageEvent) => {
            try {
                const message = JSON.parse(event.data);
                listeners.message.forEach((listener) => listener(message));
            } catch (error) {
                if (
                    (event?.data && typeof event?.data === "string") ||
                    event?.data instanceof String
                ) {
                    listeners.message.forEach((listener) =>
                        listener({ data: event?.data })
                    );
                } else {
                    console.log(typeof event);
                    console.log(event);
                    console.error("Failed to parse message data:", error);
                }
            }
        };

        ws.onclose = (event: CloseEvent) => {
            if (
                ws &&
                ws.readyState !== WebSocket?.CLOSED &&
                attempt < maxReconnectAttempts - 1 &&
                // Exclude normal closure from reconnection attempts
                event.code !== 1000
            ) {
                setTimeout(
                    () => reconnect(attempt + 1),
                    reconnectTimeouts[attempt]
                );
            }
            listeners.close.forEach((listener) => listener(event));
        };

        ws.onerror = (event: Event) => {
            listeners.error.forEach((listener) => listener(event));
        };
    };

    const send = (message: Record<string, unknown>) => {
        if (ws?.readyState === WebSocket?.OPEN) {
            ws.send(JSON.stringify(message));
        } else if (ws?.readyState !== WebSocket?.CLOSED) {
            // Push the new message to the end of the queue
            messageQueue.push(message);
            // If the queue size exceeds maxQueueSize, remove the oldest message from the start of the queue
            if (messageQueue.length > maxQueueSize) {
                messageQueue.shift();
            }
        }
    };

    // TODO: Implement channel subscription
    // const subscribe = (channelName: string) => {
    //     send({
    //         action: "channel:subscribe",
    //         message: {
    //             channelName: channelName,
    //         },
    //     });
    // };

    const connect = () => {
        if (!ws || ws.readyState === WebSocket?.CLOSED) {
            reconnect();
        }
    };

    const disconnect = () => {
        if (ws) {
            ws.close();
        }
    };

    const isReady = () => {
        return new Promise<void>((resolve, reject) => {
            if (ws?.readyState === WebSocket?.OPEN) {
                resolve();
            } else {
                ws?.addEventListener("open", () => resolve(), { once: true });
                ws?.addEventListener("error", reject, { once: true });
            }
        });
    };

    const getStatus = (): WebSocketClientState => {
        if (!ws) {
            return WebSocketClientState.DISCONNECTED;
        }
        switch (ws.readyState) {
            case WebSocket.CONNECTING:
                return WebSocketClientState.CONNECTING;
            case WebSocket.OPEN:
                return WebSocketClientState.CONNECTED;
            case WebSocket.CLOSING:
                return WebSocketClientState.CLOSING;
            case WebSocket.CLOSED:
                return WebSocketClientState.CLOSED;
            default:
                return WebSocketClientState.DISCONNECTED;
        }
    };

    const listeners = {
        message: [] as OnMessageHandler[],
        error: [] as OnErrorHandler[],
        open: [] as OnOpenHandler[],
        close: [] as OnCloseHandler[],
        idle: [] as OnIdleHandler[]
    };

    const onMessage = (listener: OnMessageHandler) => {
        listeners.message.push(listener);
        return () => {
            const index = listeners.message.indexOf(listener);
            if (index !== -1) {
                listeners.message.splice(index, 1);
            }
        };
    };

    const onError = (listener: OnErrorHandler) => {
        listeners.error.push(listener);
        return () => {
            const index = listeners.error.indexOf(listener);
            if (index !== -1) {
                listeners.error.splice(index, 1);
            }
        };
    };

    const onOpen = (listener: OnOpenHandler) => {
        listeners.open.push(listener);
        return () => {
            const index = listeners.open.indexOf(listener);
            if (index !== -1) {
                listeners.open.splice(index, 1);
            }
        };
    };

    const onClose = (listener: OnCloseHandler) => {
        listeners.close.push(listener);
        return () => {
            const index = listeners.close.indexOf(listener);
            if (index !== -1) {
                listeners.close.splice(index, 1);
            }
        };
    };

    const onIdle = (listener: OnIdleHandler) => {
        listeners.idle.push(listener);
        return () => {
            const index = listeners.idle.indexOf(listener);
            if (index !== -1) {
                listeners.idle.splice(index, 1);
            }
        };
    };

    instance = {
        send,
        // subscribe,
        onMessage,
        onError,
        onOpen,
        onClose,
        onIdle,
        connect,
        disconnect,
        isReady,
        getStatus
    };

    if (config.autoConnect !== false) {
        connect();
    }

    return instance;
}
