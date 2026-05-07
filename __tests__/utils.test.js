/**
 * 工具函数测试
 * @file __tests__/utils.test.js
 */

import { debounce, throttle, deepClone, formatDate } from '../src/utils.js';

describe('工具函数测试', () => {
  describe('debounce', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('应该在延迟后执行函数', () => {
      const fn = jest.fn();
      const debouncedFn = debounce(fn, 100);

      debouncedFn();
      expect(fn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('应该在多次调用时只执行最后一次', () => {
      const fn = jest.fn();
      const debouncedFn = debounce(fn, 100);

      debouncedFn(1);
      debouncedFn(2);
      debouncedFn(3);

      jest.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith(3);
    });

    it('应该支持立即执行选项', () => {
      const fn = jest.fn();
      const debouncedFn = debounce(fn, 100, true);

      debouncedFn();
      expect(fn).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('throttle', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('应该在指定间隔内只执行一次', () => {
      const fn = jest.fn();
      const throttledFn = throttle(fn, 100);

      throttledFn();
      throttledFn();
      throttledFn();

      expect(fn).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(100);
      throttledFn();
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('deepClone', () => {
    it('应该深拷贝简单对象', () => {
      const obj = { a: 1, b: { c: 2 } };
      const cloned = deepClone(obj);

      expect(cloned).toEqual(obj);
      expect(cloned).not.toBe(obj);
      expect(cloned.b).not.toBe(obj.b);
    });

    it('应该深拷贝数组', () => {
      const arr = [1, [2, 3], { a: 4 }];
      const cloned = deepClone(arr);

      expect(cloned).toEqual(arr);
      expect(cloned).not.toBe(arr);
      expect(cloned[1]).not.toBe(arr[1]);
    });

    it('应该处理 null 和 undefined', () => {
      expect(deepClone(null)).toBeNull();
      expect(deepClone(undefined)).toBeUndefined();
    });
  });

  describe('formatDate', () => {
    it('应该正确格式化日期', () => {
      const date = new Date('2024-01-15');
      const formatted = formatDate(date, 'YYYY-MM-DD');

      expect(formatted).toBe('2024-01-15');
    });

    it('应该支持不同格式', () => {
      const date = new Date('2024-01-15');

      expect(formatDate(date, 'YYYY/MM/DD')).toBe('2024/01/15');
      expect(formatDate(date, 'DD-MM-YYYY')).toBe('15-01-2024');
    });
  });
});
