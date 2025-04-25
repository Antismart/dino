import { Redis } from "@upstash/redis";

// Define types for Redis values
type RedisValue = string | number | boolean | null | RedisObject | RedisArray;
interface RedisObject {
  [key: string]: RedisValue;
}
type RedisArray = RedisValue[];

// Create a mock Redis implementation for development
class MockRedis {
  private store: Record<string, RedisValue> = {};

  async get(key: string): Promise<RedisValue> {
    return this.store[key] || null;
  }

  async set(key: string, value: RedisValue): Promise<string> {
    this.store[key] = value;
    return "OK";
  }

  async incr(key: string): Promise<number> {
    if (!this.store[key]) this.store[key] = 0;
    if (typeof this.store[key] === 'number') {
      this.store[key] = (this.store[key] as number) + 1;
    } else {
      this.store[key] = 1;
    }
    return this.store[key] as number;
  }

  async del(key: string): Promise<number> {
    if (this.store[key]) {
      delete this.store[key];
      return 1;
    }
    return 0;
  }

  async hget(key: string, field: string): Promise<RedisValue> {
    if (!this.store[key]) return null;
    const hash = this.store[key] as RedisObject;
    return hash[field] || null;
  }

  async hset(key: string, field: string, value: RedisValue): Promise<number> {
    if (!this.store[key] || typeof this.store[key] !== 'object' || Array.isArray(this.store[key])) {
      this.store[key] = {};
    }
    (this.store[key] as RedisObject)[field] = value;
    return 1;
  }

  async hmget(key: string, ...fields: string[]): Promise<RedisValue[]> {
    if (!this.store[key]) return fields.map(() => null);
    const hash = this.store[key] as RedisObject;
    return fields.map(field => hash[field] || null);
  }
}

if (!process.env.REDIS_URL || !process.env.REDIS_TOKEN) {
  console.warn(
    "REDIS_URL or REDIS_TOKEN environment variable is not defined. Using in-memory mock implementation instead.",
  );
}

// Use real Redis if environment variables are available, otherwise use mock implementation
export const redis = 
  process.env.REDIS_URL && process.env.REDIS_TOKEN
    ? new Redis({
        url: process.env.REDIS_URL,
        token: process.env.REDIS_TOKEN,
      })
    : new MockRedis() as unknown as Redis;
