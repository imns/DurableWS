import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
// https://github.com/akiomik/vitest-websocket-mock
import WS from "vitest-websocket-mock";
import { client } from "../src/client";
import type { WebSocketClient } from "../src/types";

const WEBSOCKET_URL = "ws://localhost:1234";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("Store", () => {
    let server: WS;
    let wsClient: WebSocketClient;

    beforeEach(async () => {
        server = new WS(WEBSOCKET_URL);
        wsClient = client({
            url: WEBSOCKET_URL
        });
        await wsClient.connect();
        await server.connected;
    });

    afterEach(() => {
        WS.clean();
    });

    it("it should work", async () => {
        const spy = vi.fn();
        wsClient.on("close", spy);

        const loggerMiddleware = ({ action, store, next }) => {
            console.log("[logger] Dispatching:", action);
            const result = next(action);
            console.log("[logger] Next state:", store.getState());
            return result;
        };

        // wsClient.use(loggerMiddleware);

        // wsClient.send({ type: "message", payload: "hello" });

        server.send(JSON.stringify({ data: "test message" }));
        wsClient.close();
        await wait(100);

        expect(spy).toHaveBeenCalled();
    });
});
