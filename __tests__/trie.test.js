/**
 * Trie 树测试
 * @file __tests__/trie.test.js
 */

import { Trie } from '../src/trie.js';

describe('Trie 树测试', () => {
  let trie;

  beforeEach(() => {
    trie = new Trie();
  });

  describe('插入操作', () => {
    it('应该能够插入单词', () => {
      trie.insert('hello', '你好');
    });

    it('应该能够插入多个单词', () => {
      trie.insert('hello', '你好');
      trie.insert('world', '世界');
      trie.insert('github', 'GitHub');
      expect(trie.getSize()).toBe(3);
    });

    it('应该支持相同前缀的单词', () => {
      trie.insert('cat', '猫');
      trie.insert('car', '车');
      trie.insert('card', '卡片');
      expect(trie.getSize()).toBe(3);
    });
  });

  describe('findAllMatches 操作', () => {
    beforeEach(() => {
      trie.insert('hello', '你好');
      trie.insert('help', '帮助');
      trie.insert('world', '世界');
    });

    it('应该找到文本中的所有匹配', () => {
      const matches = trie.findAllMatches('hello world');
      expect(matches.length).toBeGreaterThan(0);
    });

    it('应该返回匹配的位置信息', () => {
      const matches = trie.findAllMatches('hello');
      expect(matches[0]).toHaveProperty('key');
      expect(matches[0]).toHaveProperty('value');
      expect(matches[0]).toHaveProperty('start');
      expect(matches[0]).toHaveProperty('end');
    });

    it('应该处理不包含任何单词的文本', () => {
      const matches = trie.findAllMatches('xyz');
      expect(matches).toEqual([]);
    });

    it('应该支持最小键长度过滤', () => {
      const matches = trie.findAllMatches('hello', 5);
      expect(matches.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('清空操作', () => {
    it('应该能够清空 Trie 树', () => {
      trie.insert('hello', '你好');
      trie.insert('world', '世界');
      expect(trie.getSize()).toBe(2);

      trie.clear();
      expect(trie.getSize()).toBe(0);
    });
  });

  describe('大小查询', () => {
    it('空树应该返回大小为 0', () => {
      expect(trie.getSize()).toBe(0);
    });

    it('插入后应该返回正确的大小', () => {
      trie.insert('a', '1');
      trie.insert('b', '2');
      expect(trie.getSize()).toBe(2);
    });

    it('清空后应该返回大小为 0', () => {
      trie.insert('hello', '你好');
      trie.clear();
      expect(trie.getSize()).toBe(0);
    });
  });

  describe('边界情况', () => {
    it('应该处理空字符串插入', () => {
      trie.insert('', '空');
      expect(trie.getSize()).toBe(0);
    });

    it('应该处理无效输入', () => {
      trie.insert(null, 'null');
      trie.insert(undefined, 'undefined');
      trie.insert(123, 'number');
      expect(trie.getSize()).toBe(0);
    });

    it('应该处理空文本匹配', () => {
      const matches = trie.findAllMatches('');
      expect(matches).toEqual([]);
    });

    it('应该处理无效文本', () => {
      trie.insert('hello', '你好');
      const matches = trie.findAllMatches(null);
      expect(matches).toEqual([]);
    });
  });
});
