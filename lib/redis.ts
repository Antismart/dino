import { Redis } from "@upstash/redis";

// Create a mock Redis implementation for development
class MockRedis {
  private store: Record<string, any> = {};

  async get(key: string): Promise<any> {
    return this.store[key] || null;
  }

  async set(key: string, value: any): Promise<any> {
    this.store[key] = value;
    return "OK";
  }

  async incr(key: string): Promise<number> {
    if (!this.store[key]) this.store[key] = 0;
    this.store[key]++;
    return this.store[key];
  }

  async del(key: string): Promise<number> {
    if (this.store[key]) {
      delete this.store[key];
      return 1;
    }
    return 0;
  }

  async hget(key: string, field: string): Promise<any> {
    if (!this.store[key]) return null;
    return (this.store[key] as Record<string, any>)[field] || null;
  }

  async hset(key: string, field: string, value: any): Promise<number> {
    if (!this.store[key]) this.store[key] = {};
    (this.store[key] as Record<string, any>)[field] = value;
    return 1;
  }

  async hmget(key: string, ...fields: string[]): Promise<any[]> {
    if (!this.store[key]) return fields.map(() => null);
    return fields.map(field => (this.store[key] as Record<string, any>)[field] || null);
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
