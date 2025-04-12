const rateLimit = new Map<string, { count: number; resetTime: number }>();

const LIMIT = 75;
const WINDOW = 10 * 60 * 1000; // 10 minutes in milliseconds

export function checkRateLimit(sessionId: string): boolean {
    const now = Date.now();
    const userLimit = rateLimit.get(sessionId);

    if (!userLimit || now > userLimit.resetTime) {
        rateLimit.set(sessionId, {
            count: 1,
            resetTime: now + WINDOW
        });
        return true;
    }

    if (userLimit.count >= LIMIT) {
        return false;
    }

    userLimit.count += 1;
    return true;
}
