/**
 * 翻译词典管理模块
 * @file translationCore/dictionaryManager.js
 * @version 1.9.8
 * @date 2026-05-01
 * @author Sut
 * @description 管理翻译词典的加载和查询
 */
import { CONFIG } from '../config.js';
import { mergeAllDictionaries } from '../dictionaries/index.js';
import { Trie } from '../trie.js';
import { CacheManager } from '../cacheManager.js';

export const dictionaryManager = {
  dictionary: {},
  dictionaryHash: new Map(),
  dictionaryTrie: new Trie(),
  regexCache: new Map(),
  cacheManager: null,

  init() {
    try {
      if (CONFIG.debugMode) {
        console.time('[GitHub 中文翻译] 词典初始化');
      }

      this.cacheManager = new CacheManager(CONFIG.performance?.maxDictSize || 2000);
      this.dictionary = mergeAllDictionaries();
      this.dictionaryHash.clear();
      this.dictionaryTrie.clear();
      this.regexCache.clear();

      Object.keys(this.dictionary).forEach(key => {
        if (!this.dictionary[key].startsWith('待翻译: ')) {
          this.dictionaryHash.set(key, this.dictionary[key]);
          if (key.length <= 100) {
            this.dictionaryHash.set(key.toLowerCase(), this.dictionary[key]);
            this.dictionaryHash.set(key.toUpperCase(), this.dictionary[key]);
          }
          this.dictionaryTrie.insert(key);
        }
      });

      if (CONFIG.debugMode) {
        console.timeEnd('[GitHub 中文翻译] 词典初始化');
        console.log(`[GitHub 中文翻译] 词典条目数量: ${Object.keys(this.dictionary).length}`);
        console.log(`[GitHub 中文翻译] 哈希表条目数量: ${this.dictionaryHash.size}`);
        console.log(`[GitHub 中文翻译] Trie树条目数量: ${this.dictionaryTrie.getSize()}`);
      }
    } catch (error) {
      console.error('[GitHub 中文翻译] 词典初始化失败:', error);
      this.dictionary = {};
      this.dictionaryHash.clear();
      this.dictionaryTrie.clear();
      this.regexCache.clear();
    }
  },

  getTranslatedText(text) {
    if (!text || typeof text !== 'string' || text.trim() === '') {
      return text;
    }

    const normalizedText = text.trim();

    if (normalizedText.length < CONFIG.performance?.minTextLengthToTranslate) {
      return null;
    }

    if (CONFIG.performance?.enableTranslationCache) {
      const cachedResult = this.cacheManager.getFromCache(normalizedText);
      if (cachedResult !== null) {
        return cachedResult;
      }
    }

    let result = null;
    result = this.dictionaryHash.get(normalizedText);

    if (result === null && normalizedText.length <= 100) {
      const lowerCaseText = normalizedText.toLowerCase();
      const upperCaseText = normalizedText.toUpperCase();
      result = this.dictionaryHash.get(lowerCaseText) || this.dictionaryHash.get(upperCaseText);
    }

    if (result !== null) {
      result = this.sanitizeText(result);
    }

    if (CONFIG.performance?.enableTranslationCache && normalizedText.length <= CONFIG.performance?.maxCachedTextLength) {
      if (result !== null) {
        this.cacheManager.setToCache(normalizedText, result, false);
      }
    }

    return result;
  },

  sanitizeText(text) {
    let sanitizedText = text.replace(/<[^>]*>/g, '');
    sanitizedText = sanitizedText.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
    sanitizedText = sanitizedText.replace(/javascript:/gi, '');
    sanitizedText = sanitizedText.replace(/data:/gi, '');
    sanitizedText = sanitizedText.replace(/expression\([^)]*\)/gi, '');
    sanitizedText = sanitizedText.replace(/vbscript:/gi, '');
    sanitizedText = sanitizedText.replace(/<\s*script/gi, '');
    sanitizedText = sanitizedText.replace(/<\s*iframe/gi, '');
    sanitizedText = sanitizedText.replace(/<\s*object/gi, '');
    sanitizedText = sanitizedText.replace(/<\s*embed/gi, '');
    sanitizedText = sanitizedText.replace(/<\s*link/gi, '');
    sanitizedText = sanitizedText.replace(/<\s*style/gi, '');
    return sanitizedText;
  },

  updateDictionary(newDictionary) {
    try {
      Object.assign(this.dictionary, newDictionary);
      
      Object.keys(newDictionary).forEach(key => {
        if (!newDictionary[key].startsWith('待翻译: ')) {
          this.dictionaryHash.set(key, newDictionary[key]);
          if (key.length <= 100) {
            this.dictionaryHash.set(key.toLowerCase(), newDictionary[key]);
            this.dictionaryHash.set(key.toUpperCase(), newDictionary[key]);
          }
          this.dictionaryTrie.insert(key);
        }
      });

      if (CONFIG.debugMode) {
        console.log(`[GitHub 中文翻译] 词典已更新，新增/修改${Object.keys(newDictionary).length}个条目`);
      }
    } catch (error) {
      console.error('[GitHub 中文翻译] 更新词典失败:', error);
    }
  }
};
