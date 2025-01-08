import {
    type EventBus,
    type StateMachine,
    SocketState,
    SocketEvent
} from "@/types";

export function defineStateMachine(eventBus: EventBus): StateMachine {
    let currentState: SocketState = SocketState.IDLE;

    function transition(event: SocketEvent): SocketState {
        let nextState: SocketState = currentState;

        // Emit a "before" event for hooks
        eventBus.emit(`before:${event}`);

        switch (currentState) {
            case SocketState.IDLE:
                if (event === "connecting") {
                    nextState = SocketState.CONNECTING;
                    eventBus.emit("connecting");
                }
                break;

            case SocketState.CONNECTING:
                if (event === "connected") {
                    nextState = SocketState.CONNECTED;
                    eventBus.emit("connected");
                } else if (event === "close") {
                    nextState = SocketState.RECONNECTING;
                    eventBus.emit("reconnecting");
                }
                break;

            case SocketState.CONNECTED:
                if (event === "disconnect") {
                    nextState = SocketState.CLOSED;
                    eventBus.emit("disconnected");
                } else if (event === "close") {
                    nextState = SocketState.CLOSED;
                    eventBus.emit("closed");
                }
                break;

            case SocketState.RECONNECTING:
                if (event === "connected") {
                    nextState = SocketState.CONNECTED;
                    eventBus.emit("connected");
                } else if (event === "close") {
                    nextState = SocketState.CLOSED;
                    eventBus.emit("closed");
                }
                break;

            case SocketState.CLOSED:
                if (event === "connecting") {
                    nextState = SocketState.CONNECTING;
                    eventBus.emit("connecting");
                }
                break;
        }

        // Emit a state change event if the state has changed
        if (currentState !== nextState) {
            eventBus.emit("stateChanged", {
                from: currentState,
                to: nextState
            });
        }

        // Update the current state
        currentState = nextState;

        // Emit an "after" event for hooks
        eventBus.emit(`after:${event}`);
        return nextState;
    }

    function getState(): SocketState {
        return currentState;
    }

    return {
        transition,
        getState
    };
}
