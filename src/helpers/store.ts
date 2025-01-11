// store.ts
import { defineEventBus } from "./event-bus";
import type { Action } from "@/types";

export function composeReducers<S>(
    ...reducers: Array<(state: S, action: Action) => S>
) {
    return (state: S, action: Action): S => {
        return reducers.reduce(
            (currentState, reducer) => reducer(currentState, action),
            state
        );
    };
}

/**
 * Minimal "Redux-like" store that supports:
 * - getState
 * - dispatch
 * - event bus for listening
 */
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
            bus.emit(action.type, action.payload);
            bus.emit("state-changed", { type: action.type, state });
        }
        return action;
    }

    // We'll keep a reference to the current dispatch (initially baseDispatch)
    const dispatch: (action: Action) => Action | void = baseDispatch;

    function getState(): S {
        return state;
    }

    return {
        on: bus.on,
        off: bus.off,
        getState,
        dispatch(actionType: string, payload?: unknown) {
            // Overload so you can do store.dispatch("close", { code: 123 })
            return dispatch({ type: actionType, payload });
        }
    };
}
