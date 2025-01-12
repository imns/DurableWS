import { defineEventBus } from "./event-bus";
import type { Action } from "@/types";

/** A state-updater function triggered by an event. */
export interface HandlerFn<S> {
    (state: S, payload: unknown): S | void;
}

/** Middleware signature.
 *  The `context` includes the store, current action, etc.
 *  The `next` callback proceeds to the next middleware or final action.
 */
export type Middleware<S> = (
    context: MiddlewareContext<S>,
    next: () => Promise<Action> | Action
) => Promise<Action> | Action;

/** Info passed to each middleware. */
export interface MiddlewareContext<S> {
    /** The action being dispatched right now. */
    action: Action;
    /** Current store state (before final handlers run). */
    state: S;
    /** Reference to the store.
     *  - Some libraries expose the entire store;
     *    you can omit certain methods if you want to limit the API.
     */
    dispatch: (
        eventName: string,
        payload?: unknown
    ) => Promise<Action> | Action;
    /** If you want the original event name/payload, you can store them here
     *  or rely on `action.type` / `action.payload`.
     */
}

export interface Store<S> {
    getState(): S;
    dispatch(eventName: string, payload?: unknown): Promise<Action> | Action;
    on<T = unknown>(eventName: string, callback: (payload: T) => void): void;
    off<T = unknown>(eventName: string, callback: (payload: T) => void): void;
    defineAction(eventName: string, handler: HandlerFn<S>): void;
    use(...middlewares: Middleware<S>[]): void;
}

/**
 * A helper for registering multiple event-action mappings at once.
 * Each entry is { event, handler }.
 */
export interface ActionRegistration<S> {
    event: string;
    handler: HandlerFn<S>;
}

export function composeActions<S>(...regs: ActionRegistration<S>[]) {
    return (store: Store<S>) => {
        regs.forEach(({ event, handler }) => {
            store.defineAction(event, handler);
        });
    };
}

/**
 * Creates a store with:
 *  - internal state
 *  - a map of eventName -> list of handler functions
 *  - an event bus for external subscriptions
 *  - a middleware pipeline for each dispatch
 *
 * Example usage:
 *
 * const store = defineStore({ count: 0 });
 *
 * // Define middleware
 *   store.use(
 *      (ctx, next) => {
 *          console.log("[middleware1] Before dispatch:", ctx.action.type);
 *          const result = next(); // could be a Promise or Action
 *          console.log("[middleware1] After dispatch:", ctx.action.type);
 *          return result;
 *      }
 *   );
 *
 *   store.defineAction("increment", (state, payload) => {
 *       return { ...state, count: state.count + 1 };
 *   });
 *
 *   store.dispatch("increment"); // triggers that handler
 *   console.log(store.getState()); // => { count: 1 }
 */
export function defineStore<S>(initialState: S): Store<S> {
    let state = initialState;
    const bus = defineEventBus();

    // Map from eventName -> list of handler functions
    const actionHandlers = new Map<string, Array<HandlerFn<S>>>();

    // Ordered list of middlewares to run on each dispatch
    const middlewares: Middleware<S>[] = [];

    /**
     * Registers a handler for a specific event name
     * e.g. store.defineAction("increment", (state, payload) => newState)
     */
    function defineAction(eventName: string, handler: HandlerFn<S>) {
        const existing = actionHandlers.get(eventName) ?? [];
        existing.push(handler);
        actionHandlers.set(eventName, existing);
    }

    /** Add one or more middleware functions. */
    function use(...mws: Middleware<S>[]) {
        middlewares.push(...mws);
    }

    /**
     * The final step after all middlewares have run.
     * It updates the store state by calling each handler for the given eventName,
     * then emits the relevant events.
     */
    function runHandlersAndEmit(eventName: string, payload?: unknown): Action {
        const handlers = actionHandlers.get(eventName) ?? [];
        let stateChanged = false;

        for (const handler of handlers) {
            try {
                const newState = handler(state, payload);
                if (newState !== undefined && newState !== state) {
                    state = newState;
                    stateChanged = true;
                }
            } catch (error) {
                console.error(
                    `Handler for ${eventName} threw an error:`,
                    error
                );
                throw error;
            }
        }

        bus.emit(eventName, payload);

        if (stateChanged) {
            bus.emit("state-changed", { type: eventName, state });
        }

        return { type: eventName, payload };
    }

    /**
     * Recursively call each middleware in order. If we’ve called all of them,
     * runHandlersAndEmit is invoked to do the actual state update and event emission.
     */
    function applyMiddlewares(
        context: MiddlewareContext<S>
    ): Promise<Action> | Action {
        let index = -1;

        return executeMiddleware(0);

        async function executeMiddleware(i: number): Promise<Action> {
            if (i <= index) {
                throw new Error("next() called multiple times");
            }
            index = i;

            const middleware = middlewares[i];
            if (!middleware) {
                // No more middleware, invoke the final handler
                const { type, payload } = context.action;
                return runHandlersAndEmit(type, payload);
            }

            // Todo: maybe add some error handling here with try/catch
            return middleware(context, () => executeMiddleware(i + 1));
        }
    }

    /** The public dispatch method.
     *  Wraps action info into a context, then runs the pipeline.
     */
    function dispatch(
        eventName: string,
        payload?: unknown
    ): Promise<Action> | Action {
        const action: Action = { type: eventName, payload };
        const context: MiddlewareContext<S> = {
            action,
            state,
            dispatch
        };
        return applyMiddlewares(context);
    }

    function getState(): S {
        return state;
    }

    // Expose the standard event bus API for external subscriptions:
    return {
        getState,
        dispatch,
        defineAction,
        use,
        on: bus.on,
        off: bus.off
    };
}
