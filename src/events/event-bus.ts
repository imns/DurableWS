import type { EventBus } from "@/types";

export function defineEventBus(): EventBus {
    function on<T = unknown>(
        eventName: string,
        handler: (payload: T) => void
    ) {}

    function off<T = unknown>(
        eventName: string,
        handler: (payload: T) => void
    ) {}

    function emit<T = unknown>(eventName: string, payload: T) {}

    return { on, off, emit };
}
