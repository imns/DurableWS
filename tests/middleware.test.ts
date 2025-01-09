import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import WS from "vitest-websocket-mock";

import { defineClient } from "../src/index";
import type { WebSocketClient, MiddlewareContext } from "../src/types";

const WEBSOCKET_URL = "ws://localhost:1234";

// Helper: Wait for a given amount of milliseconds
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("Middleware", () => {
    let server: WS;
    let client: WebSocketClient;

    beforeEach(async () => {
        server = new WS(WEBSOCKET_URL);
        client = defineClient({
            url: WEBSOCKET_URL
        });
        client.connect();
        await server.connected;
    });

    afterEach(() => {
        WS.clean();
    });

    it.skip("should compose middleware", async () => {
        console.log("before use");

        const logger = async (ctx, next) => {
            console.log("before next");
            await next();
            console.log("after next");
        };
        client.use(logger);
        await client.connect();
    });

    it("should listen to the message event", async () => {
        const messageHandler = vi.fn();

        const logger = async (
            ctx: MiddlewareContext,
            next: () => Promise<void>
        ) => {
            console.log("logger middleware");

            ctx.eventBus.on("connected", () => {
                console.log("connected");
                ctx.eventBus.on("message", messageHandler);
            });
            await next();
        };

        client.use(logger);
        await client.connect();

        // Send a message and test the handler.
        client.send({ data: "test" });
        await new Promise((resolve) => setTimeout(resolve, 100));
        expect(messageHandler).toHaveBeenCalledWith({ data: "test" });
    });
});
