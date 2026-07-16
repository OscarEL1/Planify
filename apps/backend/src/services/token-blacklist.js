import { createHash } from 'node:crypto';

function tokenDigest(token) {
  return createHash('sha256').update(token).digest('hex');
}

export class TokenBlacklist {
  constructor({ now = Date.now } = {}) {
    this.revokedTokens = new Map();
    this.now = now;
  }

  revoke(token, expiresAtSeconds) {
    this.removeExpired();
    this.revokedTokens.set(tokenDigest(token), expiresAtSeconds * 1000);
  }

  isRevoked(token) {
    this.removeExpired();
    return this.revokedTokens.has(tokenDigest(token));
  }

  removeExpired() {
    const currentTime = this.now();

    for (const [digest, expiresAt] of this.revokedTokens) {
      if (expiresAt <= currentTime) {
        this.revokedTokens.delete(digest);
      }
    }
  }
}

export const tokenBlacklist = new TokenBlacklist();
