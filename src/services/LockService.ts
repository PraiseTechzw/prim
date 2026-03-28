import { redis } from '../lib/redis';

const LOCK_EXPIRY = 600; // 10 minutes in seconds

export class LockService {
  /**
   * Attempts to lock a set of seats for a specific trip and user.
   * Returns true if all seats were successfully locked.
   */
  static async lockSeats(tripId: string, seatIds: string[], userId: string): Promise<boolean> {
    const multi = redis.multi();

    for (const seatId of seatIds) {
      const lockKey = `seat_lock:${tripId}:${seatId}`;
      // Use SET with NX (set only if NOT exists) and EX (expire)
      // This is atomic in Redis
      multi.set(lockKey, userId, 'EX', LOCK_EXPIRY, 'NX');
    }

    const results = await multi.exec();

    // Check if every set command succeeded (returned 'OK')
    const allSucceeded = results?.every((res) => res[1] === 'OK');

    if (!allSucceeded) {
      // If any failed, we should release the ones we DID manage to lock
      // (Simplified: real production might use a Lua script for better atomicity across multiple keys)
      for (let i = 0; i < seatIds.length; i++) {
        if (results?.[i]?.[1] === 'OK') {
          await this.releaseSeat(tripId, seatIds[i]);
        }
      }
      return false;
    }

    return true;
  }

  /**
   * Status check: which seats are currently locked for a trip
   */
  static async getLockedSeats(tripId: string): Promise<string[]> {
    const keys = await redis.keys(`seat_lock:${tripId}:*`);
    return keys.map(key => key.split(':').pop() || '');
  }

  static async releaseSeat(tripId: string, seatId: string): Promise<void> {
    await redis.del(`seat_lock:${tripId}:${seatId}`);
  }

  static async releaseAllSeats(tripId: string, seatIds: string[]): Promise<void> {
    const keys = seatIds.map(seatId => `seat_lock:${tripId}:${seatId}`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }
}
