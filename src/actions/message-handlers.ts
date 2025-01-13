import { ClientState, Payload } from "@/types";

export function onMessage(state: ClientState, payload: Payload) {
    return { ...state, messages: [...state.messages, payload] };
}
