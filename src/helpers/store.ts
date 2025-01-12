import { defineEventBus } from "./event-bus";
import type { Action } from "@/types";

export interface HandlerFn<S> {
    (state: S, payload: unknown): S | void;
}

export interface Store<S> {
    getState(): S;
    dispatch(eventName: string, payload?: unknown): Action;
    on<T = unknown>(eventName: string, callback: (payload: T) => void): void;
    off<T = unknown>(eventName: string, callback: (payload: T) => void): void;
    defineAction(eventName: string, handler: HandlerFn<S>): void;
}

/**
 * Example usage:
 *
 *   const store = defineStore({ count: 0 });
 *   store.defineAction("increment", (state, payload) => {
 *       return { ...state, count: state.count + 1 };
 *   });
 *   store.dispatch("increment"); // triggers that handler
 *   console.log(store.getState()); // => { count: 1 }
 */
export function defineStore<S>(initialState: S): Store<S> {
    let state = initialState;
    const bus = defineEventBus();

    // Map from eventName -> list of handler functions
    const actionHandlers = new Map<string, Array<HandlerFn<S>>>();

    /**
     * Registers a handler for a specific event name
     * e.g. store.defineAction("increment", (state, payload) => newState)
     */
    function defineAction(eventName: string, handler: HandlerFn<S>) {
        const existing = actionHandlers.get(eventName) ?? [];
        existing.push(handler);
        actionHandlers.set(eventName, existing);
    }

    /**
     * Dispatch an event to run all associated handlers and update state.
     * Then, emit the event and "state-changed" for external listeners.
     */
    function dispatch(eventName: string, payload?: unknown): Action {
        const handlers = actionHandlers.get(eventName) ?? [];
        for (const handler of handlers) {
            const newState = handler(state, payload);
            if (newState !== undefined) {
                state = newState;
            }
        }

        // Notify external subscribers on this specific event
        bus.emit(eventName, payload);
        // Also emit a general "state-changed" event for global listeners
        bus.emit("state-changed", { type: eventName, state });
        return { type: eventName, payload };
    }

    function getState(): S {
        return state;
    }

    // Expose the standard event bus API for external subscriptions:
    return {
        getState,
        dispatch,
        on: bus.on,
        off: bus.off,
        defineAction
    };
}
