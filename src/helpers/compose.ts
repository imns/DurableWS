import { EventBus, StateMachine } from "@/types";

export type Middleware = (
    context: MiddlewareContext,
    next: () => Promise<void>
) => Promise<void>;

export interface MiddlewareContext {
    eventBus: EventBus;
    state: StateMachine;
    [key: string]: any;
}

export const compose = (
    middleware: Middleware[],
    onError?: (err: Error, context: MiddlewareContext) => Promise<void>
): ((context: MiddlewareContext) => Promise<void>) => {
    return async (context) => {
        let index = -1;

        const dispatch = async (i: number): Promise<void> => {
            if (i <= index) {
                throw new Error("next() called multiple times");
            }
            index = i;

            const handler = middleware[i];
            if (!handler) return; // If no more middleware, just return.

            try {
                await handler(context, () => dispatch(i + 1));
            } catch (err) {
                if (onError) {
                    await onError(err as Error, context);
                } else {
                    throw err; // Re-throw if no error handler is provided.
                }
            }
        };

        await dispatch(0);
    };
};
