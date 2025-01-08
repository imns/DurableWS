import type { EventBus } from "@/types";

export function defineEventBus(): EventBus {
    const listeners = new Map<string, Array<(payload: unknown) => void>>();

    function on<T = unknown>(eventName: string, handler: (payload: T) => void) {
        const handlers = listeners.get(eventName) ?? [];
        handlers.push(handler as (payload: unknown) => void);
        listeners.set(eventName, handlers);
    }

    function off<T = unknown>(
        eventName: string,
        handler: (payload: T) => void
    ) {
        const handlers = listeners.get(eventName);
        if (!handlers) return;
        listeners.set(
            eventName,
            handlers.filter((h) => h !== handler)
        );
    }

    function emit<T = unknown>(eventName: string, payload: T) {
        const handlers = listeners.get(eventName);
        handlers?.forEach((fn) => fn(payload));
    }

    return { on, off, emit };
}
