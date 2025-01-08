import { describe, it, expect, beforeEach, vi } from "vitest";
import { defineStateMachine } from "../src/helpers/state-machine";
import { defineEventBus } from "../src/helpers/event-bus";
import { SocketState, SocketEvent, EventBus, StateMachine } from "../src/types";

describe("StateMachine", () => {
    let eventBus: EventBus;
    let stateMachine: StateMachine;

    beforeEach(() => {
        eventBus = defineEventBus();
        stateMachine = defineStateMachine(eventBus);
    });

    it("should start in IDLE state", () => {
        expect(stateMachine.getState()).toBe(SocketState.IDLE);
    });

    it('should transition from IDLE to CONNECTING on "connect" event', () => {
        const spy = vi.fn();
        eventBus.on("connecting", spy);

        stateMachine.transition("connecting");
        expect(stateMachine.getState()).toBe(SocketState.CONNECTING);
        expect(spy).toHaveBeenCalled();
    });

    it('should transition from CONNECTING to CONNECTED on "connected" event', () => {
        stateMachine.transition("connecting"); // Move to CONNECTING
        const spy = vi.fn();
        eventBus.on("connected", spy);

        stateMachine.transition("connected");
        expect(stateMachine.getState()).toBe(SocketState.CONNECTED);
        expect(spy).toHaveBeenCalled();
    });

    it('should transition from CONNECTED to CLOSED on "disconnect" event', () => {
        stateMachine.transition("connecting"); // Move to CONNECTING
        stateMachine.transition("connected"); // Move to CONNECTED
        const spy = vi.fn();
        eventBus.on("disconnected", spy);

        stateMachine.transition("disconnect");
        expect(stateMachine.getState()).toBe(SocketState.CLOSED);
        expect(spy).toHaveBeenCalled();
    });

    it('should transition from CONNECTING to RECONNECTING on "close" event', () => {
        stateMachine.transition("connecting"); // Move to CONNECTING
        const spy = vi.fn();
        eventBus.on("reconnecting", spy);

        stateMachine.transition("close");
        expect(stateMachine.getState()).toBe(SocketState.RECONNECTING);
        expect(spy).toHaveBeenCalled();
    });

    it('should transition from RECONNECTING to CONNECTED on "connected" event', () => {
        stateMachine.transition("connecting"); // Move to CONNECTING
        stateMachine.transition("close"); // Move to RECONNECTING
        const spy = vi.fn();
        eventBus.on("connected", spy);

        stateMachine.transition("connected");
        expect(stateMachine.getState()).toBe(SocketState.CONNECTED);
        expect(spy).toHaveBeenCalled();
    });

    it('should emit "stateChanged" event on state change', () => {
        const spy = vi.fn();
        eventBus.on("stateChanged", spy);

        stateMachine.transition("connecting");
        expect(spy).toHaveBeenCalledWith({
            from: SocketState.IDLE,
            to: SocketState.CONNECTING
        });
    });

    // Test for invalid transitions
    it("should not transition from IDLE to CONNECTED directly", () => {
        stateMachine.transition("connected");
        expect(stateMachine.getState()).toBe(SocketState.IDLE);
    });

    // Test for repeated events
    it('should remain in CONNECTING state on repeated "connecting" events', () => {
        stateMachine.transition("connecting");
        stateMachine.transition("connecting");
        expect(stateMachine.getState()).toBe(SocketState.CONNECTING);
    });

    // Test for event emission order
    it("should emit events in the correct order during transition", () => {
        const beforeSpy = vi.fn();
        const afterSpy = vi.fn();
        eventBus.on("before:connected", beforeSpy);
        eventBus.on("after:connected", afterSpy);

        stateMachine.transition("connected");

        // Check the order of calls
        expect(beforeSpy.mock.invocationCallOrder[0]).toBeLessThan(
            afterSpy.mock.invocationCallOrder[0]
        );
    });
});
