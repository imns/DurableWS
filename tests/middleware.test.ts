import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { defineClient } from "../src/index";
import type { WebSocketClient, MiddlewareContext } from "../src/types";

describe("Middleware", () => {
    let client: WebSocketClient;
    beforeEach(() => {
        client = defineClient({ url: "ws://localhost:1234" });
    });

    afterEach(() => {
        client.close();
    });

    it("should compose middleware", async () => {
        console.log("before use");

        const logger = async (ctx, next) => {
            console.log("before next");
            await next();
            console.log("after next");
        };
        client.use(logger);
        await client.connect();
    });

    it.todo("should listen to the message event", async () => {
        const messageHandler = vi.fn();
        const logger = async (
            ctx: MiddlewareContext,
            next: () => Promise<void>
        ) => {
            ctx.eventBus.on("message", messageHandler);
            await next();
        };
        client.use(logger);
        await client.connect();
        client.send({ data: "test" });
        await new Promise((resolve) => setTimeout(resolve, 100));
        expect(messageHandler).toHaveBeenCalledWith({ data: "test" });
    });
});
