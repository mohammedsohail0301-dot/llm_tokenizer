# LLM Tokenizer | RDR2 Frontier Edition

An authentic **Red Dead Redemption 2 (Frontier Theme)** web application for exploring modern Large Language Model (LLM) **Tokenization**, **3D Embedding Vector Spaces**, **Vocabulary Engineering (BPE Training)**, and **Dynamic Custom Word Addition**.

---

## 🤠 Visual & Aesthetic Identity (RDR2 Frontier Edition)

- **Authentic Western Palette**:
  - Signature RDR2 Blood Crimson (`#ba181b`)
  - Outlaw Bounty Gold (`#c59b27`)
  - Aged Saddle Leather & Charcoal (`#0c0a08` / `#16120e` / `#1e1913`)
  - Weathered Ledger Parchment (`#f4ecdc` / `#c8bcab`)
- **Pin-Point 3D Vector Manifold**:
  - **Decreased Dot Size**: Substantially smaller, sharp pin-point nodes (`baseRadius` between `1.8px` and `6.5px`) for clean high-density manifold visualization.
  - Aged sepia grid planes with Crimson (X), Frontier Pine Green (Y), and Steel Blue (Z) coordinate reference axes.
  - Blood Crimson dashed trajectory connecting sequential tokens across the manifold.
  - Outlaw Gold distance chord tool for high-dimensional cosine similarity.
- **Frontier Journal Typography**:
  - Classic serif headers and labels (`Georgia`, `Playfair Display`, `serif`).
  - Monospace typewriter accents (`Courier New`) for byte values and token IDs.

---

## Key Capabilities

### 1. Multi-Algorithm Interactive Tokenizer
- **Algorithms**:
  - **BPE (Byte-Pair Encoding)**: Standard in modern LLMs (GPT-2, GPT-4, LLaMA) with whitespace tokenization (`Ġ`).
  - **WordPiece**: BERT-style subword decomposition with continuation prefixes (`##`).
  - **Character Level**: Direct character-by-character segmentation.
  - **Word Level**: Whitespace-delimited word segmentation.
- **Frontier Ledger Chips**: Rendered in weathered parchment and leather tints with hover inspectors showing raw UTF-8 byte sequences, token IDs, and semantic categories.
- **Real-Time Metrics**: Total Tokens, Character Count, Word Count, Compression Ratio (Chars/Token), and UTF-8 Byte size.
- **Detailed Ledger Table**: Comprehensive breakdown mapping tokens to IDs, categories, hex bytes, and 3D vector coordinates.

### 2. Custom Token Addition ("Add Word")
- **Dynamic Vocabulary Insertion**:
  - Register any custom word, domain term, slang, or multilingual expression (e.g. `Antigravity`, `Arthur`, `NayaShabd`).
  - Assign categories (*Outlaw Gold*, *Colt Blue*, *Pine Green*, *Dusty Maroon*, *Rust Copper*, *Saddle Tan*, *Gunmetal*).
- **3D Embedding Strategies**:
  1. **Subword Average**: Decomposes the word into constituent subwords and averages their coordinates and latent representations.
  2. **Semantic Anchor**: Positions the new word in proximity to an existing anchor token.
  3. **Cluster Centroid**: Positions the token at the centroid of its semantic category.
  4. **Custom 3D Coordinates**: Explicit `[X, Y, Z]` position.
- **Live Sync**:
  - **Before vs. After**: Watch the word transform from multiple subwords into a single atomic token.
  - **3D Space**: Instantly placed into the 3D embedding canvas with gold highlight rings.

### 3. 3D Embedding Space Visualization
- **Precision 3D Vector Space**:
  - Orbit Controls: **Left-click + Drag** to rotate, **Right-click / Shift + Drag** to pan, **Scroll wheel** to zoom.
  - Refined pin-point dot sizes, labeled reference axes (`X: Red`, `Y: Green`, `Z: Blue`).
  - Semantic clustering: AI, Verbs, Syntax, Subwords, Indic/Multi, Code, Special, Outlaw Custom.
- **Active Sentence Trajectory**:
  - As you type text in the Tokenizer, the sequence illuminates with a Crimson dashed trajectory line connecting `Token 1 -> Token 2 -> Token 3...`.
- **Vector Distance & Cosine Similarity Tool**:
  - Select any two tokens (`Token A` and `Token B`) to compute high-dimensional **Cosine Similarity** (%) and **Euclidean Distance**.
  - Draws an Outlaw Gold 3D chord with an inline metric badge.
- **Search & Fly-To**: Search any token to orient the camera smoothly to its position.

### 4. BPE Vocabulary Training Lab
- **Interactive BPE Simulator**:
  - Understand how LLM vocabularies are constructed from raw text corpora.
  - Test on sample corpora (General AI, Classic BPE, Multilingual Indic, Python Code).
  - Configurable merge iterations slider (5 to 40 merges).
  - Step-by-step merge inspection table displaying Step #, Pair `(A, B)`, Resulting Token `AB`, and Frequency.
  - **Apply Merges**: Click **"Apply Merges to Ledger"** to insert newly learned subwords directly into the active tokenizer and 3D space.

---

## Running Locally

### Option 1: Python HTTP Server (Recommended)
Run using Python standard library (no external packages required):
```bash
python3 server.py
```
Open your browser at:
```
http://localhost:8000
```

### Option 2: Direct File Open
You can open `index.html` directly in any modern browser (Chrome, Edge, Safari, Firefox).
