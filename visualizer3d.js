/**
 * 3D Embedding Visualizer (Red Dead Redemption 2 Frontier Edition)
 * Features reduced pin-point dot sizes, aged sepia coordinate manifold,
 * crimson trajectory lines, and frontier brass distance chords.
 */

class EmbeddingVisualizer3D {
    constructor(canvasContainerId, embeddingSpace, options = {}) {
        this.container = document.getElementById(canvasContainerId);
        if (!this.container) {
            console.error(`Container #${canvasContainerId} not found`);
            return;
        }

        this.embeddingSpace = embeddingSpace;
        this.options = Object.assign({
            showLabels: true,
            showVectors: false,
            showTrajectory: true,
            showGrid: true,
            autoRotate: false,
            pointSize: 2.8,   // Decreased dot size for refined pin-point nodes
            fontSize: 10
        }, options);

        // Camera & Transform state
        this.rotX = 0.35;
        this.rotY = -0.65;
        this.zoom = 1.0;
        this.panX = 0;
        this.panY = 0;
        this.distance = 260;

        // Interaction state
        this.isDragging = false;
        this.isPanning = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.hoveredToken = null;
        this.selectedToken = null;
        this.similarityPair = [null, null];
        this.activeTrajectoryTokens = [];
        this.newlyAddedToken = null;
        this.newlyAddedPulse = 0;

        // Animation loop
        this.animId = null;
        this.trajectoryPhase = 0;

        // Create canvas
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'w-full h-full block cursor-grab active:cursor-grabbing';
        this.ctx = this.canvas.getContext('2d');
        this.container.appendChild(this.canvas);

        // Tooltip element
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'visualizer-tooltip hidden absolute pointer-events-none z-30';
        this.container.appendChild(this.tooltip);

        this.setupEvents();
        this.resize();
        this.start();
    }

    setupEvents() {
        window.addEventListener('resize', () => this.resize());

        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 2 || e.shiftKey) {
                this.isPanning = true;
            } else {
                this.isDragging = true;
            }
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
        });

        window.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            if (this.isDragging) {
                const dx = e.clientX - this.lastMouseX;
                const dy = e.clientY - this.lastMouseY;
                this.rotY += dx * 0.007;
                this.rotX += dy * 0.007;
                this.rotX = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, this.rotX));
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
            } else if (this.isPanning) {
                const dx = e.clientX - this.lastMouseX;
                const dy = e.clientY - this.lastMouseY;
                this.panX += dx;
                this.panY += dy;
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
            } else {
                this.handleHover(mouseX, mouseY);
            }
        });

        window.addEventListener('mouseup', () => {
            this.isDragging = false;
            this.isPanning = false;
        });

        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomDelta = e.deltaY * -0.0015;
            this.zoom = Math.max(0.3, Math.min(3.5, this.zoom + zoomDelta));
        }, { passive: false });

        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            this.handleClick(mouseX, mouseY);
        });

        // Touch support
        let touchStartDist = 0;
        this.canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                this.isDragging = true;
                this.lastMouseX = e.touches[0].clientX;
                this.lastMouseY = e.touches[0].clientY;
            } else if (e.touches.length === 2) {
                this.isDragging = false;
                touchStartDist = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );
            }
        });

        this.canvas.addEventListener('touchmove', (e) => {
            if (e.touches.length === 1 && this.isDragging) {
                const dx = e.touches[0].clientX - this.lastMouseX;
                const dy = e.touches[0].clientY - this.lastMouseY;
                this.rotY += dx * 0.007;
                this.rotX += dy * 0.007;
                this.lastMouseX = e.touches[0].clientX;
                this.lastMouseY = e.touches[0].clientY;
            } else if (e.touches.length === 2) {
                const dist = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );
                const delta = (dist - touchStartDist) * 0.005;
                this.zoom = Math.max(0.3, Math.min(3.5, this.zoom + delta));
                touchStartDist = dist;
            }
        });

        this.canvas.addEventListener('touchend', () => {
            this.isDragging = false;
        });
    }

    resize() {
        const width = this.container.clientWidth || 800;
        const height = this.container.clientHeight || 550;
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = width * dpr;
        this.canvas.height = height * dpr;
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.scale(dpr, dpr);
        this.width = width;
        this.height = height;
    }

    start() {
        if (!this.animId) {
            const loop = () => {
                this.update();
                this.render();
                this.animId = requestAnimationFrame(loop);
            };
            this.animId = requestAnimationFrame(loop);
        }
    }

    stop() {
        if (this.animId) {
            cancelAnimationFrame(this.animId);
            this.animId = null;
        }
    }

    update() {
        if (this.options.autoRotate && !this.isDragging) {
            this.rotY += 0.0018;
        }
        this.trajectoryPhase += 0.03;
        if (this.newlyAddedPulse > 0) {
            this.newlyAddedPulse -= 0.02;
            if (this.newlyAddedPulse < 0) this.newlyAddedPulse = 0;
        }
    }

    project(p3) {
        const [x, y, z] = p3;
        const cosY = Math.cos(this.rotY);
        const sinY = Math.sin(this.rotY);
        const x1 = x * cosY - z * sinY;
        const z1 = z * cosY + x * sinY;

        const cosX = Math.cos(this.rotX);
        const sinX = Math.sin(this.rotX);
        const y2 = y * cosX - z1 * sinX;
        const z2 = z1 * cosX + y * sinX;

        const fov = 500 * this.zoom;
        const depth = this.distance + z2;
        if (depth <= 10) return { x: 0, y: 0, z: -9999, scale: 0, visible: false };

        const scale = fov / depth;
        const screenX = (this.width / 2) + this.panX + (x1 * scale);
        const screenY = (this.height / 2) + this.panY - (y2 * scale);

        return {
            x: screenX,
            y: screenY,
            z: z2,
            scale,
            visible: screenX >= -50 && screenX <= this.width + 50 && screenY >= -50 && screenY <= this.height + 50
        };
    }

    render() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);

        // 1. RDR2 Atmospheric Aged Canvas Background
        const bgGrad = ctx.createRadialGradient(
            this.width / 2, this.height / 2, 70,
            this.width / 2, this.height / 2, Math.max(this.width, this.height) / 1.15
        );
        bgGrad.addColorStop(0, '#17130e');
        bgGrad.addColorStop(1, '#090705');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, this.width, this.height);

        // 2. Coordinate Grid & Axes
        if (this.options.showGrid) {
            this.renderGrid(ctx);
        }

        // 3. Vector lines from origin (0, 0, 0)
        if (this.options.showVectors) {
            this.renderVectorLines(ctx);
        }

        // 4. Cosine Distance Chord between selected pair
        if (this.similarityPair[0] && this.similarityPair[1]) {
            this.renderSimilarityChord(ctx, this.similarityPair[0], this.similarityPair[1]);
        }

        // 5. Active Sentence Trajectory Path (RDR2 Crimson Line)
        if (this.options.showTrajectory && this.activeTrajectoryTokens.length > 1) {
            this.renderTrajectoryPath(ctx);
        }

        // 6. Gather and depth-sort all token nodes
        const nodes = [];
        for (const [token, pos] of this.embeddingSpace.coords3D.entries()) {
            const proj = this.project(pos);
            if (!proj.visible) continue;

            nodes.push({
                token,
                pos,
                proj,
                isHovered: this.hoveredToken === token,
                isSelected: this.selectedToken === token,
                isActive: this.activeTrajectoryTokens.includes(token),
                isNew: this.newlyAddedToken === token
            });
        }

        nodes.sort((a, b) => a.proj.z - b.proj.z);

        for (const node of nodes) {
            this.renderNode(ctx, node);
        }

        this.renderHUD(ctx);
    }

    renderGrid(ctx) {
        const gridRadius = 80;
        const step = 20;

        ctx.lineWidth = 1;
        // Aged sepia / brass grid lines
        ctx.strokeStyle = 'rgba(197, 155, 39, 0.08)';

        const yFloor = -60;
        for (let x = -gridRadius; x <= gridRadius; x += step) {
            const p1 = this.project([x, yFloor, -gridRadius]);
            const p2 = this.project([x, yFloor, gridRadius]);
            if (p1.visible && p2.visible) {
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            }
        }

        for (let z = -gridRadius; z <= gridRadius; z += step) {
            const p1 = this.project([-gridRadius, yFloor, z]);
            const p2 = this.project([gridRadius, yFloor, z]);
            if (p1.visible && p2.visible) {
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            }
        }

        // Origin axes: Crimson (X), Frontier Pine (Y), Steel Blue (Z)
        const origin = this.project([0, 0, 0]);
        const axisLen = 30;

        const xEnd = this.project([axisLen, 0, 0]);
        const yEnd = this.project([0, axisLen, 0]);
        const zEnd = this.project([0, 0, axisLen]);

        if (origin.visible) {
            ctx.lineWidth = 1.25;

            // X Axis - RDR2 Crimson
            ctx.beginPath();
            ctx.strokeStyle = '#ba181b';
            ctx.moveTo(origin.x, origin.y);
            ctx.lineTo(xEnd.x, xEnd.y);
            ctx.stroke();

            // Y Axis - Frontier Pine Green
            ctx.beginPath();
            ctx.strokeStyle = '#3e7d53';
            ctx.moveTo(origin.x, origin.y);
            ctx.lineTo(yEnd.x, yEnd.y);
            ctx.stroke();

            // Z Axis - Steel Blue
            ctx.beginPath();
            ctx.strokeStyle = '#4a6f96';
            ctx.moveTo(origin.x, origin.y);
            ctx.lineTo(zEnd.x, zEnd.y);
            ctx.stroke();

            ctx.fillStyle = '#ab9d87';
            ctx.font = '9px "Georgia", serif';
            ctx.fillText('X', xEnd.x + 4, xEnd.y);
            ctx.fillText('Y', yEnd.x, yEnd.y - 4);
            ctx.fillText('Z', zEnd.x + 4, zEnd.y);
        }
    }

    renderVectorLines(ctx) {
        const origin = this.project([0, 0, 0]);
        if (!origin.visible) return;

        ctx.lineWidth = 0.65;
        for (const [token, pos] of this.embeddingSpace.coords3D.entries()) {
            const proj = this.project(pos);
            if (!proj.visible) continue;

            const isActive = this.activeTrajectoryTokens.includes(token);
            ctx.strokeStyle = isActive ? 'rgba(186, 24, 27, 0.5)' : 'rgba(171, 157, 135, 0.09)';
            ctx.beginPath();
            ctx.moveTo(origin.x, origin.y);
            ctx.lineTo(proj.x, proj.y);
            ctx.stroke();
        }
    }

    renderTrajectoryPath(ctx) {
        const tokens = this.activeTrajectoryTokens;
        ctx.save();

        for (let i = 0; i < tokens.length - 1; i++) {
            const t1 = tokens[i];
            const t2 = tokens[i + 1];
            const p1 = this.embeddingSpace.get3DCoords(t1);
            const p2 = this.embeddingSpace.get3DCoords(t2);

            const proj1 = this.project(p1);
            const proj2 = this.project(p2);
            if (!proj1.visible || !proj2.visible) continue;

            // RDR2 Blood Red dashed path
            ctx.beginPath();
            ctx.strokeStyle = '#ba181b';
            ctx.lineWidth = 1.6;
            ctx.setLineDash([5, 4]);
            ctx.lineDashOffset = -this.trajectoryPhase * 8;
            ctx.moveTo(proj1.x, proj1.y);
            ctx.lineTo(proj2.x, proj2.y);
            ctx.stroke();

            // Step Badge in Parchment/Crimson
            const midX = (proj1.x + proj2.x) / 2;
            const midY = (proj1.y + proj2.y) / 2;
            ctx.setLineDash([]);
            ctx.fillStyle = '#18130e';
            ctx.beginPath();
            ctx.arc(midX, midY, 6.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ba181b';
            ctx.lineWidth = 1.2;
            ctx.stroke();

            ctx.fillStyle = '#f5eedc';
            ctx.font = 'bold 8px "Georgia", serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${i + 1}`, midX, midY);
        }

        ctx.restore();
    }

    renderSimilarityChord(ctx, tokenA, tokenB) {
        const pA = this.embeddingSpace.get3DCoords(tokenA);
        const pB = this.embeddingSpace.get3DCoords(tokenB);
        const projA = this.project(pA);
        const projB = this.project(pB);

        if (!projA.visible || !projB.visible) return;

        const sim = this.embeddingSpace.cosineSimilarity(tokenA, tokenB);
        const dist = this.embeddingSpace.euclideanDistance(tokenA, tokenB);

        ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = '#c59b27'; // Outlaw Gold
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.moveTo(projA.x, projA.y);
        ctx.lineTo(projB.x, projB.y);
        ctx.stroke();

        const midX = (projA.x + projB.x) / 2;
        const midY = (projA.y + projB.y) / 2;

        const simPercent = (sim * 100).toFixed(1);
        const pillText = `Sim: ${simPercent}% | d: ${dist.toFixed(1)}`;

        ctx.font = '10px "Georgia", serif';
        const metrics = ctx.measureText(pillText);
        const padX = 6;
        const padY = 3;
        const w = metrics.width + padX * 2;
        const h = 16;

        ctx.setLineDash([]);
        ctx.fillStyle = '#17130e';
        ctx.strokeStyle = '#c59b27';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(midX - w / 2, midY - h / 2, w, h, 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#f5eedc';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(pillText, midX, midY);

        ctx.restore();
    }

    renderNode(ctx, node) {
        const { token, proj, isHovered, isSelected, isActive, isNew } = node;
        const scale = proj.scale;
        
        // DECREASED DOT SIZE: Small, refined pin-point dots
        let baseRadius = this.options.pointSize * scale;
        baseRadius = Math.max(1.8, Math.min(6.5, baseRadius));

        const catInfo = this.getCategoryInfo(token);
        const color = catInfo.bg;
        const border = catInfo.border;

        ctx.save();

        // Subtle accent ring on hover or selection
        if (isHovered || isSelected || isActive || isNew) {
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, baseRadius + 2.5, 0, Math.PI * 2);
            ctx.strokeStyle = isNew ? '#c59b27' : (isSelected ? '#f5eedc' : (isActive ? '#ba181b' : '#ab9d87'));
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // Small Pin-point Node
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, baseRadius, 0, Math.PI * 2);
        ctx.fillStyle = isNew ? '#c59b27' : color;
        ctx.fill();
        ctx.lineWidth = 0.75;
        ctx.strokeStyle = isNew ? '#f5eedc' : border;
        ctx.stroke();

        // Label rendering (RDR2 serif style pill)
        if (this.options.showLabels || isHovered || isSelected || isActive || isNew) {
            const labelSize = Math.max(8.5, Math.min(13, this.options.fontSize * scale));
            ctx.font = `${(isNew || isSelected || isActive) ? 'bold ' : 'normal '}${labelSize}px "Georgia", "Playfair Display", serif`;

            const displayToken = token.replace(/ /g, '␣');
            const textWidth = ctx.measureText(displayToken).width;
            const padX = 4;
            const padY = 2;
            const textY = proj.y - baseRadius - 5;

            // RDR2 Dark Leather / Crimson pill
            ctx.fillStyle = isNew
                ? 'rgba(197, 155, 39, 0.9)'
                : (isActive ? 'rgba(186, 24, 27, 0.9)' : 'rgba(23, 19, 14, 0.88)');
            ctx.strokeStyle = isNew ? '#c59b27' : (isActive ? '#ba181b' : 'rgba(74, 58, 42, 0.7)');
            ctx.lineWidth = 0.6;

            ctx.beginPath();
            ctx.roundRect(proj.x - textWidth / 2 - padX, textY - labelSize / 2 - padY, textWidth + padX * 2, labelSize + padY * 2, 2);
            ctx.fill();
            ctx.stroke();

            // Text color (parchment white / gold)
            ctx.fillStyle = isNew ? '#17130e' : (isActive ? '#ffffff' : '#e8dcc4');
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(displayToken, proj.x, textY);
        }

        ctx.restore();
    }

    renderHUD(ctx) {
        ctx.save();
        ctx.font = '10px "Georgia", serif';
        ctx.fillStyle = '#8f806a';
        ctx.textAlign = 'left';
        ctx.fillText(`Tokens: ${this.embeddingSpace.coords3D.size} | Zoom: ${(this.zoom * 100).toFixed(0)}%`, 14, 20);
        ctx.fillText(`Rotation: [${(this.rotX * 180 / Math.PI).toFixed(0)}°, ${(this.rotY * 180 / Math.PI).toFixed(0)}°]`, 14, 34);

        if (this.activeTrajectoryTokens.length > 0) {
            ctx.fillStyle = '#ba181b';
            ctx.fillText(`Trajectory: ${this.activeTrajectoryTokens.length} active tokens`, 14, 48);
        }
        ctx.restore();
    }

    getCategoryInfo(token) {
        if (typeof CATEGORY_COLORS !== 'undefined') {
            if (token === this.newlyAddedToken) return CATEGORY_COLORS.user_added;
            for (const item of INITIAL_VOCABULARY) {
                if (item.token === token) {
                    return CATEGORY_COLORS[item.category] || CATEGORY_COLORS.ai_tech;
                }
            }
        }
        return { bg: "#3b5a82", border: "#5378a5", label: "Token" };
    }

    handleHover(mouseX, mouseY) {
        let closest = null;
        let minDistance = 14;

        for (const [token, pos] of this.embeddingSpace.coords3D.entries()) {
            const proj = this.project(pos);
            if (!proj.visible) continue;

            const d = Math.hypot(proj.x - mouseX, proj.y - mouseY);
            if (d < minDistance) {
                minDistance = d;
                closest = { token, pos, proj };
            }
        }

        if (closest) {
            this.hoveredToken = closest.token;
            this.showTooltip(closest);
            this.canvas.style.cursor = 'pointer';
        } else {
            this.hoveredToken = null;
            this.hideTooltip();
            this.canvas.style.cursor = this.isDragging ? 'grabbing' : 'grab';
        }
    }

    handleClick(mouseX, mouseY) {
        if (this.hoveredToken) {
            this.selectedToken = this.hoveredToken;
            const event = new CustomEvent('tokenSelected', {
                detail: {
                    token: this.selectedToken,
                    pos: this.embeddingSpace.get3DCoords(this.selectedToken),
                    neighbors: this.embeddingSpace.getNearestNeighbors(this.selectedToken, 5)
                }
            });
            window.dispatchEvent(event);
        }
    }

    showTooltip(node) {
        const { token, pos, proj } = node;
        const coordsStr = `[${pos[0].toFixed(1)}, ${pos[1].toFixed(1)}, ${pos[2].toFixed(1)}]`;
        const neighbors = this.embeddingSpace.getNearestNeighbors(token, 3);
        const neighborsStr = neighbors.map(n => `"${n.token}" (${(n.similarity * 100).toFixed(0)}%)`).join(', ');
        const isUserAdded = token === this.newlyAddedToken;

        this.tooltip.innerHTML = `
            <div class="bg-[#1c1611] border-l-2 border-l-[#ba181b] border border-[#42372c] rounded p-2.5 shadow-2xl text-xs min-w-[175px] font-serif">
                <div class="flex items-center justify-between border-b border-[#362b20] pb-1 mb-1.5">
                    <span class="font-bold text-[#f5eedc]">"${token}"</span>
                    <span class="text-[10px] px-1.5 py-0.2 rounded bg-[#2a2118] text-[#c59b27] border border-[#42372c] uppercase tracking-wider">${isUserAdded ? 'Custom Word' : 'Token'}</span>
                </div>
                <div class="text-[#ab9d87] text-[11px] space-y-0.5">
                    <div>Coordinates: <span class="font-mono text-[#f5eedc]">${coordsStr}</span></div>
                    <div>Neighbors: <span class="text-[#c59b27]">${neighborsStr || 'None'}</span></div>
                </div>
            </div>
        `;

        this.tooltip.classList.remove('hidden');
        this.tooltip.style.left = `${Math.min(this.width - 195, Math.max(10, proj.x + 12))}px`;
        this.tooltip.style.top = `${Math.min(this.height - 90, Math.max(10, proj.y - 15))}px`;
    }

    hideTooltip() {
        this.tooltip.classList.add('hidden');
    }

    focusToken(token) {
        const pos = this.embeddingSpace.get3DCoords(token);
        if (!pos) return;

        this.selectedToken = token;
        const dist = Math.hypot(pos[0], pos[2]);
        this.rotY = Math.atan2(pos[0], pos[2]);
        this.rotX = -Math.atan2(pos[1], dist);
        this.zoom = 1.35;
        this.panX = 0;
        this.panY = 0;
    }

    highlightNewWord(token) {
        this.newlyAddedToken = token;
        this.newlyAddedPulse = 1.0;
        this.focusToken(token);
    }

    setActiveTokens(tokenList) {
        this.activeTrajectoryTokens = tokenList.filter(t => this.embeddingSpace.coords3D.has(t));
    }

    setSimilarityPair(tokenA, tokenB) {
        this.similarityPair = [tokenA, tokenB];
    }

    resetCamera() {
        this.rotX = 0.35;
        this.rotY = -0.65;
        this.zoom = 1.0;
        this.panX = 0;
        this.panY = 0;
        this.similarityPair = [null, null];
    }
}

if (typeof module !== 'undefined') {
    module.exports = { EmbeddingVisualizer3D };
}
