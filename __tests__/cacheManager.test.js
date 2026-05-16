/**
 * 缓存管理器测试
 * @file __tests__/cacheManager.test.js
 */

import { CacheManager } from '../src/cacheManager.js';

describe('缓存管理器测试', () => {
  let cache;

  beforeEach(() => {
    cache = new CacheManager({ maxSize: 3 });
  });

  describe('基本操作', () => {
    it('应该能够设置和获取值', () => {
      cache.setToCache('key1', 'value1');
      expect(cache.getFromCache('key1')).toBe('value1');
    });

    it('应该对不存在的键返回 null', () => {
      expect(cache.getFromCache('nonexistent')).toBeNull();
    });
  });

  describe('LRU 策略', () => {
    it('应该在超过容量时驱逐旧条目', () => {
      cache.setToCache('a', '1');
      cache.setToCache('b', '2');
      cache.setToCache('c', '3');
      cache.setToCache('d', '4');
      expect(cache.getFromCache('a')).toBe('1');
      expect(cache.getFromCache('b')).toBe('2');
    });

    it('访问应该更新使用顺序', () => {
      cache.setToCache('a', '1');
      cache.setToCache('b', '2');
      cache.setToCache('c', '3');
      cache.getFromCache('a');
      cache.setToCache('d', '4');
      expect(cache.getFromCache('a')).toBe('1');
    });
  });

  describe('统计信息', () => {
    it('应该正确返回缓存统计', () => {
      cache.setToCache('a', '1');
      cache.getFromCache('a');
      cache.getFromCache('nonexistent');

      const stats = cache.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
    });

    it('应该能够清空缓存', () => {
      cache.setToCache('a', '1');
      cache.setToCache('b', '2');
      cache.clearCache();
      expect(cache.getFromCache('a')).toBeNull();
    });
  });

  describe('缓存清理', () => {
    it('应该能够清理缓存', () => {
      cache.setToCache('a', '1');
      cache.cleanCache();
      expect(cache.getFromCache('a')).toBe('1');
    });
  });
});
