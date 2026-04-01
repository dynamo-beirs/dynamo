/**
 * components/line-graph.js — Line & stacked bar graph component
 *
 * Renders animated comparison graphs (single or multi-line) with GSAP-driven
 * interactions, draggable dots, custom HTML tooltips, and staggered entrance animations.
 */

export class LineGraph {

    constructor(containerSelector, options) {
        this.container = document.querySelector(containerSelector);
        if (!this.container) {
            console.error(`Container ${containerSelector} niet gevonden!`);
            return;
        }

        this.options = Object.assign({
            title: 'Grafiek',
            data: [],
            color: '#B90A0A',
            dotColor: '#800000',
            hideLineAndDots: false,
            yBase: 415,
            xStart: 90,
            xEnd: 750
        }, options);

        this.uid = Math.random().toString(36).slice(2, 11);
        this.isMultiLine = !Array.isArray(this.options.data);

        this.calculateDomain();

        const yRange = this.options.yMax - this.options.yMin;
        this.yRatio = 300 / (yRange || 1);

        this.buildSVG();
        this.initGSAP();
    }

    /* Domain Calculation */

    calculateDomain() {
        let allValues = [];

        if (this.isMultiLine) {
            for (const key in this.options.data) {
                this.options.data[key].points.forEach(p => allValues.push(p.value));
            }
        } else {
            this.options.data.forEach(p => allValues.push(p.value));
        }

        if (allValues.length === 0) {
            this.options.yMin = 0;
            this.options.yMax = 10;
            this.options.yStep = 2;
            return;
        }

        let dataMin = Math.min(...allValues);
        let dataMax = Math.max(...allValues);

        if (dataMin > 0) dataMin = 0;
        if (dataMin === 0 && dataMax === 0) dataMax = 10;

        const range = dataMax - dataMin;
        const targetSteps = 5;
        const rawStep = range / targetSteps;
        const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep || 1)));
        const residual = rawStep / magnitude;

        let niceStep;
        if (residual > 5) niceStep = 10 * magnitude;
        else if (residual > 2) niceStep = 5 * magnitude;
        else if (residual > 1) niceStep = 2 * magnitude;
        else niceStep = 1 * magnitude;

        if (niceStep < 1) niceStep = 1;

        this.options.yStep = niceStep;
        this.options.yMin = Math.floor(dataMin / niceStep) * niceStep;
        this.options.yMax = Math.ceil(dataMax / niceStep) * niceStep;

        if (this.options.yMax === dataMax) {
            this.options.yMax += niceStep;
        }
    }

    /* SVG Construction */

    buildSVG() {
        let yLabels = '';
        let hLines = '';
        const yMin = this.options.yMin;
        const yMax = this.options.yMax;

        for (let i = yMin; i <= yMax; i += this.options.yStep) {
            const yPos = this.options.yBase - ((i - yMin) * this.yRatio);
            hLines += `<line class="horizontalLine" x1="780" y1="${yPos}" opacity="0.4" x2="20" y2="${yPos}"/>`;
            const labelY = yPos - 10;
            yLabels += `<text class="yLabel" transform="translate(20 ${labelY})" dy="0.35em">${i}</text>`;
        }

        let linesSVG     = '';
        let interactionSVG = '';
        let overlaysSVG  = '';
        let xLabels      = '';
        let barsSVG      = '';
        let barLabelsSVG = '';

        if (this.isMultiLine) {
            let firstDataset = true;
            for (const [key, dataset] of Object.entries(this.options.data)) {
                const n     = dataset.points.length;
                const xStep = (this.options.xEnd - this.options.xStart) / (n - 1 || 1);

                dataset.mappedPoints = dataset.points.map((d, i) => ({
                    x: this.options.xStart + (i * xStep),
                    y: this.options.yBase - ((d.value - yMin) * this.yRatio),
                    label: d.label,
                    value: d.value,
                    tooltipHTML: d.tooltipHTML || null
                }));

                const dPath       = `M${dataset.mappedPoints[0].x},${dataset.mappedPoints[0].y} ` + dataset.mappedPoints.slice(1).map(p => `L${p.x},${p.y}`).join(' ');
                const strokeColor = this.options.hideLineAndDots ? 'transparent' : dataset.color;
                linesSVG += `<path class="graphLine graphLine-${key}" fill="none" stroke-linecap="round" stroke="${strokeColor}" stroke-width="4" stroke-miterlimit="10" d="${dPath}"/>`;

                let dots = '';
                dataset.mappedPoints.forEach((p, i) => {
                    if (firstDataset) {
                        xLabels += `<text x="${p.x}" y="${this.options.yBase + 30}">${p.label}</text>`;
                    }
                    if (this.options.hideLineAndDots) {
                        dots += `<rect class="static-dot static-dot-${key}" data-index="${i}" x="${p.x - 25}" y="${p.y}" width="50" height="${this.options.yBase - p.y}" fill="transparent" style="cursor:pointer;"/>`;
                    } else {
                        dots += `<circle class="static-dot static-dot-${key}" data-index="${i}" cx="${p.x}" cy="${p.y}" r="14" fill="transparent" style="cursor:pointer;"/>`;
                        dots += `<circle class="inner-dot" cx="${p.x}" cy="${p.y}" r="7" fill="${dataset.dotColor || dataset.color}" style="pointer-events:none;"/>`;
                    }
                });

                const displayState = this.options.hideLineAndDots ? 'none' : 'block';
                interactionSVG += `
                    <g class="interaction-group interaction-group-${key}">
                        ${dots}
                        <g class="connectorGroup" style="display: ${displayState};"><line class="connector connector-${key}" x1="92" x2="92" y1="0" y2="0" stroke="#333" /></g>
                        <g class="box box-${key}">
                            <g class="default-tooltip">
                                <rect x="0" width="80" height="40" rx="20" ry="20" fill="#FFF" stroke="${dataset.color}" stroke-width="2"/>
                                <text class="boxLabel boxLabel-${key}" x="40" y="28" fill="${dataset.dotColor || dataset.color}"></text>
                            </g>
                        </g>
                        <circle class="nullDot nullDot-${key}" fill="red" cx="0" cy="0" r="0"/>
                        <circle class="graphDot graphDot-${key}" fill="${dataset.color}" cx="0" cy="0" r="10" stroke="#FFF" stroke-width="2" style="display: ${displayState};"/>
                        <circle class="dragger dragger-${key}" fill="rgba(200,200,200,0.1)" cx="0" cy="0" r="15" stroke="rgba(200,200,200,0.15)" stroke-width="10" style="display: ${displayState};"/>
                    </g>
                `;

                overlaysSVG += `<div class="custom-tooltip-overlay custom-tooltip-overlay-${key}">
                    <div class="box-html-content box-html-content-${key}"></div>
                </div>`;

                firstDataset = false;
            }
        } else {
            const n     = this.options.data.length;
            const xStep = (this.options.xEnd - this.options.xStart) / (n - 1 || 1);

            this.points = this.options.data.map((d, i) => ({
                x: this.options.xStart + (i * xStep),
                y: this.options.yBase - ((d.value - yMin) * this.yRatio),
                label: d.label,
                value: d.value,
                stacked: d.stacked,
                tooltipHTML: d.tooltipHTML || null
            }));

            this.points.forEach(p => {
                if (p.stacked && p.stacked.length > 0) {
                    let currentY   = this.options.yBase - ((0 - yMin) * this.yRatio);
                    const barWidth = 34;

                    p.stacked.forEach((stack, stackIndex) => {
                        const h = stack.value * this.yRatio;
                        if (h > 0) {
                            currentY -= h;
                            const barX = p.x - (barWidth / 2);

                            const r = 6;
                            const isLowestBar = stackIndex === 0;
                            const maxRadiusY = isLowestBar ? h : h / 2;
                            const radius = Math.min(r, barWidth / 2, maxRadiusY);

                            const rTop = radius;
                            const rBottom = isLowestBar ? 0 : radius;

                            const pathData = `
                                M ${barX},${currentY + h - rBottom} 
                                V ${currentY + rTop} 
                                Q ${barX},${currentY} ${barX + rTop},${currentY} 
                                H ${barX + barWidth - rTop} 
                                Q ${barX + barWidth},${currentY} ${barX + barWidth},${currentY + rTop} 
                                V ${currentY + h - rBottom} 
                                Q ${barX + barWidth},${currentY + h} ${barX + barWidth - rBottom},${currentY + h} 
                                H ${barX + rBottom} 
                                Q ${barX},${currentY + h} ${barX},${currentY + h - rBottom} 
                                Z
                            `.replace(/\s+/g, ' ').trim();

                            barsSVG += `<path class="bar-rect stack-${stackIndex}" d="${pathData}" fill="${stack.color}" stroke="#FFF" stroke-width="2" opacity="0.85" />`;
                        }
                    });

                    barLabelsSVG += `<text class="bar-label" x="${p.x}" y="${currentY - 10}" fill="${this.options.dotColor}" font-family="Poppins" font-weight="800" font-size="21px" text-anchor="middle">${p.value}</text>`;
                }
            });

            const dPath       = `M${this.points[0].x},${this.points[0].y} ` + this.points.slice(1).map(p => `L${p.x},${p.y}`).join(' ');
            const strokeColor = this.options.hideLineAndDots ? 'transparent' : this.options.color;
            linesSVG += `<path class="graphLine" fill="none" stroke-linecap="round" stroke="${strokeColor}" stroke-width="4" stroke-miterlimit="10" d="${dPath}"/>`;

            let dots = '';
            this.points.forEach((p, i) => {
                xLabels += `<text x="${p.x}" y="${this.options.yBase + 30}">${p.label}</text>`;
                if (this.options.hideLineAndDots) {
                    dots += `<rect class="static-dot" data-index="${i}" x="${p.x - 25}" y="${p.y}" width="50" height="${this.options.yBase - p.y}" fill="transparent" style="cursor:pointer;"/>`;
                } else {
                    dots += `<circle class="static-dot" data-index="${i}" cx="${p.x}" cy="${p.y}" r="14" fill="transparent" style="cursor:pointer;"/>`;
                    dots += `<circle class="inner-dot" cx="${p.x}" cy="${p.y}" r="7" fill="${this.options.dotColor}" style="pointer-events:none;"/>`;
                }
            });

            const displayState = this.options.hideLineAndDots ? 'none' : 'block';
            interactionSVG += `
                <g class="interaction-group">
                    ${dots}
                    <g class="connectorGroup" style="display: ${displayState};"><line class="connector" x1="92" x2="92" y1="0" y2="0" stroke="#333" /></g>
                    <g class="box">
                        <g class="default-tooltip" style="display: ${this.options.hideLineAndDots ? 'none' : 'block'};">
                            <rect x="0" width="80" height="40" rx="20" ry="20" fill="#FFF" stroke="${this.options.color}" stroke-width="2"/>
                            <text class="boxLabel" x="40" y="28" fill="${this.options.dotColor}"></text>
                        </g>
                    </g>
                    <circle class="nullDot" fill="red" cx="0" cy="0" r="0"/>
                    <circle class="graphDot" fill="${this.options.dotColor}" cx="0" cy="0" r="10" stroke="#FFF" stroke-width="2" style="display: ${displayState};"/>
                    <circle class="dragger" fill="rgba(200,200,200,0.1)" cx="0" cy="0" r="15" stroke="rgba(200,200,200,0.15)" stroke-width="10" style="display: ${displayState};"/>
                </g>
            `;

            overlaysSVG = `<div class="custom-tooltip-overlay">
                <div class="box-html-content"></div>
            </div>`;
        }

        this.container.innerHTML = `
            <div class="comparison-graph-container">
                <svg class="mainSVG" viewBox="0 0 800 460" preserveAspectRatio="xMidYMid meet">
                    <defs>
                        <filter id="glow-${this.uid}" x="-100%" y="-100%" width="350%" height="350%" color-interpolation-filters="sRGB">
                            <feGaussianBlur stdDeviation="5" result="coloredBlur" />
                            <feOffset dx="0" dy="20" result="offsetblur"></feOffset>
                            <feFlood flood-color="#000" flood-opacity="0.123"></feFlood>
                            <feComposite in2="offsetblur" operator="in"></feComposite>
                            <feMerge>
                                <feMergeNode/><feMergeNode in="SourceGraphic"></feMergeNode>
                            </feMerge>
                        </filter>
                    </defs>
        
                    <text x="400" y="50" font-size="25" fill="#333" font-family="Poppins" font-weight="700" text-anchor="middle">${this.options.title}</text>
                    <g opacity="0.7" font-size="15" fill="#333" font-family="Poppins" font-weight="700" text-anchor="start">${yLabels}</g>
                    <g opacity="0.7" font-size="15" fill="#333" font-family="Poppins" font-weight="700" text-anchor="middle">${xLabels}</g>
        
                    <g class="bar-group">${barsSVG}</g>
                    <g class="bar-labels-group">${barLabelsSVG}</g>
        
                    <g fill="none" stroke="#999" stroke-miterlimit="10">${hLines}</g>
        
                    <g filter="url(#glow-${this.uid})">${linesSVG}</g>
                    ${interactionSVG}
                </svg>
                <div class="html-overlay-container">
                    ${overlaysSVG}
                </div>
            </div>
        `;
    }

    /* GSAP Initialization */

    initGSAP() {
        if (typeof gsap === 'undefined') return;
        gsap.registerPlugin(Draggable, MotionPathPlugin);

        this.introTimelines = [];

        // Resize observer to keep HTML overlays in sync with SVG scaling
        const graphContainer = this.container.querySelector('.comparison-graph-container');
        const overlayContainer = this.container.querySelector('.html-overlay-container');
        if (graphContainer && overlayContainer) {
            const ro = new ResizeObserver(entries => {
                for (let entry of entries) {
                    const ratio = entry.contentRect.width / 800;
                    gsap.set(overlayContainer, { scale: ratio });
                }
            });
            ro.observe(graphContainer);
        }

        const hLines = this.container.querySelectorAll('.horizontalLine');
        hLines.forEach(line => {
            const l = Math.ceil(line.getTotalLength());
            gsap.set(line, { strokeDasharray: l, strokeDashoffset: l });
        });

        const datasets = this.isMultiLine ? Object.keys(this.options.data) : ['default'];

        datasets.forEach(key => {
            const suffix       = this.isMultiLine ? `-${key}` : '';
            const lineSelector = this.isMultiLine ? `.graphLine-${key}` : '.graphLine';
            const pointsData   = this.isMultiLine ? this.options.data[key].mappedPoints : this.points;

            const els = {
                box:          this.container.querySelector(`.box${suffix}`),
                connector:    this.container.querySelector(`.connector${suffix}`),
                dragger:      this.container.querySelector(`.dragger${suffix}`),
                graphDot:     this.container.querySelector(`.graphDot${suffix}`),
                boxLabel:     this.container.querySelector(`.boxLabel${suffix}`),
                nullDot:      this.container.querySelector(`.nullDot${suffix}`),
                graphLine:    this.container.querySelector(lineSelector),
                clickDots:    this.container.querySelectorAll(`.static-dot${suffix}`),
                overlayEl:    this.container.querySelector(`.custom-tooltip-overlay${suffix}`),
            };

            els.tooltipInner = els.overlayEl.querySelector('.box-html-content');

            gsap.set(els.tooltipInner, {
                opacity: 0, scale: 0,
                transformOrigin: 'bottom center'
            });

            let boxPos             = { x: 0, y: 0 };
            let overlayPos         = { x: 0, y: 0 };
            let isPressed          = false;
            let activeDotIndex     = -1;
            let hasInteracted      = false;
            let currentTooltipHTML = null;

            gsap.set([els.graphDot, els.dragger], { opacity: 0 });

            const pathLength = Math.ceil(els.graphLine.getTotalLength());
            gsap.set(els.graphLine, { strokeDasharray: pathLength, strokeDashoffset: pathLength });

            const tl = gsap.timeline({ onUpdate: updateGraph, paused: true });
            tl.to([els.graphDot, els.dragger], {
                duration: 5,
                motionPath: { path: els.graphLine, align: els.graphLine, alignOrigin: [0.5, 0.5] },
                ease: 'none'
            });

            pointsData.forEach(p => {
                let closestLength = 0, smallestDiff = Infinity;
                for (let i = 0; i <= pathLength; i++) {
                    const pt   = els.graphLine.getPointAtLength(i);
                    const diff = Math.abs(pt.x - p.x);
                    if (diff < smallestDiff) { smallestDiff = diff; closestLength = i; }
                }
                p.progress = closestLength / pathLength;
            });

            gsap.set(els.nullDot, { x: pointsData[0].x });
            tl.progress(0.000001);

            const getProgressForX = (x) => {
                if (x <= pointsData[0].x) return pointsData[0].progress;
                if (x >= pointsData[pointsData.length - 1].x) return pointsData[pointsData.length - 1].progress;
                for (let i = 0; i < pointsData.length - 1; i++) {
                    const p1 = pointsData[i], p2 = pointsData[i + 1];
                    if (x >= p1.x && x <= p2.x) {
                        return p1.progress + ((x - p1.x) / (p2.x - p1.x)) * (p2.progress - p1.progress);
                    }
                }
                return 0;
            };

            const updateTimeline = () => {
                const xPos = gsap.getProperty(els.nullDot, 'x');
                gsap.to(tl, { duration: 0.3, progress: getProgressForX(xPos), overwrite: 'auto' });
            };

            function updateGraph() {
                const dX      = gsap.getProperty(els.dragger, 'x');
                const dY      = gsap.getProperty(els.dragger, 'y');
                const nearest = pointsData.reduce((prev, curr) =>
                    Math.abs(curr.x - dX) < Math.abs(prev.x - dX) ? curr : prev
                );

                if (nearest.tooltipHTML) {
                    els.box.querySelector('.default-tooltip').style.display = 'none';
                    els.overlayEl.style.display = 'block';
                    if (currentTooltipHTML !== nearest.tooltipHTML) {
                        els.tooltipInner.innerHTML = nearest.tooltipHTML;
                        currentTooltipHTML = nearest.tooltipHTML;
                    }

                    boxPos.x = dX - 45;
                    boxPos.y = nearest.y - 130;
                    overlayPos.x = dX - 45;
                    overlayPos.y = Math.max(8, nearest.y - 130);
                } else {
                    els.box.querySelector('.default-tooltip').style.display = 'block';
                    els.overlayEl.style.display = 'none';
                    els.boxLabel.textContent = nearest.value;
                    boxPos.x = dX - 40;
                    boxPos.y = dY - 70;
                }

                if (isPressed || activeDotIndex !== -1) {
                    gsap.to(els.box, {
                        duration: isPressed ? 1 : 0.4,
                        x: boxPos.x, y: boxPos.y,
                        ease: 'elastic.out(0.7, 0.7)', overwrite: 'auto'
                    });
                    gsap.to(els.overlayEl, {
                        duration: isPressed ? 1 : 0.4,
                        x: overlayPos.x, y: overlayPos.y,
                        ease: 'elastic.out(0.7, 0.7)', overwrite: 'auto'
                    });
                }
            }

            const graphPress = () => {
                isPressed = true;

                if (!hasInteracted) {
                    hasInteracted = true;
                    if (!this.options.hideLineAndDots) {
                        gsap.to([els.graphDot, els.dragger], { duration: 0.3, opacity: 1 });
                    }
                }

                gsap.to(els.dragger, { duration: 1, attr: { r: 30 }, ease: 'elastic.out(1, 0.7)' });
                updateGraph();

                if (gsap.getProperty(els.box, 'opacity') < 0.5) {
                    gsap.set(els.box, {
                        x: gsap.getProperty(els.dragger, 'x'),
                        y: gsap.getProperty(els.dragger, 'y'),
                        scale: 0, opacity: 0
                    });

                    gsap.set(els.overlayEl, {
                        x: gsap.getProperty(els.dragger, 'x'),
                        y: gsap.getProperty(els.dragger, 'y')
                    });
                    gsap.set(els.tooltipInner, { scale: 0, opacity: 0 });
                }

                gsap.to(els.box, {
                    duration: 0.8, scale: 1, opacity: 1,
                    x: boxPos.x, y: boxPos.y,
                    ease: 'power2.out', overwrite: 'auto'
                });

                gsap.to(els.overlayEl, {
                    duration: 0.8,
                    x: overlayPos.x, y: overlayPos.y,
                    ease: 'back.out(1.2)', overwrite: 'auto'
                });

                gsap.to(els.tooltipInner, {
                    duration: 0.8, scale: 1, opacity: 1,
                    ease: 'back.out(1.2)', overwrite: 'auto'
                });
            };

            const graphRelease = (closeLabel = true) => {
                isPressed = false;
                gsap.to(els.dragger, { duration: 0.3, attr: { r: 15 }, ease: 'elastic.out(0.7, 0.7)' });

                const nearest = pointsData.reduce((prev, curr) =>
                    Math.abs(curr.x - gsap.getProperty(els.nullDot, 'x')) < Math.abs(prev.x - gsap.getProperty(els.nullDot, 'x')) ? curr : prev
                );

                if (closeLabel) {
                    gsap.to(els.box, {
                        duration: 0.8, scale: 0, opacity: 0,
                        x: gsap.getProperty(els.dragger, 'x'),
                        y: gsap.getProperty(els.dragger, 'y'),
                        ease: 'back.in(1.2)', overwrite: 'auto'
                    });

                    if (els.overlayEl.style.display !== 'none') {
                        gsap.to(els.tooltipInner, {
                            duration: 0.8, scale: 0, opacity: 0,
                            ease: 'back.in(1.2)', overwrite: 'auto',
                            onComplete: () => { els.overlayEl.style.display = 'none'; }
                        });
                    }
                    activeDotIndex = -1;
                } else {
                    activeDotIndex = pointsData.indexOf(nearest);
                }

                gsap.to(els.nullDot, { duration: 0.4, x: nearest.x, onUpdate: () => updateTimeline() });
            };

            const connectLine = () => {
                if (isPressed || activeDotIndex !== -1) {
                    gsap.set(els.connector, {
                        attr: {
                            x1: gsap.getProperty(els.box, 'x') + (els.overlayEl.style.display === 'block' ? 45 : 40),
                            x2: gsap.getProperty(els.dragger, 'x'),
                            y1: gsap.getProperty(els.box, 'y') + 40,
                            y2: gsap.getProperty(els.graphDot, 'y')
                        }
                    });
                } else {
                    const dx = gsap.getProperty(els.graphDot, 'x');
                    const dy = gsap.getProperty(els.graphDot, 'y');
                    gsap.to(els.connector, { duration: 0.1, attr: { x1: dx, x2: dx, y1: dy, y2: dy } });
                }
            };

            Draggable.create(els.nullDot, {
                type: 'x', trigger: els.dragger,
                bounds: { minX: this.options.xStart, maxX: this.options.xEnd },
                onPress:     () => graphPress(),
                onDrag:      () => updateTimeline(),
                onDragEnd:   () => graphRelease(false),
                onClick: () => {
                    if (activeDotIndex !== -1) {
                        graphRelease(true);
                    } else {
                        const currentX = gsap.getProperty(els.nullDot, 'x');
                        const nearest  = pointsData.reduce((prev, curr) =>
                            Math.abs(curr.x - currentX) < Math.abs(prev.x - currentX) ? curr : prev
                        );
                        activeDotIndex = pointsData.indexOf(nearest);
                        gsap.to(els.nullDot, { duration: 0.4, x: nearest.x, onUpdate: () => updateTimeline() });
                        graphPress();
                    }
                },
                onThrowUpdate: () => updateTimeline()
            });

            gsap.ticker.add(connectLine);
            graphRelease(true);

            els.clickDots.forEach((dot, i) => {
                dot.addEventListener('click', () => {
                    if (activeDotIndex === i) {
                        graphRelease(true);
                    } else {
                        activeDotIndex = i;
                        gsap.to(els.nullDot, { duration: 0.5, x: pointsData[i].x, onUpdate: () => updateTimeline() });
                        graphPress();
                    }
                });
            });

            const introTl = gsap.timeline({ paused: true });
            this.introTimelines.push(introTl);

            introTl.to(els.graphLine, { duration: 2.3, strokeDashoffset: 0, ease: 'power3.inOut' }, 0);

            if (!this.options.hideLineAndDots) {
                introTl.from(this.container.querySelectorAll('.inner-dot'), {
                    duration: 0.5, attr: { r: 0 }, ease: 'elastic.out(1, 0.7)', stagger: 0.05
                }, 0.5);
            }

            let barDelay = 0.2;
            for (let stackIndex = 0; stackIndex < 10; stackIndex++) {
                const stackBars = this.container.querySelectorAll(`.bar-rect.stack-${stackIndex}`);
                if (stackBars.length > 0) {
                    introTl.from(stackBars, {
                        duration: 0.45, scaleY: 0, transformOrigin: 'bottom center',
                        stagger: 0.05, ease: 'power2.out'
                    }, barDelay);
                    barDelay += 0.3;
                }
            }

            const barLabels = this.container.querySelectorAll('.bar-label');
            if (barLabels.length > 0) {
                introTl.from(barLabels, {
                    duration: 0.6, opacity: 0, y: '+=15', stagger: 0.05, ease: 'back.out(1.5)'
                }, barDelay - 0.2);
            }
        });

        const bgTl = gsap.timeline({ paused: true });
        this.introTimelines.push(bgTl);

        bgTl.to(hLines, { duration: 1, strokeDashoffset: 0, opacity: 0.4, stagger: 0.1 }, 0)
            .from(this.container.querySelectorAll('.yLabel'), { duration: 1, opacity: 0, stagger: 0.1 }, 0);

        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setTimeout(() => { this.introTimelines.forEach(tl => tl.play()); }, 250);
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });

        observer.observe(this.container);
    }
}