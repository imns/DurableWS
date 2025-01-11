import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
// https://github.com/akiomik/vitest-websocket-mock
import { defineStore } from "../src/helpers/store";
import type { Action } from "../src/types";

// Define a type for the message
type Message = { text: string };

const initialState = {
    messages: [] as Message[] // Explicitly type the messages array
};

const rootReducer = (state: typeof initialState, action: Action) => {
    switch (action.type) {
        case "ADD_MESSAGE":
            return {
                ...state,
                messages: [...state.messages, action.payload as Message] // Cast payload to Message
            };
        default:
            return state;
    }
};

describe("Store", () => {
    let store: ReturnType<typeof defineStore>;

    beforeEach(() => {
        store = defineStore(initialState, rootReducer);
    });

    afterEach(() => {
        // Clean up any side effects here if necessary
    });

    it("should return the initial state", () => {
        expect(store.getState()).toEqual(initialState);
    });

    it("should update state on dispatch", () => {
        const message: Message = { text: "Hello, world!" };
        store.dispatch("ADD_MESSAGE", message);
        expect((store.getState() as typeof initialState).messages).toContain(
            message
        );
    });

    it("should not update state for unknown action", () => {
        const prevState = store.getState();
        store.dispatch("UNKNOWN_ACTION");
        expect(store.getState()).toEqual(prevState);
    });

    it("should emit events on state change", () => {
        const message: Message = { text: "Hello, world!" };
        const onStateChanged = vi.fn();
        store.on("state-changed", onStateChanged);

        store.dispatch("ADD_MESSAGE", message);

        expect(onStateChanged).toHaveBeenCalledWith({
            type: "ADD_MESSAGE",
            state: store.getState()
        });
    });

    it("should allow unsubscribing from events", () => {
        const onStateChanged = vi.fn();
        store.on("state-changed", onStateChanged);

        store.dispatch("ADD_MESSAGE", { text: "Hello, world!" });
        store.off("state-changed", onStateChanged);

        store.dispatch("ADD_MESSAGE", { text: "Another message" });

        expect(onStateChanged).toHaveBeenCalledTimes(1);
    });
});
