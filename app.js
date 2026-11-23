/**
 * Application Controller for LLM Tokenizer Studio (Professional Edition)
 * Wires together Tokenizer, 3D Vector Space, Navigation Tabs, Events, and BPE Lab.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Core Engines
    const embeddingSpace = new EmbeddingSpace(INITIAL_VOCABULARY);
    const tokenizer = new LLMTokenizer(INITIAL_VOCABULARY, DEFAULT_BPE_MERGES, embeddingSpace);
    const visualizer = new EmbeddingVisualizer3D('canvas-3d-container', embeddingSpace);

    // Global state
    let lastTrainedMerges = [];
    let currentInputText = PRESET_INPUTS[0].text;

    // Cache DOM Elements
    const elements = {
        // Navigation & Header
        headerVocabCount: document.getElementById('header-vocab-count'),
        headerActiveMode: document.getElementById('header-active-mode'),
        quickAddWordBtn: document.getElementById('quick-add-word-btn'),
        navTabBtns: document.querySelectorAll('.nav-tab-btn'),
        tabPanes: document.querySelectorAll('.tab-pane'),

        // Tab 1: Tokenizer
        tokenizerInput: document.getElementById('tokenizer-input'),
        tokenChipsContainer: document.getElementById('token-chips-container'),
        tokenCountPill: document.getElementById('token-count-pill'),
        tokenChipHoverBar: document.getElementById('token-chip-hover-bar'),
        charWordIndicator: document.getElementById('char-word-indicator'),
        clearInputBtn: document.getElementById('clear-input-btn'),
        viewActiveIn3dBtn: document.getElementById('view-active-in-3d-btn'),
        presetBtns: document.querySelectorAll('.preset-btn'),
        modeSelectBtns: document.querySelectorAll('.mode-select-btn'),
        statTotalTokens: document.getElementById('stat-total-tokens'),
        statCharCount: document.getElementById('stat-char-count'),
        statWordCount: document.getElementById('stat-word-count'),
        statCompression: document.getElementById('stat-compression'),
        statBytes: document.getElementById('stat-bytes'),
        tokenTableBody: document.getElementById('token-table-body'),

        // Tab 2: Vocab & Custom Words
        addWordForm: document.getElementById('add-word-form'),
        newWordInput: document.getElementById('new-word-input'),
        newWordCategory: document.getElementById('new-word-category'),
        newWordStrategy: document.getElementById('new-word-strategy'),
        strategyOptionLabel: document.getElementById('strategy-option-label'),
        newWordAnchorSelect: document.getElementById('new-word-anchor-select'),
        newWordCustomCoords: document.getElementById('new-word-custom-coords'),
        newWordCustomId: document.getElementById('new-word-custom-id'),
        newWordDesc: document.getElementById('new-word-desc'),
        demoBeforeToken: document.getElementById('demo-before-token'),
        demoAfterToken: document.getElementById('demo-after-token'),
        vocabTableBody: document.getElementById('vocab-table-body'),
        vocabTableCount: document.getElementById('vocab-table-count'),
        vocabSearchInput: document.getElementById('vocab-search-input'),
        vocabCategoryFilter: document.getElementById('vocab-category-filter'),
        exportVocabBtn: document.getElementById('export-vocab-btn'),
        importVocabBtn: document.getElementById('import-vocab-btn'),
        importVocabFile: document.getElementById('import-vocab-file'),
        resetVocabBtn: document.getElementById('reset-vocab-btn'),

        // Tab 3: 3D Visualizer
        btnToggleLabels: document.getElementById('btn-toggle-labels'),
        btnToggleTrajectory: document.getElementById('btn-toggle-trajectory'),
        btnToggleVectors: document.getElementById('btn-toggle-vectors'),
        btnToggleGrid: document.getElementById('btn-toggle-grid'),
        btnToggleAutorotate: document.getElementById('btn-toggle-autorotate'),
        btnResetCamera: document.getElementById('btn-reset-camera'),
        flytoSearchInput: document.getElementById('flyto-search-input'),
        flytoBtn: document.getElementById('flyto-btn'),
        inspToken: document.getElementById('insp-token'),
        inspPos: document.getElementById('insp-pos'),
        inspCategory: document.getElementById('insp-category'),
        inspNeighbors: document.getElementById('insp-neighbors'),
        simTokenA: document.getElementById('sim-token-a'),
        simTokenB: document.getElementById('sim-token-b'),
        calcSimBtn: document.getElementById('calc-sim-btn'),
        simVal: document.getElementById('sim-val'),
        distVal: document.getElementById('dist-val'),

        // Tab 4: BPE Lab
        bpeCorpusPreset: document.getElementById('bpe-corpus-preset'),
        bpeCorpusInput: document.getElementById('bpe-corpus-input'),
        bpeMergesSlider: document.getElementById('bpe-merges-slider'),
        bpeMergesVal: document.getElementById('bpe-merges-val'),
        runBpeBtn: document.getElementById('run-bpe-btn'),
        applyBpeBtn: document.getElementById('apply-bpe-btn'),
        bpeMergeCountLabel: document.getElementById('bpe-merge-count-label'),
        bpeMergesTableBody: document.getElementById('bpe-merges-table-body'),

        // Toast
        toastContainer: document.getElementById('toast-container')
    };

    // =========================================================================
    // 2. HELPER FUNCTIONS: Toast Notifications & Tab Navigation
    // =========================================================================
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = 'toast-item';

        let iconSvg = '';
        if (type === 'success') {
            iconSvg = `<svg class="w-4 h-4 text-[#c59b27]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>`;
        } else if (type === 'error') {
            iconSvg = `<svg class="w-4 h-4 text-[#ba181b]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>`;
        } else {
            iconSvg = `<svg class="w-4 h-4 text-[#ab9d87]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`;
        }

        toast.innerHTML = `
            ${iconSvg}
            <span class="flex-1">${message}</span>
        `;
        elements.toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(8px)';
            toast.style.transition = 'all 0.25s ease';
            setTimeout(() => toast.remove(), 250);
        }, 3200);
    }

    function switchTab(tabId) {
        elements.navTabBtns.forEach(btn => {
            if (btn.getAttribute('data-tab') === tabId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        elements.tabPanes.forEach(pane => {
            if (pane.id === tabId) {
                pane.classList.remove('hidden');
            } else {
                pane.classList.add('hidden');
            }
        });

        if (tabId === 'tab-visualizer') {
            setTimeout(() => visualizer.resize(), 50);
        }
    }

    elements.navTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-tab');
            switchTab(target);
        });
    });

    elements.quickAddWordBtn.addEventListener('click', () => {
        switchTab('tab-vocab');
        elements.newWordInput.focus();
    });

    // =========================================================================
    // 3. TAB 1: LIVE TOKENIZER ENGINE
    // =========================================================================
    function runLiveTokenization() {
        const text = elements.tokenizerInput.value;
        const res = tokenizer.tokenize(text);

        // Update stats
        elements.statTotalTokens.textContent = res.stats.totalTokens;
        elements.statCharCount.textContent = res.stats.charCount;
        elements.statWordCount.textContent = res.stats.wordCount;
        elements.statCompression.textContent = res.stats.compressionRatio.toFixed(2);
        elements.statBytes.textContent = res.stats.bytes;
        elements.tokenCountPill.textContent = `${res.stats.totalTokens} tokens`;
        elements.charWordIndicator.textContent = `${res.stats.charCount} chars | ${res.stats.wordCount} words`;

        visualizer.setActiveTokens(res.tokens);
        renderTokenChips(res.tokenDetails);
        renderBreakdownTable(res.tokenDetails);
    }

    function renderTokenChips(details) {
        elements.tokenChipsContainer.innerHTML = '';
        if (details.length === 0) {
            elements.tokenChipsContainer.innerHTML = `
                <div class="text-gray-500 text-xs italic m-auto py-8">
                    Tokenized words will appear here as distinct colored blocks with IDs and byte properties.
                </div>
            `;
            elements.tokenChipHoverBar.textContent = 'Hover over any token chip above to view details & byte values.';
            return;
        }

        details.forEach((item, index) => {
            const chip = document.createElement('span');
            chip.className = `token-chip chip-color-${item.colorIndex}`;
            if (item.isUserAdded) {
                chip.classList.add('user-added-chip');
            }

            chip.textContent = item.token;
            chip.title = `Token: "${item.token}" | ID: #${item.id} | Click to view in 3D`;

            chip.addEventListener('mouseenter', () => {
                const encoder = new TextEncoder();
                const bytes = Array.from(encoder.encode(item.token)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' ');
                elements.tokenChipHoverBar.innerHTML = `
                    <span class="text-gray-200">Token: <strong>"${item.token}"</strong> [Index ${index}]</span>
                    <span>ID: <strong class="text-blue-400">#${item.id}</strong></span>
                    <span>Bytes: <code class="text-gray-300">${bytes}</code></span>
                    <span>Category: <span class="capitalize text-gray-300">${item.category}</span></span>
                    ${item.isUserAdded ? '<span class="text-amber-400 font-semibold text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">Custom</span>' : ''}
                `;
            });

            chip.addEventListener('click', () => {
                switchTab('tab-visualizer');
                visualizer.focusToken(item.token);
                updateInspectorCard(item.token);
            });

            elements.tokenChipsContainer.appendChild(chip);
        });
    }

    function renderBreakdownTable(details) {
        elements.tokenTableBody.innerHTML = '';
        if (details.length === 0) {
            elements.tokenTableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-6 text-gray-500 italic">No input text yet.</td>
                </tr>
            `;
            return;
        }

        details.forEach((item, idx) => {
            const encoder = new TextEncoder();
            const hexBytes = Array.from(encoder.encode(item.token)).map(b => '0x' + b.toString(16).toUpperCase()).join(' ');
            const pos = embeddingSpace.get3DCoords(item.token);
            const posStr = `[${pos[0].toFixed(1)}, ${pos[1].toFixed(1)}, ${pos[2].toFixed(1)}]`;
            const catColor = getCategoryColor(item.category);

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="font-mono text-[#8a7a66] text-xs">${idx + 1}</td>
                <td>
                    <span class="font-mono font-medium ${item.isUserAdded ? 'text-[#c59b27]' : 'text-[#f4ecdc]'}">
                        "${item.token}"
                    </span>
                </td>
                <td class="font-mono text-[#ba181b] font-medium">#${item.id}</td>
                <td>
                    <span class="badge-category" style="background: ${catColor.bg}35; color: ${catColor.border}; border: 1px solid ${catColor.border}70;">
                        ${item.category}
                    </span>
                </td>
                <td class="font-mono text-[11px] text-[#ab9d87]">${hexBytes}</td>
                <td class="font-mono text-[11px] text-[#c59b27]">${posStr}</td>
                <td>
                    <button class="focus-3d-btn px-2 py-0.5 rounded bg-[#241c14] hover:bg-[#382c20] text-[#c59b27] text-xs border border-[#3e3226] transition uppercase tracking-wider font-semibold" data-token="${item.token}">
                        Locate
                    </button>
                </td>
            `;

            tr.querySelector('.focus-3d-btn').addEventListener('click', () => {
                switchTab('tab-visualizer');
                visualizer.focusToken(item.token);
                updateInspectorCard(item.token);
            });

            elements.tokenTableBody.appendChild(tr);
        });
    }

    function getCategoryColor(category) {
        if (typeof CATEGORY_COLORS !== 'undefined' && CATEGORY_COLORS[category]) {
            return CATEGORY_COLORS[category];
        }
        return { bg: "#2563eb", border: "#3b82f6" };
    }

    elements.tokenizerInput.addEventListener('input', runLiveTokenization);

    elements.clearInputBtn.addEventListener('click', () => {
        elements.tokenizerInput.value = '';
        runLiveTokenization();
        elements.tokenizerInput.focus();
    });

    elements.viewActiveIn3dBtn.addEventListener('click', () => {
        switchTab('tab-visualizer');
    });

    elements.presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const idx = parseInt(btn.getAttribute('data-preset'), 10);
            if (PRESET_INPUTS[idx]) {
                elements.tokenizerInput.value = PRESET_INPUTS[idx].text;
                runLiveTokenization();
            }
        });
    });

    elements.modeSelectBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.modeSelectBtns.forEach(b => {
                b.classList.remove('bg-[#ba181b]', 'text-white');
                b.classList.add('text-[#a69780]');
            });
            btn.classList.add('bg-[#ba181b]', 'text-white');
            btn.classList.remove('text-[#a69780]');

            const mode = btn.getAttribute('data-mode');
            tokenizer.mode = mode;
            elements.headerActiveMode.textContent = mode.toUpperCase();
            runLiveTokenization();
            showToast(`Switched tokenization mode to ${mode.toUpperCase()}`, 'info');
        });
    });

    // =========================================================================
    // 4. TAB 2: VOCABULARY & CUSTOM TOKENS ("ADD WORD")
    // =========================================================================
    function updateVocabCount() {
        const count = tokenizer.vocab.size;
        elements.headerVocabCount.textContent = count;
        elements.vocabTableCount.textContent = `${count} tokens`;
    }

    function populateAnchorDropdown() {
        elements.newWordAnchorSelect.innerHTML = '';
        const priorityTokens = ['token', 'model', 'transformer', 'naya', 'shabd', 'build', 'embed', 'vector'];
        priorityTokens.forEach(t => {
            if (tokenizer.vocab.has(t)) {
                const opt = document.createElement('option');
                opt.value = t;
                opt.textContent = `"${t}" (${tokenizer.vocab.get(t).category})`;
                elements.newWordAnchorSelect.appendChild(opt);
            }
        });
    }

    function populateSimilarityDropdowns() {
        elements.simTokenA.innerHTML = '';
        elements.simTokenB.innerHTML = '';

        const allTokens = Array.from(tokenizer.vocab.keys()).sort();
        allTokens.forEach(t => {
            const optA = document.createElement('option');
            optA.value = t;
            optA.textContent = t;
            const optB = document.createElement('option');
            optB.value = t;
            optB.textContent = t;

            elements.simTokenA.appendChild(optA);
            elements.simTokenB.appendChild(optB);
        });

        if (tokenizer.vocab.has('token')) elements.simTokenA.value = 'token';
        if (tokenizer.vocab.has('vector')) elements.simTokenB.value = 'vector';
    }

    elements.newWordStrategy.addEventListener('change', () => {
        const strat = elements.newWordStrategy.value;
        if (strat === 'anchor') {
            elements.strategyOptionLabel.textContent = 'Anchor Word';
            elements.newWordAnchorSelect.classList.remove('hidden');
            elements.newWordCustomCoords.classList.add('hidden');
        } else if (strat === 'custom') {
            elements.strategyOptionLabel.textContent = '3D Coords (X, Y, Z)';
            elements.newWordAnchorSelect.classList.add('hidden');
            elements.newWordCustomCoords.classList.remove('hidden');
        } else {
            elements.strategyOptionLabel.textContent = 'Embedding Placement';
            elements.newWordAnchorSelect.classList.add('hidden');
            elements.newWordCustomCoords.classList.add('hidden');
        }
    });

    elements.addWordForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const word = elements.newWordInput.value.trim();
        if (!word) return;

        const beforeSubwords = tokenizer.tokenizeSubwordsOnly(word).map(t => t.token);

        const category = elements.newWordCategory.value;
        const strategy = elements.newWordStrategy.value;
        const anchorWord = elements.newWordAnchorSelect.value;
        const customIdVal = elements.newWordCustomId.value.trim();
        const customId = customIdVal ? parseInt(customIdVal, 10) : undefined;
        const desc = elements.newWordDesc.value.trim();

        let customCoords = null;
        if (strategy === 'custom') {
            const parts = elements.newWordCustomCoords.value.split(',').map(s => parseFloat(s.trim()));
            if (parts.length === 3 && !parts.some(isNaN)) {
                customCoords = parts;
            }
        }

        try {
            const result = tokenizer.addWord(word, {
                category,
                strategy,
                anchorWord,
                customCoords,
                id: customId,
                desc
            });

            if (result.isNew) {
                elements.demoBeforeToken.textContent = JSON.stringify(beforeSubwords);
                elements.demoAfterToken.textContent = JSON.stringify([word]);

                showToast(`Token "${word}" registered with ID #${result.tokenInfo.id}`, 'success');
                updateVocabCount();
                renderVocabTable();
                populateSimilarityDropdowns();

                visualizer.highlightNewWord(word);
                runLiveTokenization();

                elements.newWordInput.value = '';
                elements.newWordCustomId.value = '';
                elements.newWordDesc.value = '';
            } else {
                showToast(result.message, 'info');
            }
        } catch (err) {
            showToast(`Error: ${err.message}`, 'error');
        }
    });

    function renderVocabTable() {
        const query = elements.vocabSearchInput.value.toLowerCase().trim();
        const catFilter = elements.vocabCategoryFilter.value;

        elements.vocabTableBody.innerHTML = '';
        const vocabList = Array.from(tokenizer.vocab.values());

        const filtered = vocabList.filter(item => {
            const matchesQuery = !query || item.token.toLowerCase().includes(query) || item.id.toString() === query;
            const matchesCat = catFilter === 'all' || item.category === catFilter || (catFilter === 'user_added' && item.isUserAdded);
            return matchesQuery && matchesCat;
        });

        filtered.sort((a, b) => {
            if (a.isUserAdded && !b.isUserAdded) return -1;
            if (!a.isUserAdded && b.isUserAdded) return 1;
            return a.id - b.id;
        });

        if (filtered.length === 0) {
            elements.vocabTableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-6 text-gray-500 italic">No matching vocabulary tokens found.</td>
                </tr>
            `;
            return;
        }

        filtered.forEach(item => {
            const pos = embeddingSpace.get3DCoords(item.token);
            const posStr = `[${pos[0].toFixed(1)}, ${pos[1].toFixed(1)}, ${pos[2].toFixed(1)}]`;
            const catColor = getCategoryColor(item.category);

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="font-mono text-[#ba181b] font-medium">#${item.id}</td>
                <td>
                    <span class="font-mono font-medium ${item.isUserAdded ? 'text-[#c59b27]' : 'text-[#f4ecdc]'}">
                        "${item.token}"
                    </span>
                </td>
                <td>
                    <span class="badge-category" style="background: ${catColor.bg}35; color: ${catColor.border}; border: 1px solid ${catColor.border}70;">
                        ${item.category}
                    </span>
                </td>
                <td class="font-mono text-[11px] text-[#c59b27]">${posStr}</td>
                <td>
                    ${item.isUserAdded
                        ? '<span class="text-[#c59b27] text-xs font-semibold uppercase tracking-wider">Outlaw Word</span>'
                        : '<span class="text-[#8a7a66] text-xs uppercase tracking-wider">Base Token</span>'}
                </td>
                <td class="text-[#ab9d87] text-xs truncate max-w-xs">${item.desc || '-'}</td>
                <td>
                    <div class="flex items-center gap-1.5">
                        <button class="vocab-locate-btn px-2 py-0.5 rounded bg-[#241c14] hover:bg-[#382c20] text-[#c59b27] text-xs border border-[#3e3226] transition uppercase tracking-wider font-semibold" data-token="${item.token}">
                            View 3D
                        </button>
                        ${item.isUserAdded ? `
                            <button class="vocab-delete-btn px-2 py-0.5 rounded bg-[#241c14] hover:bg-[#ba181b]/30 text-[#ba181b] text-xs border border-[#3e3226] transition uppercase tracking-wider font-semibold" data-token="${item.token}">
                                Remove
                            </button>
                        ` : ''}
                    </div>
                </td>
            `;

            tr.querySelector('.vocab-locate-btn').addEventListener('click', () => {
                switchTab('tab-visualizer');
                visualizer.focusToken(item.token);
                updateInspectorCard(item.token);
            });

            const delBtn = tr.querySelector('.vocab-delete-btn');
            if (delBtn) {
                delBtn.addEventListener('click', () => {
                    if (confirm(`Remove custom token "${item.token}" from vocabulary?`)) {
                        tokenizer.removeWord(item.token);
                        showToast(`Removed "${item.token}" from vocabulary`, 'info');
                        updateVocabCount();
                        renderVocabTable();
                        runLiveTokenization();
                    }
                });
            }

            elements.vocabTableBody.appendChild(tr);
        });
    }

    elements.vocabSearchInput.addEventListener('input', renderVocabTable);
    elements.vocabCategoryFilter.addEventListener('change', renderVocabTable);

    // Export Vocabulary JSON
    elements.exportVocabBtn.addEventListener('click', () => {
        const jsonStr = tokenizer.exportVocab();
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vocab_export_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Vocabulary exported to JSON file', 'success');
    });

    // Import Vocabulary JSON
    elements.importVocabBtn.addEventListener('click', () => {
        elements.importVocabFile.click();
    });

    elements.importVocabFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const count = tokenizer.importVocab(evt.target.result);
                updateVocabCount();
                renderVocabTable();
                populateSimilarityDropdowns();
                runLiveTokenization();
                showToast(`Successfully imported ${count} tokens into vocabulary`, 'success');
            } catch (err) {
                showToast(`Import error: ${err.message}`, 'error');
            }
        };
        reader.readAsText(file);
    });

    // Reset Vocabulary
    elements.resetVocabBtn.addEventListener('click', () => {
        if (confirm("Reset vocabulary back to initial default state? All custom added words will be cleared.")) {
            embeddingSpace.init(INITIAL_VOCABULARY);
            tokenizer.init(INITIAL_VOCABULARY, DEFAULT_BPE_MERGES);
            updateVocabCount();
            renderVocabTable();
            populateSimilarityDropdowns();
            runLiveTokenization();
            showToast("Vocabulary restored to default", 'info');
        }
    });

    // =========================================================================
    // 5. TAB 3: 3D EMBEDDING VISUALIZER CONTROLS & INSPECTOR
    // =========================================================================
    function updateInspectorCard(token) {
        const pos = embeddingSpace.get3DCoords(token);
        const info = tokenizer.vocab.get(token);

        elements.inspToken.textContent = `"${token}"`;
        elements.inspPos.textContent = `[${pos[0].toFixed(1)}, ${pos[1].toFixed(1)}, ${pos[2].toFixed(1)}]`;
        elements.inspCategory.textContent = info ? info.category : 'Unknown';

        const neighbors = embeddingSpace.getNearestNeighbors(token, 5);
        elements.inspNeighbors.innerHTML = '';
        neighbors.forEach(n => {
            const row = document.createElement('div');
            row.className = 'flex items-center justify-between text-[11px] py-1 border-b border-[#2b221a]';
            row.innerHTML = `
                <span class="font-mono text-[#f4ecdc]">"${n.token}"</span>
                <div class="flex items-center gap-2">
                    <span class="text-[#c59b27] font-mono font-bold">${(n.similarity * 100).toFixed(1)}%</span>
                    <button class="neighbor-fly-btn px-1.5 py-0.5 rounded bg-[#241c14] hover:bg-[#382c20] text-[#c59b27] border border-[#3e3226] text-[10px] uppercase font-semibold">
                        Fly
                    </button>
                </div>
            `;
            row.querySelector('.neighbor-fly-btn').addEventListener('click', () => {
                visualizer.focusToken(n.token);
                updateInspectorCard(n.token);
            });
            elements.inspNeighbors.appendChild(row);
        });
    }

    window.addEventListener('tokenSelected', (e) => {
        updateInspectorCard(e.detail.token);
    });

    elements.btnToggleLabels.addEventListener('click', () => {
        visualizer.options.showLabels = !visualizer.options.showLabels;
        elements.btnToggleLabels.classList.toggle('active', visualizer.options.showLabels);
    });

    elements.btnToggleTrajectory.addEventListener('click', () => {
        visualizer.options.showTrajectory = !visualizer.options.showTrajectory;
        elements.btnToggleTrajectory.classList.toggle('active', visualizer.options.showTrajectory);
    });

    elements.btnToggleVectors.addEventListener('click', () => {
        visualizer.options.showVectors = !visualizer.options.showVectors;
        elements.btnToggleVectors.classList.toggle('active', visualizer.options.showVectors);
    });

    elements.btnToggleGrid.addEventListener('click', () => {
        visualizer.options.showGrid = !visualizer.options.showGrid;
        elements.btnToggleGrid.classList.toggle('active', visualizer.options.showGrid);
    });

    elements.btnToggleAutorotate.addEventListener('click', () => {
        visualizer.options.autoRotate = !visualizer.options.autoRotate;
        elements.btnToggleAutorotate.classList.toggle('active', visualizer.options.autoRotate);
    });

    elements.btnResetCamera.addEventListener('click', () => {
        visualizer.resetCamera();
    });

    elements.flytoBtn.addEventListener('click', () => {
        const query = elements.flytoSearchInput.value.trim();
        if (query && embeddingSpace.coords3D.has(query)) {
            visualizer.focusToken(query);
            updateInspectorCard(query);
        } else {
            showToast(`Token "${query}" not found in 3D embedding space`, 'error');
        }
    });

    elements.flytoSearchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') elements.flytoBtn.click();
    });

    elements.calcSimBtn.addEventListener('click', () => {
        const tokenA = elements.simTokenA.value;
        const tokenB = elements.simTokenB.value;
        if (!tokenA || !tokenB) return;

        const sim = embeddingSpace.cosineSimilarity(tokenA, tokenB);
        const dist = embeddingSpace.euclideanDistance(tokenA, tokenB);

        elements.simVal.textContent = `${(sim * 100).toFixed(2)}%`;
        elements.distVal.textContent = dist.toFixed(2);

        visualizer.setSimilarityPair(tokenA, tokenB);
    });

    // =========================================================================
    // 6. TAB 4: BUILD VOCABULARY (BPE TRAINING LAB)
    // =========================================================================
    elements.bpeCorpusInput.value = DEFAULT_SAMPLE_CORPORA.general;

    elements.bpeCorpusPreset.addEventListener('change', () => {
        const presetKey = elements.bpeCorpusPreset.value;
        if (DEFAULT_SAMPLE_CORPORA[presetKey]) {
            elements.bpeCorpusInput.value = DEFAULT_SAMPLE_CORPORA[presetKey];
        }
    });

    elements.bpeMergesSlider.addEventListener('input', () => {
        elements.bpeMergesVal.textContent = elements.bpeMergesSlider.value;
    });

    elements.runBpeBtn.addEventListener('click', () => {
        const corpus = elements.bpeCorpusInput.value.trim();
        if (!corpus) {
            showToast("Please enter or select a corpus for BPE training", 'error');
            return;
        }

        const mergesCount = parseInt(elements.bpeMergesSlider.value, 10);
        const result = tokenizer.trainBPE(corpus, mergesCount);

        lastTrainedMerges = result.merges;
        elements.bpeMergeCountLabel.textContent = `${result.merges.length} merges generated across ${result.uniqueWords} unique words`;

        renderBpeMergesTable(result.merges);

        if (result.merges.length > 0) {
            elements.applyBpeBtn.disabled = false;
            showToast(`BPE training complete: ${result.merges.length} merge rules generated`, 'success');
        } else {
            elements.applyBpeBtn.disabled = true;
            showToast("No repeating pairs found to merge in this corpus.", 'info');
        }
    });

    function renderBpeMergesTable(merges) {
        elements.bpeMergesTableBody.innerHTML = '';
        if (merges.length === 0) {
            elements.bpeMergesTableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-6 text-gray-500 italic">No merges produced. Try a longer corpus or fewer iterations.</td>
                </tr>
            `;
            return;
        }

        merges.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="font-mono text-[#ba181b] font-bold text-xs">#${item.step}</td>
                <td class="font-mono text-[#d6cbba] text-xs">
                    <span class="px-1.5 py-0.5 rounded bg-[#241c14] text-[#c59b27] font-semibold">${item.pair[0]}</span>
                    +
                    <span class="px-1.5 py-0.5 rounded bg-[#241c14] text-[#c59b27] font-semibold">${item.pair[1]}</span>
                </td>
                <td class="font-mono text-[#c59b27] font-bold text-xs">
                    "${item.merged}"
                </td>
                <td class="font-mono text-[#f4ecdc] text-xs">${item.frequency} times</td>
                <td class="text-xs text-[#a69780]">Creates subword token <code>${item.merged}</code></td>
            `;
            elements.bpeMergesTableBody.appendChild(tr);
        });
    }

    elements.applyBpeBtn.addEventListener('click', () => {
        if (!lastTrainedMerges || lastTrainedMerges.length === 0) return;

        const added = tokenizer.applyTrainedMerges(lastTrainedMerges);
        updateVocabCount();
        renderVocabTable();
        populateSimilarityDropdowns();
        runLiveTokenization();

        showToast(`Added ${added} new BPE subwords to the active vocabulary`, 'success');
        elements.applyBpeBtn.disabled = true;
    });

    // =========================================================================
    // 7. INITIAL BOOTSTRAP
    // =========================================================================
    updateVocabCount();
    populateAnchorDropdown();
    populateSimilarityDropdowns();
    renderVocabTable();
    updateInspectorCard('token');

    elements.tokenizerInput.value = currentInputText;
    runLiveTokenization();
});
