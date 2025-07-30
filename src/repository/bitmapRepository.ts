import { Redis } from 'ioredis';
// import { logger } from '../infrastructure/logger';

const BITMAP_KEY = 'bitmap:id_pool';
const BLACKLIST_KEY = 'bitmap:blacklist';
const BLACKLIST_EXPIRE_PREFIX = 'blacklist_expire:';

export class BitmapRepository {
    constructor(private cache: Redis) {}

    public async allocateID(): Promise<number> {
        const id = await this.cache.bitpos(BITMAP_KEY, 0);
        if (id < 0) throw new Error('No available ID');
        await this.cache.setbit(BITMAP_KEY, id, 1);
        await this.cache.setbit(BLACKLIST_KEY, id, 0);
        return id;
    }

    public async releaseID(id: number): Promise<void> {
        await this.cache.setbit(BITMAP_KEY, id, 0);
    }

    public async blacklistID(id: number): Promise<void> {
        await this.cache.setbit(BITMAP_KEY, id, 0);
        await this.cache.setbit(BLACKLIST_KEY, id, 1);
    }

    public async blacklistIDWithTTL(id: number, ttlMs: number): Promise<void> {
        await this.cache.setbit(BITMAP_KEY, id, 0);
        await this.cache.setbit(BLACKLIST_KEY, id, 1);
        await this.cache.set(`${BLACKLIST_EXPIRE_PREFIX}${id}`, '1', 'PX', ttlMs);
    }

    public async isBlacklisted(id: number): Promise<boolean> {
        const bit = await this.cache.getbit(BLACKLIST_KEY, id);
        return bit === 1;
    }

    public async cleanupBitmap(maxId = 100_000): Promise<void> {
        const activeIDs = new Set<number>();
        const keys = await this.cache.keys(`${BLACKLIST_EXPIRE_PREFIX}*`);
        for (const key of keys) {
            const match = key.match(/^blacklist_expire:(\d+)$/);
            if (match) {
                activeIDs.add(Number(match[1]));
            }
        }

        for (let id = 0; id < maxId; id++) {
            const bit = await this.cache.getbit(BITMAP_KEY, id);
            if (bit === 1 && !activeIDs.has(id)) {
                // logger.info(`Clearing stale bit at ${id}`);
                await this.cache.setbit(BITMAP_KEY, id, 0);
            }
        }
        // logger.info('Bitmap cleanup complete.');
    }
}

export default BitmapRepository;