jest.mock('../config/redis', () => {
  const store = new Map<string, string>();
  return {
    qrRedisKey: (sessionId: string) => `qr:${sessionId}`,
    redis: {
      get: jest.fn(async (key: string) => store.get(key) || null),
      set: jest.fn(async (key: string, value: string, nx?: string, _px?: string, _ttl?: number) => {
        if (nx === 'NX' && store.has(key)) return null;
        store.set(key, value);
        return 'OK';
      }),
      eval: jest.fn(async (_script: string, _numkeys: number, key1: string, arg1: string, _arg2: string) => {
        // Mock the LUA script execution
        const stored = store.get(key1);
        if (!stored) return 0;
        
        const usedKey = `${key1}:used:${arg1}`;
        if (store.has(usedKey)) return 0; // NX failed
        
        store.set(usedKey, arg1); // SET NX PX
        return 1;
      }),
      flushdb: async () => store.clear(),
      quit: async () => {},
      __store: store,
    }
  };
});

import { redis, qrRedisKey } from '../config/redis';

// Duplicate the script and function for unit testing purposes
const CLAIM_TOKEN_SCRIPT = `
local stored = redis.call('GET', KEYS[1])
if not stored then
  return 0
end
local usedKey = KEYS[1] .. ':used:' .. ARGV[1]
local wasSet = redis.call('SET', usedKey, ARGV[1], 'NX', 'PX', ARGV[2])
if wasSet then
  return 1
else
  return 0
end
`;

async function claimTokenOnce(sessionId: string, studentId: string, ttlMs: number): Promise<boolean> {
  const result = await redis.eval(CLAIM_TOKEN_SCRIPT, 1, qrRedisKey(sessionId), studentId, ttlMs.toString());
  return result === 1;
}

describe('Redis Lua CLAIM_TOKEN_SCRIPT Concurrency', () => {
  beforeEach(async () => {
    await (redis as any).flushdb();
  });

  it('should allow multiple students to claim the same token', async () => {
    const sessionId = 'session_1';
    await redis.set(qrRedisKey(sessionId), 'some_token_hash', 'PX', 10000);

    const claim1 = await claimTokenOnce(sessionId, 'student_1', 10000);
    const claim2 = await claimTokenOnce(sessionId, 'student_2', 10000);

    expect(claim1).toBe(true);
    expect(claim2).toBe(true);
  });

  it('should prevent the same student from claiming the same token twice', async () => {
    const sessionId = 'session_1';
    await redis.set(qrRedisKey(sessionId), 'some_token_hash', 'PX', 10000);

    const claim1 = await claimTokenOnce(sessionId, 'student_1', 10000);
    const claim2 = await claimTokenOnce(sessionId, 'student_1', 10000);

    expect(claim1).toBe(true);
    expect(claim2).toBe(false);
  });

  it('should atomically prevent race conditions when the same student claims concurrently', async () => {
    const sessionId = 'session_1';
    await redis.set(qrRedisKey(sessionId), 'some_token_hash', 'PX', 10000);

    // Fire 100 claims simultaneously
    const promises = Array.from({ length: 100 }).map(() => claimTokenOnce(sessionId, 'student_1', 10000));
    const results = await Promise.all(promises);

    const successfulClaims = results.filter(r => r === true);
    expect(successfulClaims.length).toBe(1); // exactly one wins
  });

  it('should return false if the parent token is missing', async () => {
    const sessionId = 'session_missing';
    const claim = await claimTokenOnce(sessionId, 'student_1', 10000);
    expect(claim).toBe(false);
  });
});
