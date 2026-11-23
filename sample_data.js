/**
 * Predefined vocabulary, clusters, sample corpora, and presets
 * for the LLM Tokenizer & 3D Embedding Visualizer.
 */

const DEFAULT_SAMPLE_CORPORA = {
    general: `The transformer architecture revolutionized natural language processing. In large language models, tokenization breaks text into subword units. Each token is mapped to a high dimensional vector embedding. As the model trains, tokens with similar meanings cluster together in the latent vector space.`,
    
    technical: `def tokenize_text(text: str, vocab: dict) -> list[int]:
    tokens = []
    for word in text.strip().split():
        token_id = vocab.get(word, vocab.get('<unk>'))
        tokens.append(token_id)
    return tokens`,

    hinglish: `Naya word add karna bahut aasan hai. Model pehle text ko chhote subwords mein divide karta hai. Jab hum naya shabd vocabulary mein jodte hain, toh tokenizer use ek single token ki tarah pehchanta hai aur 3d space mein place karta hai.`,

    bpe_demo: `low lower lowest newest wider newer wilder wild`
};

const PRESET_INPUTS = [
    { label: "LLM Tokenizer Overview", text: "Language models use tokenization to convert text into token IDs before embedding them into 3D vector space." },
    { label: "BPE Subword Test", text: "Unbelievable tokenization creates subword representations dynamically." },
    { label: "Hinglish 'Naya Word' Test", text: "Naya shabd add karo aur 3D embedding space mein dekho!" },
    { label: "Python Code", text: "def forward(tokens, embeddings):\n    return embeddings[tokens].mean(axis=0)" }
];

// Initial base vocabulary containing realistic subwords, common words, tech terms, Hinglish terms, and special tokens.
const INITIAL_VOCABULARY = [
    // Special tokens (IDs 0-9)
    { id: 0, token: "<pad>", category: "special", pos: [0, 85, 0], desc: "Padding token" },
    { id: 1, token: "<unk>", category: "special", pos: [5, 80, 5], desc: "Unknown token" },
    { id: 2, token: "<bos>", category: "special", pos: [-5, 80, -5], desc: "Beginning of sequence" },
    { id: 3, token: "<eos>", category: "special", pos: [0, 75, 10], desc: "End of sequence" },
    { id: 4, token: "<mask_token>", category: "special", pos: [10, 75, -5], desc: "Masked language model token" },

    // AI & NLP Concepts (Cluster 1: centered around [40, 25, 30])
    { id: 10, token: "token", category: "ai_tech", pos: [45, 20, 25], desc: "Atomic text piece" },
    { id: 11, token: "tokenize", category: "ai_tech", pos: [48, 22, 28], desc: "To split into tokens" },
    { id: 12, token: "tokenizer", category: "ai_tech", pos: [47, 26, 30], desc: "Tokenization model" },
    { id: 13, token: "tokenization", category: "ai_tech", pos: [50, 28, 35], desc: "Process of splitting text" },
    { id: 14, token: "embed", category: "ai_tech", pos: [38, 30, 40], desc: "Represent as vector" },
    { id: 15, token: "embedding", category: "ai_tech", pos: [40, 32, 42], desc: "Vector representation" },
    { id: 16, token: "embeddings", category: "ai_tech", pos: [42, 34, 44], desc: "Vector representations" },
    { id: 17, token: "vector", category: "ai_tech", pos: [35, 38, 48], desc: "Multi-dimensional array" },
    { id: 18, token: "model", category: "ai_tech", pos: [52, 15, 20], desc: "Neural network model" },
    { id: 19, token: "llm", category: "ai_tech", pos: [58, 25, 22], desc: "Large Language Model" },
    { id: 20, token: "gpt", category: "ai_tech", pos: [62, 28, 18], desc: "Generative Pre-trained Transformer" },
    { id: 21, token: "transformer", category: "ai_tech", pos: [55, 35, 30], desc: "Self-attention architecture" },
    { id: 22, token: "attention", category: "ai_tech", pos: [53, 40, 36], desc: "Attention mechanism" },
    { id: 23, token: "neural", category: "ai_tech", pos: [46, 42, 22], desc: "Relating to networks" },
    { id: 24, token: "network", category: "ai_tech", pos: [44, 45, 18], desc: "Interconnected nodes" },
    { id: 25, token: "weights", category: "ai_tech", pos: [38, 48, 26], desc: "Trainable parameters" },
    { id: 26, token: "layer", category: "ai_tech", pos: [42, 50, 15], desc: "Model layer" },
    { id: 27, token: "dimension", category: "ai_tech", pos: [30, 42, 50], desc: "Vector axis" },
    { id: 28, token: "latent", category: "ai_tech", pos: [32, 45, 45], desc: "Hidden representation" },
    { id: 29, token: "space", category: "ai_tech", pos: [28, 48, 42], desc: "Vector coordinate space" },
    { id: 30, token: "vocabulary", category: "ai_tech", pos: [48, 12, 32], desc: "Set of known tokens" },
    { id: 31, token: "bpe", category: "ai_tech", pos: [52, 10, 38], desc: "Byte-Pair Encoding" },
    { id: 32, token: "subword", category: "ai_tech", pos: [50, 16, 40], desc: "Subword fragment" },
    { id: 33, token: "corpus", category: "ai_tech", pos: [40, 12, 35], desc: "Training text dataset" },

    // Common Verbs & Actions (Cluster 2: centered around [-35, 30, -20])
    { id: 40, token: "is", category: "verb", pos: [-30, 25, -25], desc: "Be verb" },
    { id: 41, token: "are", category: "verb", pos: [-28, 27, -23], desc: "Plural be verb" },
    { id: 42, token: "build", category: "verb", pos: [-38, 35, -15], desc: "To construct" },
    { id: 43, token: "train", category: "verb", pos: [-35, 40, -12], desc: "To optimize weights" },
    { id: 44, token: "visualize", category: "verb", pos: [-42, 38, -22], desc: "To project visually" },
    { id: 45, token: "create", category: "verb", pos: [-40, 32, -18], desc: "To generate" },
    { id: 46, token: "add", category: "verb", pos: [-45, 30, -10], desc: "To insert" },
    { id: 47, token: "generate", category: "verb", pos: [-36, 42, -28], desc: "To produce" },
    { id: 48, token: "learn", category: "verb", pos: [-32, 45, -16], desc: "To acquire representations" },
    { id: 49, token: "predict", category: "verb", pos: [-34, 47, -24], desc: "To infer" },
    { id: 50, token: "convert", category: "verb", pos: [-44, 28, -26], desc: "To transform" },
    { id: 51, token: "split", category: "verb", pos: [-46, 26, -18], desc: "To break apart" },
    { id: 52, token: "merge", category: "verb", pos: [-43, 24, -14], desc: "To combine pairs" },

    // Grammar & Connectors (Cluster 3: centered around [-40, -30, 30])
    { id: 60, token: "the", category: "grammar", pos: [-42, -28, 25], desc: "Definite article" },
    { id: 61, token: "a", category: "grammar", pos: [-45, -30, 28], desc: "Indefinite article" },
    { id: 62, token: "an", category: "grammar", pos: [-46, -32, 29], desc: "Indefinite article" },
    { id: 63, token: "and", category: "grammar", pos: [-38, -25, 35], desc: "Conjunction" },
    { id: 64, token: "or", category: "grammar", pos: [-36, -24, 38], desc: "Conjunction" },
    { id: 65, token: "in", category: "grammar", pos: [-40, -35, 32], desc: "Preposition" },
    { id: 66, token: "of", category: "grammar", pos: [-42, -34, 34], desc: "Preposition" },
    { id: 67, token: "to", category: "grammar", pos: [-39, -38, 27], desc: "Preposition" },
    { id: 68, token: "with", category: "grammar", pos: [-35, -36, 30], desc: "Preposition" },
    { id: 69, token: "for", category: "grammar", pos: [-37, -33, 33], desc: "Preposition" },
    { id: 70, token: "on", category: "grammar", pos: [-43, -37, 26], desc: "Preposition" },
    { id: 71, token: "by", category: "grammar", pos: [-44, -39, 31], desc: "Preposition" },
    { id: 72, token: "as", category: "grammar", pos: [-47, -29, 36], desc: "Conjunction/preposition" },
    { id: 73, token: "this", category: "grammar", pos: [-34, -28, 42], desc: "Demonstrative" },
    { id: 74, token: "that", category: "grammar", pos: [-32, -26, 44], desc: "Demonstrative" },
    { id: 75, token: "each", category: "grammar", pos: [-30, -32, 40], desc: "Quantifier" },
    { id: 76, token: "all", category: "grammar", pos: [-31, -34, 37], desc: "Quantifier" },

    // Subwords & Morphemes (Cluster 4: centered around [15, -45, -30])
    { id: 80, token: "ing", category: "subword", pos: [15, -42, -28], desc: "Continuous suffix" },
    { id: 81, token: "ed", category: "subword", pos: [18, -44, -26], desc: "Past tense suffix" },
    { id: 82, token: "tion", category: "subword", pos: [12, -40, -32], desc: "Noun suffix" },
    { id: 83, token: "ize", category: "subword", pos: [14, -46, -30], desc: "Verb suffix" },
    { id: 84, token: "er", category: "subword", pos: [20, -42, -24], desc: "Comparative / agent suffix" },
    { id: 85, token: "est", category: "subword", pos: [22, -45, -22], desc: "Superlative suffix" },
    { id: 86, token: "un", category: "subword", pos: [10, -48, -35], desc: "Negation prefix" },
    { id: 87, token: "re", category: "subword", pos: [11, -50, -33], desc: "Repetition prefix" },
    { id: 88, token: "pre", category: "subword", pos: [08, -47, -36], desc: "Before prefix" },
    { id: 89, token: "multi", category: "subword", pos: [06, -44, -38], desc: "Many prefix" },
    { id: 90, token: "trans", category: "subword", pos: [17, -38, -34], desc: "Across prefix" },
    { id: 91, token: "form", category: "subword", pos: [21, -36, -32], desc: "Shape root" },
    { id: 92, token: "able", category: "subword", pos: [24, -40, -27], desc: "Capacity suffix" },
    { id: 93, token: "al", category: "subword", pos: [19, -47, -29], desc: "Adjectival suffix" },

    // Hinglish & Multilingual (Cluster 5: centered around [-20, 20, 50])
    { id: 100, token: "naya", category: "hinglish", pos: [-18, 18, 52], desc: "New / fresh" },
    { id: 101, token: "shabd", category: "hinglish", pos: [-22, 22, 54], desc: "Word / token" },
    { id: 102, token: "add", category: "hinglish", pos: [-20, 25, 48], desc: "Jodna / add karna" },
    { id: 103, token: "hona", category: "hinglish", pos: [-25, 15, 56], desc: "To be / should happen" },
    { id: 104, token: "cahiye", category: "hinglish", pos: [-24, 12, 58], desc: "Ought to be / wanted" },
    { id: 105, token: "karo", category: "hinglish", pos: [-16, 24, 50], desc: "Do it" },
    { id: 106, token: "karta", category: "hinglish", pos: [-15, 26, 49], desc: "Does" },
    { id: 107, token: "hai", category: "hinglish", pos: [-28, 14, 52], desc: "Is" },
    { id: 108, token: "hain", category: "hinglish", pos: [-27, 16, 50], desc: "Are" },
    { id: 109, token: "bahut", category: "hinglish", pos: [-12, 19, 53], desc: "Very / much" },
    { id: 110, token: "aasan", category: "hinglish", pos: [-10, 21, 55], desc: "Easy / simple" },
    { id: 111, token: "samajh", category: "hinglish", pos: [-14, 28, 47], desc: "Understanding" },
    { id: 112, token: "bhasha", category: "hinglish", pos: [-21, 30, 46], desc: "Language" },
    { id: 113, token: "dost", category: "hinglish", pos: [-26, 32, 44], desc: "Friend" },
    { id: 114, token: "namaste", category: "hinglish", pos: [-29, 35, 42], desc: "Greetings" },

    // Code & Math Symbols (Cluster 6: centered around [25, -20, 35])
    { id: 120, token: "def", category: "code", pos: [22, -18, 38], desc: "Function definition" },
    { id: 121, token: "return", category: "code", pos: [24, -22, 36], desc: "Return statement" },
    { id: 122, token: "import", category: "code", pos: [26, -16, 40], desc: "Import module" },
    { id: 123, token: "class", category: "code", pos: [28, -20, 34], desc: "Class definition" },
    { id: 124, token: "3d", category: "code", pos: [32, -25, 32], desc: "Three dimensional" },
    { id: 125, token: "axis", category: "code", pos: [30, -28, 30], desc: "Coordinate axis" },

    // Punctuations (Cluster 7: near origin / bottom)
    { id: 130, token: ".", category: "punct", pos: [0, -60, 5], desc: "Period" },
    { id: 131, token: ",", category: "punct", pos: [2, -62, 8], desc: "Comma" },
    { id: 132, token: "!", category: "punct", pos: [-3, -58, 2], desc: "Exclamation" },
    { id: 133, token: "?", category: "punct", pos: [5, -59, -3], desc: "Question mark" },
    { id: 134, token: ":", category: "punct", pos: [-2, -61, -6], desc: "Colon" }
];

// Predefined BPE merges (ordered list of symbol merges)
const DEFAULT_BPE_MERGES = [
    ["t", "o"],
    ["to", "k"],
    ["tok", "en"],
    ["token", "s"],
    ["token", "ize"],
    ["tokenize", "r"],
    ["tokenize", "ation"],
    ["e", "m"],
    ["em", "b"],
    ["emb", "ed"],
    ["embed", "ding"],
    ["embedding", "s"],
    ["v", "e"],
    ["ve", "c"],
    ["vec", "tor"],
    ["m", "o"],
    ["mo", "d"],
    ["mod", "el"],
    ["t", "r"],
    ["tr", "ans"],
    ["trans", "form"],
    ["transform", "er"],
    ["n", "a"],
    ["na", "ya"],
    ["s", "h"],
    ["sh", "a"],
    ["sha", "bd"],
    ["a", "d"],
    ["ad", "d"],
    ["h", "o"],
    ["ho", "na"],
    ["c", "a"],
    ["ca", "h"],
    ["cah", "iye"],
    ["n", "e"],
    ["ne", "w"],
    ["l", "o"],
    ["lo", "w"],
    ["low", "er"],
    ["low", "est"]
];

// Colors associated with token categories (RDR2 Frontier vintage palette)
const CATEGORY_COLORS = {
    ai_tech: { bg: "#3b5a82", border: "#5378a5", label: "Colt Blue / AI", glow: "rgba(59, 90, 130, 0.25)" },
    verb: { bg: "#2f593b", border: "#437852", label: "Pine Green / Verbs", glow: "rgba(47, 89, 59, 0.25)" },
    grammar: { bg: "#6b3543", border: "#8f4a5c", label: "Dusty Maroon / Syntax", glow: "rgba(107, 53, 67, 0.25)" },
    subword: { bg: "#994e2e", border: "#bf6843", label: "Rust Copper / Affixes", glow: "rgba(153, 78, 46, 0.25)" },
    hinglish: { bg: "#ab712a", border: "#c98838", label: "Saddle Tan / Indic", glow: "rgba(171, 113, 42, 0.25)" },
    code: { bg: "#415359", border: "#597078", label: "Gunmetal / Logic", glow: "rgba(65, 83, 89, 0.25)" },
    special: { bg: "#ba181b", border: "#e63946", label: "Blood Crimson / Special", glow: "rgba(186, 24, 27, 0.25)" },
    punct: { bg: "#595246", border: "#7d7465", label: "Weathered Bone", glow: "rgba(89, 82, 70, 0.25)" },
    user_added: { bg: "#c59b27", border: "#f0c242", label: "Outlaw Gold", glow: "rgba(197, 155, 39, 0.3)" }
};

if (typeof module !== 'undefined') {
    module.exports = {
        DEFAULT_SAMPLE_CORPORA,
        PRESET_INPUTS,
        INITIAL_VOCABULARY,
        DEFAULT_BPE_MERGES,
        CATEGORY_COLORS
    };
}
