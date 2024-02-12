# DurableWS (Durable Web Sockets)

DurableWS is a resilient, TypeScript-based WebSocket client designed for modern web applications. It offers robust connection handling, automatic reconnection with exponential backoff, idle detection, message queueing, and easy subscription management, ensuring your application maintains a reliable real-time connection under varying network conditions.

## Features

-   **Automatic Reconnection**: Implements exponential backoff strategy to handle disconnections gracefully.
-   **Idle Detection**: Automatically detects idle states and triggers custom handlers.
-   **Message Queueing**: Outgoing messages are queued when the connection is down and sent when it's restored.
-   **TypeScript Support**: Fully typed interfaces for a better development experience.

## Installation

```bash
npm install durablews
```

or

```bash
yarn add durablews
```

## Basic Usage

To get started with DurableWS, first import the client in your project:

```ts
import { defineClient } from "durablews";
```

Create a new WebSocket client instance by specifying the configuration:

```ts
const client = await defineClient({
    url: "wss://your.websocket.server",
    autoConnect: true, // Automatically connects
    maxReconnectAttempts: 5,
    maxQueueSize: 50,
    idleTimeout: 300000, // 5 minutes
    getToken: async () => {
        const response = await fetch("/my/token/issuer");
        const data = await response.json();
        return data.token;
    }
});
```

### Sending Messages

```typescript
client.send({
    action: "greet",
    data: {
        message: "Hello, World!"
    }
});
```

### Handling Events

```typescript
client.onMessage((message) => {
    console.log("Received message:", message);
});

client.onOpen(() => {
    console.log("Connection opened");
});

client.onError((error) => {
    console.error("Connection error:", error);
});

client.onClose(() => {
    console.log("Connection closed");
});

client.onIdle(() => {
    console.log("Client is idle");
});
```

## API Reference

### `defineClient(config: WebSocketClientConfig): Promise<WebSocketClient>`

Initializes and returns a WebSocket client instance.

#### Config Options

-   `url`: WebSocket server URL.
-   `autoConnect` (optional): Whether to connect immediately upon instantiation.
-   `maxReconnectAttempts` (optional): Maximum number of reconnection attempts.
-   `maxQueueSize` (optional): Maximum size of the message queue.
-   `idleTimeout` (optional): Duration in milliseconds before the client is considered idle.
-   `authTokenURL` (optional): A URL for token issuance.
-   `getToken (optional): Function that returns a token for authentication. Can be synchronous or asynchronous.

### WebSocketClient Methods

-   `send(message: Record<string, unknown>)`: Send a message through the WebSocket connection.
-   `subscribe(channelName: string)`: Subscribe to a channel.
-   `connect()`: Manually initiate the connection.
-   `disconnect()`: Disconnect the WebSocket connection.
-   `isReady()`: Returns a promise that resolves when the connection is ready.
-   `getStatus()`: Returns the current connection status.
-   `onMessage(listener: OnMessageHandler)`: Register a message event listener.
-   `onError(listener: OnErrorHandler)`: Register an error event listener.
-   `onOpen(listener: OnOpenHandler)`: Register an open event listener.
-   `onClose(listener: OnCloseHandler)`: Register a close event listener.
-   `onIdle(listener: OnIdleHandler)`: Register an idle event listener.

## Contributing

We welcome contributions! If you'd like to contribute, please fork the repository and use a feature branch. Pull requests are warmly welcome.

For major changes, please open an issue first to discuss what you would like to change.

## License

[Mozilla Public License 2.0](https://www.mozilla.org/en-US/MPL/2.0/)
