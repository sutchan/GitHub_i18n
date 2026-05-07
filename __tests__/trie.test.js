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
      expect(trie.search('hello')).toBe('你好');
    });

    it('应该能够插入多个单词', () => {
      trie.insert('hello', '你好');
      trie.insert('world', '世界');
      trie.insert('github', 'GitHub');

      expect(trie.search('hello')).toBe('你好');
      expect(trie.search('world')).toBe('世界');
      expect(trie.search('github')).toBe('GitHub');
    });

    it('应该支持相同前缀的单词', () => {
      trie.insert('cat', '猫');
      trie.insert('car', '车');
      trie.insert('card', '卡片');

      expect(trie.search('cat')).toBe('猫');
      expect(trie.search('car')).toBe('车');
      expect(trie.search('card')).toBe('卡片');
    });
  });

  describe('搜索操作', () => {
    beforeEach(() => {
      trie.insert('hello', '你好');
      trie.insert('help', '帮助');
      trie.insert('world', '世界');
    });

    it('应该能找到存在的单词', () => {
      expect(trie.search('hello')).toBe('你好');
      expect(trie.search('world')).toBe('世界');
    });

    it('应该对不存在的单词返回 null', () => {
      expect(trie.search('notexist')).toBeNull();
      expect(trie.search('hel')).toBeNull();
    });

    it('应该区分相似单词', () => {
      expect(trie.search('hello')).toBe('你好');
      expect(trie.search('help')).toBe('帮助');
      expect(trie.search('helloo')).toBeNull();
    });
  });

  describe('前缀匹配', () => {
    beforeEach(() => {
      trie.insert('apple', '苹果');
      trie.insert('app', '应用');
      trie.insert('application', '应用程序');
      trie.insert('banana', '香蕉');
    });

    it('应该找到具有前缀的所有单词', () => {
      const results = trie.findAllWithPrefix('app');
      expect(results).toContainEqual({ key: 'app', value: '应用' });
      expect(results).toContainEqual({ key: 'apple', value: '苹果' });
      expect(results).toContainEqual({ key: 'application', value: '应用程序' });
    });

    it('应该返回空数组当没有匹配时', () => {
      const results = trie.findAllWithPrefix('xyz');
      expect(results).toEqual([]);
    });
  });

  describe('最长匹配', () => {
    beforeEach(() => {
      trie.insert('a', '一');
      trie.insert('ab', '二');
      trie.insert('abc', '三');
      trie.insert('abcd', '四');
    });

    it('应该找到最长的匹配前缀', () => {
      const result = trie.findLongestMatch('abcdef');
      expect(result).toEqual({ key: 'abcd', value: '四', length: 4 });
    });

    it('应该处理部分匹配', () => {
      const result = trie.findLongestMatch('abxy');
      expect(result).toEqual({ key: 'ab', value: '二', length: 2 });
    });

    it('应该在没有匹配时返回 null', () => {
      const result = trie.findLongestMatch('xyz');
      expect(result).toBeNull();
    });
  });

  describe('删除操作', () => {
    beforeEach(() => {
      trie.insert('hello', '你好');
      trie.insert('help', '帮助');
      trie.insert('world', '世界');
    });

    it('应该能够删除单词', () => {
      expect(trie.search('hello')).toBe('你好');
      trie.delete('hello');
      expect(trie.search('hello')).toBeNull();
    });

    it('删除后应该保留其他单词', () => {
      trie.delete('hello');
      expect(trie.search('help')).toBe('帮助');
      expect(trie.search('world')).toBe('世界');
    });

    it('删除不存在单词应该不报错', () => {
      expect(() => trie.delete('notexist')).not.toThrow();
    });
  });

  describe('获取所有条目', () => {
    it('应该返回所有插入的条目', () => {
      trie.insert('a', '1');
      trie.insert('b', '2');
      trie.insert('c', '3');

      const entries = trie.getAllEntries();
      expect(entries).toHaveLength(3);
      expect(entries).toContainEqual({ key: 'a', value: '1' });
      expect(entries).toContainEqual({ key: 'b', value: '2' });
      expect(entries).toContainEqual({ key: 'c', value: '3' });
    });

    it('空树应该返回空数组', () => {
      expect(trie.getAllEntries()).toEqual([]);
    });
  });
});
