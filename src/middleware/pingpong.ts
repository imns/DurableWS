import type { Middleware } from "../types";

export const pingpong: Middleware = async (ctx, next) => {
    ctx.eventBus.on("message", (message) => {
        if (message === "ping") {
            ctx.client.send("pong");
        }
    });
    await next();
};
