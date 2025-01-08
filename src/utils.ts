export function safeJSONParse<T>(data: string): T {
    try {
        return JSON.parse(data) as T;
    } catch (error) {
        return data as T;
    }
}
