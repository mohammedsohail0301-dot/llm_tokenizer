/**
 * LLM Tokenizer Engine
 * Supports BPE (Byte-Pair Encoding), WordPiece, Character, and Word tokenization,
 * dynamic custom word addition ("Naya Word Add"), and interactive BPE vocabulary training.
 */

class LLMTokenizer {
    constructor(initialVocab = [], initialMerges = [], embeddingSpace = null) {
        this.vocab = new Map();           // token -> TokenInfo
        this.inverseVocab = new Map();    // id -> token
        this.merges = [];                 // Array of [pairA, pairB]
        this.embeddingSpace = embeddingSpace;
        this.nextId = 0;
        this.mode = 'bpe';                // 'bpe' | 'wordpiece' | 'char' | 'word'
        this.specialTokens = new Set(['<pad>', '<unk>', '<bos>', '<eos>', '<mask_token>']);

        this.init(initialVocab, initialMerges);
    }

    init(initialVocab, initialMerges) {
        this.vocab.clear();
        this.inverseVocab.clear();
        this.merges = [];
        this.nextId = 0;

        // Register initial vocabulary
        for (const item of initialVocab) {
            const id = typeof item.id === 'number' ? item.id : this.nextId++;
            if (id >= this.nextId) this.nextId = id + 1;

            const tokenInfo = {
                id,
                token: item.token,
                category: item.category || 'general',
                desc: item.desc || '',
                isUserAdded: !!item.isUserAdded,
                pos: item.pos || [0, 0, 0]
            };

            this.vocab.set(item.token, tokenInfo);
            this.inverseVocab.set(id, item.token);
        }

        // Register merges
        if (initialMerges && Array.isArray(initialMerges)) {
            for (const merge of initialMerges) {
                this.merges.push([...merge]);
            }
        }
    }

    /**
     * Dynamically add a new custom word/token to the vocabulary ("Naya Word Add")
     * Immediately impacts tokenization so this word is recognized as a single atomic token.
     */
    addWord(word, options = {}) {
        const cleanWord = word.trim();
        if (!cleanWord) {
            throw new Error("Word cannot be empty");
        }

        const existing = this.vocab.get(cleanWord);
        if (existing) {
            return {
                tokenInfo: existing,
                isNew: false,
                message: `Token "${cleanWord}" already exists in vocabulary with ID ${existing.id}.`
            };
        }

        const customId = typeof options.id === 'number' ? options.id : this.nextId++;
        if (customId >= this.nextId) this.nextId = customId + 1;

        const category = options.category || 'user_added';
        const desc = options.desc || `User added token: "${cleanWord}"`;

        // Compute 3D embedding & latent vector
        let pos = options.customCoords || null;
        if (this.embeddingSpace) {
            const embRes = this.embeddingSpace.computeEmbeddingForNewWord(cleanWord, {
                strategy: options.strategy || 'subwords',
                anchorWord: options.anchorWord,
                customCoords: options.customCoords,
                category
            }, this);
            pos = embRes.pos3D;
        } else {
            pos = options.customCoords || [0, 10, 0];
        }

        const tokenInfo = {
            id: customId,
            token: cleanWord,
            category: 'user_added',
            desc,
            isUserAdded: true,
            pos: pos,
            dateAdded: new Date().toISOString()
        };

        this.vocab.set(cleanWord, tokenInfo);
        this.inverseVocab.set(customId, cleanWord);

        // Also add subword merge rule if it's a compound word
        // so BPE hierarchy naturally supports it
        if (cleanWord.length > 2) {
            const mid = Math.floor(cleanWord.length / 2);
            const partA = cleanWord.substring(0, mid);
            const partB = cleanWord.substring(mid);
            this.merges.unshift([partA, partB]);
        }

        return {
            tokenInfo,
            isNew: true,
            message: `Successfully added "${cleanWord}" (ID #${customId}) to vocabulary!`
        };
    }

    /**
     * Delete user-added word from vocabulary
     */
    removeWord(word) {
        const cleanWord = word.trim();
        const info = this.vocab.get(cleanWord);
        if (!info || !info.isUserAdded) {
            return false;
        }

        this.vocab.delete(cleanWord);
        this.inverseVocab.delete(info.id);
        return true;
    }

    /**
     * Tokenize raw input string based on current mode
     */
    tokenize(text, mode = null) {
        const tokenMode = mode || this.mode;
        if (!text || text.length === 0) {
            return {
                tokens: [],
                tokenIds: [],
                tokenDetails: [],
                stats: { totalTokens: 0, charCount: 0, wordCount: 0, compressionRatio: 0, bytes: 0 }
            };
        }

        let tokenDetails = [];

        switch (tokenMode) {
            case 'word':
                tokenDetails = this._tokenizeWord(text);
                break;
            case 'char':
                tokenDetails = this._tokenizeChar(text);
                break;
            case 'wordpiece':
                tokenDetails = this._tokenizeWordPiece(text);
                break;
            case 'bpe':
            default:
                tokenDetails = this._tokenizeBPE(text);
                break;
        }

        const tokens = tokenDetails.map(t => t.token);
        const tokenIds = tokenDetails.map(t => t.id);

        const charCount = text.length;
        const wordCount = (text.trim().match(/\S+/g) || []).length;
        const totalTokens = tokens.length;
        const compressionRatio = totalTokens > 0 ? (charCount / totalTokens).toFixed(2) : 0;
        const encoder = new TextEncoder();
        const bytes = encoder.encode(text).length;

        return {
            tokens,
            tokenIds,
            tokenDetails,
            stats: {
                totalTokens,
                charCount,
                wordCount,
                compressionRatio: parseFloat(compressionRatio),
                bytes
            }
        };
    }

    /**
     * Internal greedy BPE subword segmentation with whitespace preservation
     */
    _tokenizeBPE(text) {
        const details = [];
        // Regex to split into words, whitespace, and punctuation symbols
        const regex = /([a-zA-Z0-9_]+|\s+|[^\s\w])/g;
        let match;
        let colorCounter = 0;

        while ((match = regex.exec(text)) !== null) {
            const rawToken = match[0];
            const start = match.index;
            const end = start + rawToken.length;

            if (/^\s+$/.test(rawToken)) {
                // Whitespace handling: render as distinct symbol
                const wsToken = rawToken.replace(/ /g, 'Ġ').replace(/\n/g, '↵');
                const info = this.vocab.get(wsToken) || this.vocab.get(' ') || { id: 9999, category: 'punct' };
                details.push({
                    token: wsToken,
                    raw: rawToken,
                    id: info.id || 9999,
                    start,
                    end,
                    category: info.category || 'punct',
                    isUserAdded: !!info.isUserAdded,
                    colorIndex: (colorCounter++) % 12
                });
                continue;
            }

            // Check if entire word matches an existing token in vocabulary (including custom user-added words!)
            const lowerWord = rawToken.toLowerCase();
            const directMatch = this.vocab.get(rawToken) || this.vocab.get(lowerWord);

            if (directMatch) {
                details.push({
                    token: directMatch.token,
                    raw: rawToken,
                    id: directMatch.id,
                    start,
                    end,
                    category: directMatch.category,
                    isUserAdded: !!directMatch.isUserAdded,
                    colorIndex: (colorCounter++) % 12
                });
                continue;
            }

            // If not a whole word match, break into subwords using greedy longest-match against vocab
            const subwords = this._greedySubwordSegment(rawToken);
            let currentOffset = start;

            for (const sub of subwords) {
                const subLen = sub.token.length;
                details.push({
                    token: sub.token,
                    raw: text.substring(currentOffset, currentOffset + subLen),
                    id: sub.id,
                    start: currentOffset,
                    end: currentOffset + subLen,
                    category: sub.category,
                    isUserAdded: !!sub.isUserAdded,
                    colorIndex: (colorCounter++) % 12
                });
                currentOffset += subLen;
            }
        }

        return details;
    }

    /**
     * Greedy longest prefix match against known vocabulary
     */
    _greedySubwordSegment(word) {
        const result = [];
        let start = 0;
        const len = word.length;

        while (start < len) {
            let matched = false;
            // Try longest subword first
            for (let end = len; end > start; end--) {
                const candidate = word.substring(start, end);
                const lowerCandidate = candidate.toLowerCase();
                const tokenInfo = this.vocab.get(candidate) || this.vocab.get(lowerCandidate);

                if (tokenInfo) {
                    result.push({
                        token: tokenInfo.token,
                        id: tokenInfo.id,
                        category: tokenInfo.category,
                        isUserAdded: tokenInfo.isUserAdded
                    });
                    start = end;
                    matched = true;
                    break;
                }
            }

            if (!matched) {
                // Single character fallback
                const char = word[start];
                const charInfo = this.vocab.get(char) || {
                    id: this.vocab.get('<unk>') ? this.vocab.get('<unk>').id : 1,
                    token: char,
                    category: 'subword',
                    isUserAdded: false
                };
                result.push({
                    token: char,
                    id: charInfo.id,
                    category: charInfo.category,
                    isUserAdded: false
                });
                start++;
            }
        }

        return result;
    }

    /**
     * WordPiece (BERT style) subword segmentation (uses '##' for continuation)
     */
    _tokenizeWordPiece(text) {
        const details = [];
        const words = text.match(/\S+|\s+/g) || [];
        let offset = 0;
        let colorCounter = 0;

        for (const raw of words) {
            const start = offset;
            const end = offset + raw.length;
            offset = end;

            if (/^\s+$/.test(raw)) {
                continue;
            }

            const lower = raw.toLowerCase();
            const wholeMatch = this.vocab.get(raw) || this.vocab.get(lower);
            if (wholeMatch) {
                details.push({
                    token: wholeMatch.token,
                    raw,
                    id: wholeMatch.id,
                    start,
                    end,
                    category: wholeMatch.category,
                    isUserAdded: !!wholeMatch.isUserAdded,
                    colorIndex: (colorCounter++) % 12
                });
                continue;
            }

            let wordStart = 0;
            let subOffset = start;
            while (wordStart < raw.length) {
                let found = false;
                for (let wordEnd = raw.length; wordEnd > wordStart; wordEnd--) {
                    let sub = raw.substring(wordStart, wordEnd).toLowerCase();
                    const isContinuation = wordStart > 0;
                    const lookupToken = isContinuation ? `##${sub}` : sub;

                    const tokenInfo = this.vocab.get(lookupToken) || this.vocab.get(sub);
                    if (tokenInfo) {
                        const subToken = isContinuation ? `##${tokenInfo.token}` : tokenInfo.token;
                        details.push({
                            token: subToken,
                            raw: raw.substring(wordStart, wordEnd),
                            id: tokenInfo.id,
                            start: subOffset,
                            end: subOffset + (wordEnd - wordStart),
                            category: tokenInfo.category,
                            isUserAdded: !!tokenInfo.isUserAdded,
                            colorIndex: (colorCounter++) % 12
                        });
                        subOffset += (wordEnd - wordStart);
                        wordStart = wordEnd;
                        found = true;
                        break;
                    }
                }

                if (!found) {
                    const char = raw[wordStart];
                    const charToken = wordStart > 0 ? `##${char}` : char;
                    details.push({
                        token: charToken,
                        raw: char,
                        id: 1, // <unk>
                        start: subOffset,
                        end: subOffset + 1,
                        category: 'subword',
                        isUserAdded: false,
                        colorIndex: (colorCounter++) % 12
                    });
                    subOffset += 1;
                    wordStart++;
                }
            }
        }

        return details;
    }

    _tokenizeChar(text) {
        const details = [];
        for (let i = 0; i < text.length; i++) {
            const ch = text[i];
            const tokenStr = ch === ' ' ? 'Ġ' : (ch === '\n' ? '↵' : ch);
            const info = this.vocab.get(tokenStr) || this.vocab.get(ch) || { id: 1, category: 'subword' };
            details.push({
                token: tokenStr,
                raw: ch,
                id: info.id || 1,
                start: i,
                end: i + 1,
                category: info.category || 'subword',
                isUserAdded: !!info.isUserAdded,
                colorIndex: i % 12
            });
        }
        return details;
    }

    _tokenizeWord(text) {
        const details = [];
        const words = text.match(/\S+|\s+/g) || [];
        let offset = 0;
        let count = 0;

        for (const w of words) {
            const start = offset;
            const end = offset + w.length;
            offset = end;

            if (/^\s+$/.test(w)) continue;

            const lower = w.toLowerCase();
            const info = this.vocab.get(w) || this.vocab.get(lower) || { id: 1, category: 'general' };
            details.push({
                token: w,
                raw: w,
                id: info.id || 1,
                start,
                end,
                category: info.category || 'general',
                isUserAdded: !!info.isUserAdded,
                colorIndex: (count++) % 12
            });
        }
        return details;
    }

    /**
     * Helper for computing subwords of a word before it is added to the vocabulary
     */
    tokenizeSubwordsOnly(word) {
        return this._greedySubwordSegment(word);
    }

    /**
     * Build / Train Vocabulary from Corpus using BPE Algorithm
     * Returns step-by-step merge history for the UI lab
     */
    trainBPE(corpusText, targetMerges = 20) {
        if (!corpusText || corpusText.trim().length === 0) {
            return { merges: [], words: [], vocabSize: this.vocab.size };
        }

        // 1. Prepare word frequency table with end-of-word tokens
        const rawWords = corpusText.toLowerCase().match(/[a-zA-Z0-9_]+/g) || [];
        const wordFreqs = new Map();
        for (const w of rawWords) {
            wordFreqs.set(w, (wordFreqs.get(w) || 0) + 1);
        }

        // Represent words as array of character tokens + '</w>' marker
        const splits = new Map();
        for (const [word] of wordFreqs.entries()) {
            splits.set(word, word.split('').concat(['</w>']));
        }

        const mergeHistory = [];

        for (let step = 1; step <= targetMerges; step++) {
            // Count adjacent pairs
            const pairCounts = new Map();
            for (const [word, freq] of wordFreqs.entries()) {
                const symbols = splits.get(word);
                for (let i = 0; i < symbols.length - 1; i++) {
                    const pair = `${symbols[i]}|||${symbols[i + 1]}`;
                    pairCounts.set(pair, (pairCounts.get(pair) || 0) + freq);
                }
            }

            if (pairCounts.size === 0) break;

            // Find best pair
            let bestPair = null;
            let maxCount = -1;
            for (const [pair, count] of pairCounts.entries()) {
                if (count > maxCount) {
                    maxCount = count;
                    bestPair = pair;
                }
            }

            if (!bestPair || maxCount < 2) {
                // No pair occurs more than once
                if (!bestPair) break;
            }

            const [p1, p2] = bestPair.split('|||');
            const merged = p1 + p2;

            // Apply merge across all splits
            for (const [word] of wordFreqs.entries()) {
                const symbols = splits.get(word);
                const newSymbols = [];
                let i = 0;
                while (i < symbols.length) {
                    if (i < symbols.length - 1 && symbols[i] === p1 && symbols[i + 1] === p2) {
                        newSymbols.push(merged);
                        i += 2;
                    } else {
                        newSymbols.push(symbols[i]);
                        i += 1;
                    }
                }
                splits.set(word, newSymbols);
            }

            const cleanToken = merged.replace('</w>', '');
            mergeHistory.push({
                step,
                pair: [p1, p2],
                merged: cleanToken,
                rawMerged: merged,
                frequency: maxCount
            });
        }

        return {
            merges: mergeHistory,
            uniqueWords: wordFreqs.size
        };
    }

    /**
     * Apply trained BPE merges to the active vocabulary
     */
    applyTrainedMerges(mergeList) {
        let addedCount = 0;
        for (const item of mergeList) {
            const token = item.merged;
            if (token && !this.vocab.has(token) && token.length > 1) {
                this.addWord(token, {
                    category: 'subword',
                    desc: `Trained BPE token from merge ${item.pair[0]} + ${item.pair[1]} (freq: ${item.frequency})`,
                    strategy: 'cluster'
                });
                addedCount++;
            }
        }
        return addedCount;
    }

    /**
     * Export vocabulary to JSON
     */
    exportVocab() {
        const list = Array.from(this.vocab.values());
        return JSON.stringify({
            version: "1.0",
            totalTokens: list.length,
            vocab: list,
            merges: this.merges
        }, null, 2);
    }

    /**
     * Import vocabulary from JSON
     */
    importVocab(jsonString) {
        const data = JSON.parse(jsonString);
        if (!data || !Array.isArray(data.vocab)) {
            throw new Error("Invalid vocabulary format");
        }
        this.init(data.vocab, data.merges || []);
        if (this.embeddingSpace) {
            this.embeddingSpace.init(data.vocab);
        }
        return data.vocab.length;
    }
}

if (typeof module !== 'undefined') {
    module.exports = { LLMTokenizer };
}
