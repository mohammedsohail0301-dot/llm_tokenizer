/**
 * Embeddings & Vector Math Module
 * Handles high-dimensional vector representations, 3D coordinates,
 * cosine similarity, Euclidean distance, nearest neighbors, and vector arithmetic.
 */

class EmbeddingSpace {
    constructor(vocabList = []) {
        this.dim = 16; // 16-dimensional latent semantic space
        this.vectors = new Map(); // token -> Float32Array(16)
        this.coords3D = new Map(); // token -> [x, y, z]
        this.init(vocabList);
    }

    init(vocabList) {
        this.vectors.clear();
        this.coords3D.clear();

        for (const item of vocabList) {
            const token = item.token;
            const pos = item.pos || [0, 0, 0];
            this.coords3D.set(token, [...pos]);

            // Generate deterministic 16D latent vector aligned with 3D cluster + semantic seed
            const vec = this._generateVectorFromPosAndToken(token, pos, item.category);
            this.vectors.set(token, vec);
        }
    }

    _generateVectorFromPosAndToken(token, pos, category = 'general') {
        const vec = new Float32Array(this.dim);
        // Base seed from 3D coordinates
        vec[0] = pos[0] / 100.0;
        vec[1] = pos[1] / 100.0;
        vec[2] = pos[2] / 100.0;

        // Hash token characters to fill remaining dimensions deterministically
        let hash = 0;
        for (let i = 0; i < token.length; i++) {
            hash = ((hash << 5) - hash) + token.charCodeAt(i);
            hash |= 0;
        }

        const catSeed = this._categorySeed(category);
        for (let i = 3; i < this.dim; i++) {
            const angle = (hash * (i + 1) * 0.17) + catSeed;
            vec[i] = Math.sin(angle) * 0.5 + Math.cos(angle * 1.5) * 0.3;
        }

        return this.normalize(vec);
    }

    _categorySeed(category) {
        const map = {
            ai_tech: 1.1,
            verb: 2.2,
            grammar: 3.3,
            subword: 4.4,
            hinglish: 5.5,
            code: 6.6,
            special: 7.7,
            punct: 8.8,
            user_added: 9.9
        };
        return map[category] || 0.0;
    }

    normalize(vec) {
        let sumSq = 0;
        for (let i = 0; i < vec.length; i++) {
            sumSq += vec[i] * vec[i];
        }
        const norm = Math.sqrt(sumSq) || 1e-9;
        const normalized = new Float32Array(vec.length);
        for (let i = 0; i < vec.length; i++) {
            normalized[i] = vec[i] / norm;
        }
        return normalized;
    }

    getVector(token) {
        return this.vectors.get(token) || null;
    }

    get3DCoords(token) {
        return this.coords3D.get(token) || [0, 0, 0];
    }

    setTokenEmbedding(token, { pos3D, vector, category }) {
        if (pos3D) {
            this.coords3D.set(token, [...pos3D]);
        }
        if (vector) {
            this.vectors.set(token, this.normalize(vector));
        } else if (pos3D) {
            const vec = this._generateVectorFromPosAndToken(token, pos3D, category || 'user_added');
            this.vectors.set(token, vec);
        }
    }

    /**
     * Compute embedding for a newly added word using various strategies
     */
    computeEmbeddingForNewWord(word, options = {}, tokenizer = null) {
        const {
            strategy = 'subwords', // 'subwords' | 'anchor' | 'custom' | 'cluster'
            anchorWord = null,
            customCoords = null,
            category = 'user_added'
        } = options;

        let pos3D = [0, 0, 0];
        let vector = new Float32Array(this.dim);

        if (strategy === 'custom' && customCoords && customCoords.length === 3) {
            pos3D = [...customCoords];
            vector = this._generateVectorFromPosAndToken(word, pos3D, category);
        } else if (strategy === 'anchor' && anchorWord && this.coords3D.has(anchorWord)) {
            const basePos = this.coords3D.get(anchorWord);
            const baseVec = this.vectors.get(anchorWord);
            // Place near anchor word with small random radius (5 to 12 units)
            const jitterRadius = 6 + Math.random() * 6;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;

            pos3D = [
                basePos[0] + jitterRadius * Math.sin(phi) * Math.cos(theta),
                basePos[1] + jitterRadius * Math.sin(phi) * Math.sin(theta),
                basePos[2] + jitterRadius * Math.cos(phi)
            ];

            // Blend base vector with small noise
            for (let i = 0; i < this.dim; i++) {
                vector[i] = baseVec[i] + (Math.random() - 0.5) * 0.15;
            }
            vector = this.normalize(vector);
        } else if (strategy === 'subwords' && tokenizer) {
            // Find subwords of the word before it's officially added to the vocabulary
            const subwordTokens = tokenizer.tokenizeSubwordsOnly(word);
            let validSubwords = 0;
            let sumPos = [0, 0, 0];
            let sumVec = new Float32Array(this.dim);

            for (const sub of subwordTokens) {
                if (this.coords3D.has(sub.token)) {
                    validSubwords++;
                    const p = this.coords3D.get(sub.token);
                    const v = this.vectors.get(sub.token);
                    sumPos[0] += p[0];
                    sumPos[1] += p[1];
                    sumPos[2] += p[2];
                    for (let i = 0; i < this.dim; i++) {
                        sumVec[i] += v[i];
                    }
                }
            }

            if (validSubwords > 0) {
                pos3D = [
                    (sumPos[0] / validSubwords) + (Math.random() - 0.5) * 4,
                    (sumPos[1] / validSubwords) + (Math.random() - 0.5) * 4,
                    (sumPos[2] / validSubwords) + (Math.random() - 0.5) * 4
                ];
                vector = this.normalize(sumVec);
            } else {
                // Fallback to cluster
                pos3D = [
                    (Math.random() - 0.5) * 60,
                    (Math.random() - 0.5) * 60,
                    (Math.random() - 0.5) * 60
                ];
                vector = this._generateVectorFromPosAndToken(word, pos3D, category);
            }
        } else {
            // Category cluster center default
            const clusterCenters = {
                ai_tech: [45, 25, 30],
                verb: [-35, 30, -20],
                grammar: [-40, -30, 30],
                subword: [15, -45, -30],
                hinglish: [-20, 20, 50],
                code: [25, -20, 35],
                special: [0, 80, 0],
                user_added: [0, 10, 0]
            };
            const center = clusterCenters[category] || [0, 0, 0];
            const radius = 15;
            pos3D = [
                center[0] + (Math.random() - 0.5) * radius * 2,
                center[1] + (Math.random() - 0.5) * radius * 2,
                center[2] + (Math.random() - 0.5) * radius * 2
            ];
            vector = this._generateVectorFromPosAndToken(word, pos3D, category);
        }

        // Clamp positions to [-90, 90] bounds for clean 3D framing
        pos3D = pos3D.map(coord => Math.max(-90, Math.min(90, Math.round(coord * 10) / 10)));

        this.coords3D.set(word, pos3D);
        this.vectors.set(word, vector);

        return { pos3D, vector };
    }

    cosineSimilarity(tokenA, tokenB) {
        const vA = this.getVector(tokenA);
        const vB = this.getVector(tokenB);
        if (!vA || !vB) return 0;

        let dot = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < this.dim; i++) {
            dot += vA[i] * vB[i];
            normA += vA[i] * vA[i];
            normB += vB[i] * vB[i];
        }

        const denom = Math.sqrt(normA) * Math.sqrt(normB);
        if (denom === 0) return 0;
        return Math.max(-1, Math.min(1, dot / denom));
    }

    euclideanDistance(tokenA, tokenB) {
        const pA = this.get3DCoords(tokenA);
        const pB = this.get3DCoords(tokenB);
        const dx = pA[0] - pB[0];
        const dy = pA[1] - pB[1];
        const dz = pA[2] - pB[2];
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    getNearestNeighbors(targetToken, k = 5) {
        const targetVec = this.getVector(targetToken);
        if (!targetVec) return [];

        const results = [];
        for (const [token, vec] of this.vectors.entries()) {
            if (token === targetToken) continue;
            const sim = this.cosineSimilarity(targetToken, token);
            const dist = this.euclideanDistance(targetToken, token);
            results.push({ token, similarity: sim, distance: dist, pos: this.get3DCoords(token) });
        }

        results.sort((a, b) => b.similarity - a.similarity);
        return results.slice(0, k);
    }
}

if (typeof module !== 'undefined') {
    module.exports = { EmbeddingSpace };
}
