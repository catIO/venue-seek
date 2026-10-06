/** Returns the URL only if it is http(s), so third-party data can't inject `javascript:` links. */
export function safeExternalUrl(value: string | undefined): string | undefined {
    if (!value) return undefined;
    try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : undefined;
    } catch {
        return undefined;
    }
}
