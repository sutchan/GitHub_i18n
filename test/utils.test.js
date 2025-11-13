/**
 * utils.js 单元测试
 * 测试工具函数的功能和正确性
 */

// 模拟浏览器环境
if (typeof window === 'undefined') {
    global.window = {};
}

// 导入被测试模块
const utils = require('../src/utils.js').utils;

describe('utils.escapeRegExp', () => {
    test('should escape all regex special characters', () => {
        const testStr = '.*+?^${}()|[\]\\/';
        const expected = '\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\\\/';
        expect(utils.escapeRegExp(testStr)).toBe(expected);
    });

    test('should return empty string for empty input', () => {
        expect(utils.escapeRegExp('')).toBe('');
    });

    test('should return the same string for non-special characters', () => {
        expect(utils.escapeRegExp('hello world')).toBe('hello world');
    });
});

describe('utils.isSafeRegex', () => {
    test('should return false for regex with nested repetition', () => {
        expect(utils.isSafeRegex('^(a+)+$')).toBe(false);
        expect(utils.isSafeRegex('^(\w+)*$')).toBe(false);
    });

    test('should return false for regex with too many repetition operators', () => {
        expect(utils.isSafeRegex('a+?a*?a{1,}?a{2,3}?a+?a*?a{1,}?a{2,3}?a+?')).toBe(false);
    });

    test('should return false for regex that is too long', () => {
        const longRegex = 'a'.repeat(1000) + '+';
        expect(utils.isSafeRegex(longRegex)).toBe(false);
    });

    test('should return true for safe regex patterns', () => {
        expect(utils.isSafeRegex('^hello$')).toBe(true);
        expect(utils.isSafeRegex('\\bword\\b')).toBe(true);
        expect(utils.isSafeRegex('^[a-zA-Z0-9_]+$')).toBe(true);
    });
});

describe('utils.safeRegExp', () => {
    test('should create a RegExp object for safe patterns', () => {
        const regex = utils.safeRegExp('^hello$');
        expect(regex).toBeInstanceOf(RegExp);
        expect(regex.test('hello')).toBe(true);
        expect(regex.test('helloworld')).toBe(false);
    });

    test('should return null for unsafe patterns', () => {
        expect(utils.safeRegExp('^(a+)+$')).toBeNull();
        expect(utils.safeRegExp('^(\w+)*$')).toBeNull();
    });

    test('should handle flags correctly', () => {
        const regex = utils.safeRegExp('^hello$', 'i');
        expect(regex).toBeInstanceOf(RegExp);
        expect(regex.test('Hello')).toBe(true);
        expect(regex.test('HELLO')).toBe(true);
    });
});

describe('utils.safeJSONParse', () => {
    test('should parse valid JSON strings', () => {
        const jsonStr = '{"name": "test", "value": 123}';
        const expected = { name: 'test', value: 123 };
        expect(utils.safeJSONParse(jsonStr)).toEqual(expected);
    });

    test('should return defaultValue for invalid JSON', () => {
        const invalidJson = '{invalid json}';
        expect(utils.safeJSONParse(invalidJson)).toBeNull();
        expect(utils.safeJSONParse(invalidJson, {})).toEqual({});
    });

    test('should return defaultValue for empty string', () => {
        expect(utils.safeJSONParse('')).toBeNull();
        expect(utils.safeJSONParse('', 'default')).toBe('default');
    });
});