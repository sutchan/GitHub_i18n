//**
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
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('应该对不存在的键返回 undefined', () => {
      expect(cache.get('nonexistent')).toBeUndefined();
    });

    it('应该能够检查键是否存在', () => {
      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('nonexistent')).toBe(false);
    });

    it('应该能够删除键', () => {
      cache.set('key1', 'value1');
      cache.delete('key1');
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.has('key1')).toBe(false);
    });
  });

  describe('LRU 策略', () => {
    it('应该在超过容量时移除最久未使用的项', () => {
      cache.set('a', '1');
      cache.set('b', '2');
      cache.set('c', '3');
      cache.set('d', '4'); // 应该移除 'a'

      expect(cache.get('a')).toBeUndefined();
      expect(cache.get('b')).toBe('2');
      expect(cache.get('c')).toBe('3');
      expect(cache.get('d')).toBe('4');
    });

    it('访问应该更新使用顺序', () => {
      cache.set('a', '1');
      cache.set('b', '2');
      cache.set('c', '3');

      cache.get('a'); // 访问 a，使其成为最新
      cache.set('d', '4'); // 应该移除 'b'

      expect(cache.get('a')).toBe('1');
      expect(cache.get('b')).toBeUndefined();
      expect(cache.get('c')).toBe('3');
    });
  });

  describe('过期时间', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('应该在过期后返回 undefined', () => {
      cache.set('key1', 'value1', 1000); // 1秒后过期
      expect(cache.get('key1')).toBe('value1');

      jest.advanceTimersByTime(1001);
      expect(cache.get('key1')).toBeUndefined();
    });

    it('应该支持永不过期', () => {
      cache.set('key1', 'value1', 0);
      jest.advanceTimersByTime(100000);
      expect(cache.get('key1')).toBe('value1');
    });
  });

  describe('统计信息', () => {
    it('应该正确返回缓存大小', () => {
      expect(cache.size()).toBe(0);
      cache.set('a', '1');
      expect(cache.size()).toBe(1);
      cache.set('b', '2');
      expect(cache.size()).toBe(2);
    });

    it('应该能够清空缓存', () => {
      cache.set('a', '1');
      cache.set('b', '2');
      cache.clear();
      expect(cache.size()).toBe(0);
      expect(cache.get('a')).toBeUndefined();
    });
  });

  describe('批量操作', () => {
    it('应该支持批量设置', () => {
      cache.setBatch({
        'a': '1',
        'b': '2',
        'c': '3',
      });

      expect(cache.get('a')).toBe('1');
      expect(cache.get('b')).toBe('2');
      expect(cache.get('c')).toBe('3');
    });

    it('应该支持批量获取', () => {
      cache.set('a', '1');
      cache.set('b', '2');
      cache.set('c', '3');

      const values = cache.getBatch(['a', 'b', 'c', 'd']);
      expect(values).toEqual({
        'a': '1',
        'b': '2',
        'c': '3',
        'd': undefined,
      });
    });
  });
});
