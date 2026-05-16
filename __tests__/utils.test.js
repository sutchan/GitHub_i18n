/**
 * 工具函数测试
 * @file __tests__/utils.test.js
 */

import { utils } from '../src/utils.js';

describe('工具函数测试', () => {
  describe('debounce', () => {
    it('应该返回函数', () => {
      const fn = () => {};
      const debouncedFn = utils.debounce(fn, 100);
      expect(typeof debouncedFn).toBe('function');
    });

    it('应该延迟执行', (done) => {
      let count = 0;
      const fn = () => { count++; };
      const debouncedFn = utils.debounce(fn, 50);
      debouncedFn();
      expect(count).toBe(0);
      setTimeout(() => {
        expect(count).toBe(1);
        done();
      }, 100);
    });
  });

  describe('throttle', () => {
    it('应该返回函数', () => {
      const fn = () => {};
      const throttledFn = utils.throttle(fn, 100);
      expect(typeof throttledFn).toBe('function');
    });
  });

  describe('deepClone', () => {
    it('应该深拷贝简单对象', () => {
      const obj = { a: 1, b: { c: 2 } };
      const cloned = utils.deepClone(obj);

      expect(cloned).toEqual(obj);
      expect(cloned).not.toBe(obj);
      expect(cloned.b).not.toBe(obj.b);
    });

    it('应该深拷贝数组', () => {
      const arr = [1, [2, 3], { a: 4 }];
      const cloned = utils.deepClone(arr);

      expect(cloned).toEqual(arr);
      expect(cloned).not.toBe(arr);
      expect(cloned[1]).not.toBe(arr[1]);
    });

    it('应该处理 null 和 undefined', () => {
      expect(utils.deepClone(null)).toBeNull();
      expect(utils.deepClone(undefined)).toBeUndefined();
    });
  });

  describe('辅助函数', () => {
    it('should escape regex special characters', () => {
      const result = utils.escapeRegExp('test(123)');
      expect(result).toBe('test\\(123\\)');
    });

    it('should safely parse JSON', () => {
      const result = utils.safeJSONParse('{"key": "value"}');
      expect(result).toEqual({ key: 'value' });
    });

    it('should return default for invalid JSON', () => {
      const result = utils.safeJSONParse('invalid', { default: true });
      expect(result).toEqual({ default: true });
    });

    it('should safely stringify objects', () => {
      const obj = { key: 'value' };
      const result = utils.safeJSONStringify(obj);
      expect(result).toBe('{"key":"value"}');
    });

    it('should get nested properties safely', () => {
      const obj = { a: { b: { c: 'value' } } };
      expect(utils.getNestedProperty(obj, 'a.b.c')).toBe('value');
      expect(utils.getNestedProperty(obj, 'x.y.z', 'default')).toBe('default');
    });

    it('should safely execute functions', () => {
      const fn = () => 'result';
      expect(utils.safeExecute(fn)).toBe('result');
      expect(utils.safeExecute(null, 'default')).toBe('default');
    });

    it('should check regex safety', () => {
      expect(utils.isSafeRegex('simple')).toBe(true);
      expect(utils.isSafeRegex('(a+)+')).toBe(false);
    });

    it('should create safe regex', () => {
      const regex = utils.safeRegExp('test', 'i');
      expect(regex).toBeInstanceOf(RegExp);
      expect(regex.test('TEST')).toBe(true);
    });

    it('should safely create JSON string', () => {
      expect(utils.safeJSONStringify({ a: 1 })).toBe('{"a":1}');
    });
  });
});
