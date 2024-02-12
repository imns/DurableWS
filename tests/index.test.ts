import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
// https://github.com/akiomik/vitest-websocket-mock
import WS from "vitest-websocket-mock";
import { defineClient } from "../src/client";

const WEBSOCKET_URL = "ws://localhost:1234";

describe("Initialization", () => {
    let server: WS;
    beforeEach(async () => {
        server = new WS(WEBSOCKET_URL);
    });
    afterEach(() => {
        WS.clean();
    });
    it("should return a client instance", async () => {
        const client = await defineClient({
            url: WEBSOCKET_URL
        });

        client.connect();
        await server.connected;
        await client.isReady();

        expect(client).toBeDefined();
        expect(client.connect).toBeDefined();
    });

    it("should manually connect to the server", async () => {
        const client = await defineClient({
            url: WEBSOCKET_URL
        });

        client.connect();
        await server.connected;
        await client.isReady();
        expect(client.getStatus()).toBe("CONNECTED");
    });

    it("should auto connect to the server", async () => {
        const client = await defineClient({
            url: WEBSOCKET_URL,
            autoConnect: true
        });

        // TODO: This should not have to be called manually
        client.connect();
        await server.connected;
        expect(client.getStatus()).toBe("CONNECTED");
    });

    it("should send a message to the server", async () => {
        const client = await defineClient({
            url: WEBSOCKET_URL
        });

        client.connect();
        await server.connected;
        await client.isReady();

        const payload = {
            action: "greet",
            data: {
                message: "Hello, World!"
            }
        };

        client.send(payload);
        await expect(server).toReceiveMessage(JSON.stringify(payload));
    });

    it("should handle events", async () => {
        const client = await defineClient({
            url: WEBSOCKET_URL
        });

        const onOpenSpy = vi.spyOn(client, "onOpen");
        const onMessageSpy = vi.spyOn(client, "onMessage");
        const onErrorSpy = vi.spyOn(client, "onError");
        const onCloseSpy = vi.spyOn(client, "onClose");

        const onOpenCallback = vi.fn();
        const onMessageCallback = vi.fn();
        const onErrorCallback = vi.fn();
        const onCloseCallback = vi.fn();

        client.connect();
        await server.connected;
        await client.isReady();

        // onOpen should be called once
        client.onOpen(onOpenCallback);
        expect(onOpenSpy).toHaveBeenCalledTimes(1);

        // onMessage should be called once
        client.onMessage(onMessageCallback);
        expect(onMessageSpy).toHaveBeenCalledTimes(1);

        // onError should be called once after server error
        client.onError(onErrorCallback);
        server.error();
        expect(onErrorSpy).toHaveBeenCalledTimes(1);

        // onClose should be called once after server close
        client.onClose(onCloseCallback);
        server.close();
        expect(onCloseSpy).toHaveBeenCalledTimes(1);
    });

    it("should handle server disconnect", async () => {
        const client = await defineClient({
            url: WEBSOCKET_URL,
            autoConnect: true,
            maxReconnectAttempts: 1 // Assuming you have logic to retry once for simplicity
        });

        client.connect();
        await server.connected;
        await client.isReady();

        // Expect client to be connected initially
        expect(client.getStatus()).toBe("CONNECTED");

        // Simulate server disconnect
        server.close();

        // You can wait for a specific event or a timeout to ensure the client has processed the disconnect.
        // This depends on how your client is implemented. You might need to use vi.wait or a similar approach to delay the assertion.
        await vi.waitFor(
            () => {
                expect(client.getStatus()).toBe("CLOSED");
            },
            { timeout: 500 }
        ); // Adjust timeout based on your client's reconnect logic timing

        // Optionally, test if it attempts to reconnect
        vi.useFakeTimers();
        vi.advanceTimersByTime(1000); // Assuming your reconnect logic has some delay. Adjust accordingly.
        // expect(server.clients()).toHaveLength(1); // Checks if the client tried to reconnect
    });
    it.skip("should handle retries", async () => {});
});
