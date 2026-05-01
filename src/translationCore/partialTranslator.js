/**
 * 部分匹配翻译模块
 * @file translationCore/partialTranslator.js
 * @version 1.9.7
 * @date 2026-05-01
 * @author Sut
 * @description 使用Trie树进行部分匹配翻译
 */
import { utils } from '../utils.js';
import { dictionaryManager } from './dictionaryManager.js';

export const partialTranslator = {
  performPartialTranslation(text, enablePartialMatch = false) {
    if (!enablePartialMatch) {
      return null;
    }

    const textLen = text.length;
    if (textLen < 5) {
      return null;
    }

    const matches = [];
    const minKeyLength = Math.min(4, Math.floor(textLen / 2));
    const potentialMatches = dictionaryManager.dictionaryTrie.findAllMatches(text, minKeyLength);

    for (const match of potentialMatches) {
      const key = match.key;
      if (!dictionaryManager.dictionary.hasOwnProperty(key) || dictionaryManager.dictionary[key].startsWith('待翻译: ')) {
        continue;
      }

      const value = dictionaryManager.dictionary[key];

      if (/^[0-9.,\s()[\]{}/*^$#@!~`|:;"'?>+-]+$/i.test(key)) {
        continue;
      }

      const wordRegexKey = `word_${key}`;
      let wordRegex;

      if (dictionaryManager.regexCache.has(wordRegexKey)) {
        wordRegex = dictionaryManager.regexCache.get(wordRegexKey);
      } else {
        wordRegex = utils.safeRegExp('\\b' + utils.escapeRegExp(key) + '\\b', 'gi');
        if (wordRegex) {
          dictionaryManager.regexCache.set(wordRegexKey, wordRegex);
        } else {
          continue;
        }
      }

      const wordMatches = text.match(wordRegex);

      if (wordMatches && wordMatches.length > 0) {
        matches.push({
          key,
          value,
          length: key.length,
          matches: wordMatches.length,
          regex: wordRegex
        });
      } else {
        const nonWordRegexKey = `nonword_${key}`;
        let nonWordRegex;

        if (dictionaryManager.regexCache.has(nonWordRegexKey)) {
          nonWordRegex = dictionaryManager.regexCache.get(nonWordRegexKey);
        } else {
          nonWordRegex = utils.safeRegExp(utils.escapeRegExp(key), 'g');
          if (nonWordRegex) {
            dictionaryManager.regexCache.set(nonWordRegexKey, nonWordRegex);
          } else {
            continue;
          }
        }

        matches.push({
          key,
          value,
          length: key.length,
          matches: 1,
          regex: nonWordRegex
        });
      }
    }

    if (matches.length === 0) {
      return null;
    }

    matches.sort((a, b) => {
      if (b.length !== a.length) {
        return b.length - a.length;
      }
      return b.matches - a.matches;
    });

    let result = text;
    let hasReplaced = false;
    const maxReplacements = Math.min(5, matches.length);

    for (let i = 0; i < maxReplacements; i++) {
      const match = matches[i];
      const newResult = result.replace(match.regex, match.value);

      if (newResult !== result) {
        result = newResult;
        hasReplaced = true;
      }
    }

    return hasReplaced ? result : null;
  }
};
