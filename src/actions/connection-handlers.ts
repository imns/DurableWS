import { ClientState, SocketState } from "@/types";
import { composeActions } from "@/helpers/store";

export const onConnecting = () => ({
    event: "connecting",
    handler: (state: ClientState) => {
        return { ...state, connectionState: SocketState.CONNECTING };
    }
});

export function onConnected() {
    return {
        event: "connected",
        handler: (state: ClientState) => {
            return {
                ...state,
                connected: true,
                connectionState: SocketState.CONNECTED
            };
        }
    };
}

export function onClosed() {
    return {
        event: "closed",
        handler: (state: ClientState) => {
            return {
                ...state,
                connected: false,
                connectionState: SocketState.CLOSED
            };
        }
    };
}

export default composeActions(onConnecting, onConnected, onClosed);
