// Simple in-memory cache for sessions
interface CachedSession {
  user: any;
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
    token: string;
  };
  cachedAt?: Date;
}

class SessionCache {
  private cache = new Map<string, CachedSession>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes

  set(token: string, session: CachedSession) {
    this.cache.set(token, {
      ...session,
      cachedAt: new Date()
    });
  }

  get(token: string): CachedSession | null {
    const cached = this.cache.get(token);
    
    if (!cached) {
      return null;
    }

    // Check if cache is expired
    const now = new Date();
    const isExpired = cached.cachedAt && now.getTime() - cached.cachedAt.getTime() > this.TTL;
    
    if (isExpired) {
      this.cache.delete(token);
      return null;
    }

    // Check if session itself is expired
    if (cached.session.expiresAt < now) {
      this.cache.delete(token);
      return null;
    }

    return cached;
  }

  delete(token: string) {
    this.cache.delete(token);
  }

  clear() {
    this.cache.clear();
  }
}

export const sessionCache = new SessionCache();
