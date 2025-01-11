// store.ts
import { defineEventBus } from "./event-bus";
import {
    Action,
    MiddlewareWithContext,
    MiddlewareContext,
    Next
} from "@/types";

/**
 * This function takes a single-function middleware and returns
 * a triple-function: mw(store)(next)(action), which is done to
 * improve DX.
 */
export function wrapMiddleware<State>(
    middleware: MiddlewareWithContext<State>,
    store: { getState: () => State; dispatch: (a: Action) => Action | void }
) {
    return (next: Next) => (action: Action) => {
        const ctx: MiddlewareContext<State> = {
            action,
            store,
            next
        };
        return middleware(ctx);
    };
}

/**
 * Minimal "Redux-like" store that supports:
 * - getState
 * - dispatch
 * - event bus for listening
 * - `use` for registering single-function middlewares
 */
// Interface for the store

export function defineStore<S>(
    initialState: S,
    rootReducer: (state: S, action: Action) => S
) {
    let state = initialState;
    const bus = defineEventBus();

    // The final "dispatch" that applies the reducer & emits events
    function baseDispatch(action: Action) {
        const newState = rootReducer(state, action);
        if (newState !== state) {
            state = newState;
            bus.emit(action.type, state);
            bus.emit("state-changed", { type: action.type, state });
        }
        return action;
    }

    // We'll keep a reference to the current dispatch (initially baseDispatch)
    let dispatch: (action: Action) => Action | void = baseDispatch;

    function getState() {
        return state;
    }

    /**
     * `use` expects single-function middlewares,
     * then wraps them so they compose in a chain.
     */
    function use(...middlewares: MiddlewareWithContext<S>[]) {
        middlewares.forEach((mw) => {
            const oldDispatch = dispatch;
            dispatch = (action: Action) => {
                // Transform single-function middleware into triple-function
                const chain = wrapMiddleware(mw, {
                    getState,
                    dispatch: oldDispatch
                })(oldDispatch);
                // Now call the chain with the current action
                return chain(action);
            };
        });
    }

    return {
        on: bus.on,
        off: bus.off,
        getState,
        dispatch(actionType: string, payload?: unknown) {
            // Overload so you can do store.dispatch("close", { code: 123 })
            return dispatch({ type: actionType, payload });
        },
        use
    };
}
