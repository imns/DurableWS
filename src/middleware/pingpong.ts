import type {
    ClientState,
    Middleware,
    MiddlewareContext,
    NextFn
} from "@/types";

export const pingpong: Middleware = (ctx, next) => {
    if (ctx.action.type === "message" && ctx.action.payload === "ping") {
        ctx.client.send("pong");
    }
    return next();
};

export async function logger(
    ctx: MiddlewareContext<ClientState>,
    next: NextFn
) {
    console.log(`[INFO] event ${ctx.action.type} called`);
    return await next();
}
