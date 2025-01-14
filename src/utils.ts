export function safeJSONParse<T>(data: string): T {
    try {
        return JSON.parse(data) as T;
    } catch (error) {
        return data as T;
    }
}

/**
 * Normalizes a URL by extracting and cleaning the host
 * @throws {Error} If URL is invalid or empty
 */
export function normalizeURL(url: string): string {
    if (!url?.trim()) {
        throw new Error("URL cannot be empty");
    }

    try {
        const urlObj = new URL(url);
        let host = urlObj.host.toLowerCase(); // Normalize case

        // Remove trailing slash if present
        host = host.replace(/\/+$/, "");

        // Validate pathname
        if (urlObj.pathname && urlObj.pathname !== "/") {
            throw new Error("URL should not contain a path");
        }

        return host;
    } catch (error: unknown) {
        throw new Error(
            `Invalid URL: ${error instanceof Error ? error.message : String(error)}`
        );
    }
}
