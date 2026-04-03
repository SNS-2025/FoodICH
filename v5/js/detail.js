function getDishIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('dish') || 'claypot';
}

const detailModelConfig = {
    'claypot': '../models/claypot-rice.fbx',
    'steam-buns': '../models/meat-bun.fbx',
    'hakka-tofu': '../models/garden-tofu.fbx',
    'healthy-ribs': '../models/healthy-ribs.fbx',
    'stir-fried-beef': '../models/spicy-ribs.fbx',
    'preserved-veg-pork': '../models/preserved-veg-pork.fbx',
    'vermicelli-shrimp': '../models/vermicelli-shrimp.fbx'
};

const detailAssetManifest = {
    'claypot': {
        folder: 'claypot-rice',
        reality: ['lachang.png', 'paigu.png', 'wodanniu.png'],
        videos: ['VID20241112204313.mp4', 'VID20241112204653.mp4'],
        ai: ['caihong.png', 'taiguo.png', 'xingkong.png']
    },
    'steam-buns': {
        folder: 'steamed-buns',
        reality: ['baozi.png'],
        videos: ['fen_DJI_0003.mp4', 'ya_DJI_0006.mp4', 'bao_DJI_0044.mp4', 'steam_DJI_0050.mp4'],
        ai: ['1.png', '2.png', '3.png', '4.png', '5.png', '6.png']
    },
    'hakka-tofu': {
        folder: 'hakka-tofu',
        reality: ['1.jpg', '2.jpg', '3.jpg', '4.jpg', '5.jpg', '6.jpg', '7.jpg', '8.jpg'],
        videos: ['VID20241215111124.mp4', 'VID20241215111137.mp4', 'cut_VID20241215110009.mp4', 'fry_VID20241215111725.mp4'],
        ai: ['1.png', '1-1.jpg', '2.png', '3.png', '4.png', '5.png', '6.png']
    },
    'healthy-ribs': {
        folder: 'healthy-ribs',
        reality: ['1.png', '2.png', '3.png', '4.png', '5.png', '6.png', '7.png'],
        videos: ['videoplayback.mp4'],
        ai: ['1.jpg', '2.png', '3.png', '4.png', '5.png']
    },
    'stir-fried-beef': {
        folder: 'spicy-ribs',
        reality: ['xiaochaohuangniu.png'],
        videos: ['videoplayback.mp4'],
        ai: ['1.png', '2.png', '3.png', '4.png', '5.png', '6.png', '7.png', '8.png', '9.png', '10.png', '12.png']
    },
    'preserved-veg-pork': {
        folder: 'preserved-veg-pork',
        reality: ['1.png', '2.png', '3.png', '4.png', '5.png', '6.png', '7.png'],
        videos: ['videoplayback.mp4'],
        ai: ['1.png', '2.png', '3.png', '4.png', '5.png', '6.png', '7.png', '8.png']
    },
    'vermicelli-shrimp': {
        folder: 'vermicelli-shrimp',
        reality: ['1.png', '2.JPG', '3.JPG', '4.png', '5.JPG', '6.png', '7.png', '8.png', '9.png', '10.png', '11.png', '12.png', '13.png'],
        videos: ['videoplayback.mp4'],
        ai: ['1.png', '2.png', '3.png', '4.png', '5.png', '6.png']
    }
};

const fallbackDishMeta = {
    'claypot': { number: '(01)', title: '煲仔飯', subtitle: 'Clay Pot Rice', location: 'Guangdong · Hong Kong' },
    'steam-buns': { number: '(02)', title: '流汁湯包', subtitle: 'Steam Buns', location: 'Jiangnan · China' },
    'hakka-tofu': { number: '(03)', title: '客家釀豆腐', subtitle: 'Hakka Stuffed Tofu', location: 'Hakka · Guangdong' },
    'healthy-ribs': { number: '(04)', title: '瀏陽蒸排骨', subtitle: 'Liuyang Steamed Ribs', location: 'Liuyang · Hunan' },
    'stir-fried-beef': { number: '(05)', title: '小炒黃牛肉', subtitle: 'Stir-fried Yellow Beef', location: 'Hunan · Wok Stir-fry' },
    'preserved-veg-pork': { number: '(06)', title: '梅菜豬肉', subtitle: 'Preserved Veg Pork', location: 'Hakka · Preserved Flavour' },
    'vermicelli-shrimp': { number: '(07)', title: '粉絲蝦煲', subtitle: 'Vermicelli Shrimp', location: 'Cantonese · Seafood Pot' }
};

const experienceState = {
    dishId: '',
    dish: null,
    realityTrack: null,
    aiTrack: null,
    rafId: 0,
    lastTimestamp: 0,
    pauseReasons: new Set(),
    isPaused: false,
    noteItem: null,
    noteRequestId: 0,
    mdCache: new Map(),
    noteHideTimer: 0,
    particleLoop: null,
    particleResize: null,
    foodMDData: null
};

let modelPreview = null;

function parseFoodMD(raw) {
    const text = String(raw || '');
    const sections = [];
    const headingPattern = /^#\s+(.+?)(?:\s+([\w\s&;]+))?\s*$/gm;
    const headings = [];
    let match;

    while ((match = headingPattern.exec(text)) !== null) {
        headings.push({
            index: match.index,
            titleZh: match[1].trim(),
            titleEn: (match[2] || '').trim()
        });
    }

    for (var i = 0; i < headings.length; i++) {
        var h = headings[i];
        var start = h.index + match[0].length;
        var end = i < headings.length - 1 ? headings[i + 1].index : text.length;
        var bodyText = text.slice(start, end).trim();
        var paragraphs = bodyText.split(/\n\n+/).map(function (p) { return p.trim(); }).filter(Boolean);

        var dishId = resolveDishId(h.titleZh);
        sections.push({
            dishId: dishId,
            title: h.titleZh,
            subtitle: h.titleEn || '',
            description: paragraphs
        });
    }

    return sections;
}

function resolveDishId(titleZh) {
    var map = {
        '煲仔飯': 'claypot',
        '客家釀豆腐': 'hakka-tofu',
        '流汁湯包': 'steam-buns',
        '瀏陽蒸排骨': 'healthy-ribs',
        '小炒黃牛肉': 'stir-fried-beef',
        '梅菜豬肉': 'preserved-veg-pork',
        '粉絲蝦煲': 'vermicelli-shrimp'
    };
    return map[titleZh] || '';
}

function getFoodMDDish(dishId) {
    if (!experienceState.foodMDData || !Array.isArray(experienceState.foodMDData)) return null;
    return experienceState.foodMDData.find(function (d) { return d.dishId === dishId; }) || null;
}

document.addEventListener('DOMContentLoaded', function () {
    const dishId = getDishIdFromURL();

    fetch('../food/food.MD')
        .then(function (response) { return response.text(); })
        .then(function (raw) {
            experienceState.foodMDData = parseFoodMD(raw);
        })
        .catch(function () { experienceState.foodMDData = null; })
        .finally(function () {
            const dish = buildDishDetail(dishId);
            if (!dish) { renderMissingDish(); return; }
            experienceState.dishId = dishId;
            experienceState.dish = dish;
            populatePage(dish);
            bindGlobalInteractions();
            buildArcTracks(dish);
            initModelStage(dishId);
            initDetailParticles();
            startArcAnimation();
        });
});

function buildDishDetail(dishId) {
    const manifest = detailAssetManifest[dishId];
    const foodMDDish = getFoodMDDish(dishId);
    const baseMeta = (typeof dishData !== 'undefined' && dishData[dishId]) ? dishData[dishId] : fallbackDishMeta[dishId];

    if (!manifest && !baseMeta) {
        return null;
    }

    const meta = {
        ...(fallbackDishMeta[dishId] || {}),
        ...(baseMeta || {})
    };

    // 优先从 food.MD 获取标题和描述
    if (foodMDDish) {
        if (foodMDDish.title) meta.title = foodMDDish.title;
        if (foodMDDish.subtitle) meta.subtitle = foodMDDish.subtitle;
        if (Array.isArray(foodMDDish.description) && foodMDDish.description.length) {
            meta.description = foodMDDish.description;
        }
    }

    const realityItems = manifest
        ? createMaterialItems({
            dish: meta,
            side: 'reality',
            folder: manifest.folder,
            files: manifest.reality,
            type: 'image',
            folderName: 'Reality'
        })
        : [];

    const videoItems = manifest
        ? createMaterialItems({
            dish: meta,
            side: 'reality',
            folder: manifest.folder,
            files: manifest.videos,
            type: 'video',
            folderName: 'video'
        })
        : [];

    const aiItems = manifest
        ? createMaterialItems({
            dish: meta,
            side: 'ai',
            folder: manifest.folder,
            files: manifest.ai,
            type: 'image',
            folderName: 'AI'
        })
        : [];

    const fallbackVisual = meta.coverImage
        ? createFallbackVisual(meta.coverImage, meta, 'reality')
        : null;

    const finalRealityItems = realityItems.length || videoItems.length
        ? [...realityItems, ...videoItems]
        : (fallbackVisual ? [fallbackVisual] : []);

    const finalAiItems = aiItems.length
        ? aiItems
        : (fallbackVisual ? [createFallbackVisual(meta.coverImage, meta, 'ai')] : []);

    return {
        ...meta,
        realityItems: finalRealityItems,
        aiItems: finalAiItems,
        assetFolder: manifest ? manifest.folder : ''
    };
}

function createFallbackVisual(src, dish, side) {
    return {
        baseId: `${side}-fallback`,
        side,
        type: 'image',
        src,
        mdSrc: null,
        displayIndex: '01',
        moduleTitle: 'Frame 01',
        noteTitle: side === 'reality' ? 'Reality Frame 01' : 'AI Frame 01',
        sideTag: side === 'reality' ? 'REALITY' : 'AI VISION',
        fallbackBody: createFallbackBody({ side, type: 'image' }, dish)
    };
}

function createMaterialItems(config) {
    const files = Array.isArray(config.files) ? config.files : [];
    const dish = config.dish || {};
    const side = config.side;
    const folder = config.folder;
    const folderName = config.folderName;
    const type = config.type;

    return files.map(function (filename, index) {
        const displayIndex = String(index + 1).padStart(2, '0');
        const basePath = `../food/${folder}/${folderName}`;
        const stem = getFileStem(filename);
        const src = `${basePath}/${filename}`;
        const mdSrc = type === 'video' ? null : `${basePath}/${stem}.md`;
        const moduleLabel = type === 'video' ? `Clip ${displayIndex}` : `Frame ${displayIndex}`;

        return {
            baseId: `${side}-${stem || index + 1}`,
            side,
            type,
            src,
            mdSrc,
            displayIndex,
            moduleTitle: moduleLabel,
            noteTitle: `${side === 'reality' ? 'Reality' : 'AI'} ${moduleLabel}`,
            sideTag: side === 'reality' ? 'REALITY' : 'AI VISION',
            fallbackBody: createFallbackBody({ side, type }, dish)
        };
    });
}

function createFallbackBody(item, dish) {
    const dishTitle = dish && dish.title ? dish.title : '這道菜';
    const summary = buildSummary(dish && dish.description ? dish.description : []);

    if (item.side === 'reality' && item.type === 'video') {
        return `${dishTitle} 的真實片段保留了現場節奏、火候與手勢，讓材料與工序的時間感被看見。\n\n${summary}`;
    }

    if (item.side === 'reality') {
        return `${dishTitle} 左側的真實素材保留了食材、工序與日常技藝的細節，作為整個頁面的傳承基座。\n\n${summary}`;
    }

    return `${dishTitle} 右側的 AI 素材不是取代，而是沿著真實烹飪線索延展出新的想像與版本，讓傳統被重新觀看。\n\n${summary}`;
}

function getFileStem(filename) {
    return String(filename || '').replace(/\.[^.]+$/, '');
}

function populatePage(dish) {
    setText('detailKicker', '');
    setText('detailBadge', dish.title || '');
    setText('titleCardZh', dish.title || '');
    setText('titleCardEn', dish.subtitle || '');
    setText('detailLocation', dish.location || '');
    setText('titleDesc', buildSummary(dish.description || []));
}

function renderInfoCards(dish) {
    const container = document.getElementById('detailInfo');
    if (!container) return;

    const counts = getDishCounts(dish);
    const cards = [
        {
            label: 'Origin',
            value: findInfoValue(dish.info, ['Origin']) || dish.location || 'Living archive'
        },
        {
            label: 'Reality',
            value: `${counts.realityImages} Frames${counts.realityVideos ? ` · ${counts.realityVideos} Clips` : ''}`
        },
        {
            label: 'AI',
            value: `${counts.aiImages} Generated Views`
        }
    ];

    container.innerHTML = cards.map(function (card) {
        return `
            <div class="core-stat">
                <span class="core-stat-label">${escapeHtml(card.label)}</span>
                <span class="core-stat-value">${escapeHtml(card.value)}</span>
            </div>
        `;
    }).join('');
}

function getDishCounts(dish) {
    const realityItems = Array.isArray(dish.realityItems) ? dish.realityItems : [];
    const aiItems = Array.isArray(dish.aiItems) ? dish.aiItems : [];

    return {
        realityImages: realityItems.filter(function (item) { return item.type === 'image'; }).length,
        realityVideos: realityItems.filter(function (item) { return item.type === 'video'; }).length,
        aiImages: aiItems.filter(function (item) { return item.type === 'image'; }).length
    };
}

function findInfoValue(info, labels) {
    if (!Array.isArray(info)) return '';
    const labelSet = new Set((labels || []).map(function (label) { return label.toLowerCase(); }));
    const match = info.find(function (item) {
        return item && item.label && labelSet.has(String(item.label).toLowerCase());
    });
    return match && match.value ? match.value : '';
}

function buildSummary(description) {
    const paragraphs = Array.isArray(description) ? description.filter(Boolean) : [];
    const preferred = paragraphs.filter(function (text) {
        return /[\u3400-\u9fff]/.test(text);
    });
    const chosen = (preferred.length ? preferred : paragraphs).slice(0, 2);
    return chosen.join('\n\n');
}

function buildArcTracks(dish) {
    const realityTrackEl = document.getElementById('realityTrack');
    const aiTrackEl = document.getElementById('aiTrack');

    if (!realityTrackEl || !aiTrackEl) return;

    experienceState.realityTrack = createTrackState(realityTrackEl, 'reality', dish.realityItems, dish);
    experienceState.aiTrack = createTrackState(aiTrackEl, 'ai', dish.aiItems, dish);

    applyTrackLayout(experienceState.realityTrack, false);
    applyTrackLayout(experienceState.aiTrack, false);
    renderTrackInstantly(experienceState.realityTrack);
    renderTrackInstantly(experienceState.aiTrack);
}

function createTrackState(trackEl, side, sourceItems, dish) {
    const instances = prepareTrackInstances(sourceItems, side);
    trackEl.innerHTML = instances.map(renderModuleMarkup).join('');

    const nodes = Array.from(trackEl.querySelectorAll('.arc-module'));
    const laneOrders = [0, 0];
    const states = nodes.map(function (node, index) {
        const lane = index % 2;
        const laneOrder = laneOrders[lane]++;
        const media = instances[index];
        const img = node.querySelector('img');
        const video = node.querySelector('video');

        if (img) {
            img.addEventListener('error', function () {
                img.src = createPlaceholderImage(media.sideTag, media.moduleTitle);
                img.alt = media.noteTitle;
            });
        }

        if (video) {
            video.pause();
        }

        const state = {
            id: media.instanceId,
            node,
            media,
            lane,
            laneOrder,
            x: 0,
            t: 0,
            focusStrength: 0,
            video,
            isVideoPlaying: false
        };

        bindModuleInteractions(state);
        return state;
    });

    return {
        side,
        dish,
        el: trackEl,
        states,
        layout: null
    };
}

function prepareTrackInstances(items, side) {
    const sourceItems = Array.isArray(items) && items.length ? items : [];
    const targetCount = sourceItems.length < 4 ? 8 : 6;
    const instances = sourceItems.map(function (item, index) {
        return {
            ...item,
            instanceId: `${item.baseId}-base-${index}`
        };
    });

    if (!sourceItems.length) {
        return instances;
    }

    const repeatPool = sourceItems.filter(function (item) {
        return item.type !== 'video';
    });
    const clonePool = repeatPool.length ? repeatPool : sourceItems;
    let pointer = 0;

    while (instances.length < targetCount) {
        const source = clonePool[pointer % clonePool.length];
        instances.push({
            ...source,
            instanceId: `${source.baseId}-clone-${pointer + 1}`
        });
        pointer += 1;
    }

    return side === 'reality' ? instances : instances;
}

function renderModuleMarkup(item) {
    const isVideo = item.type === 'video';
    const mediaMarkup = isVideo
        ? `<video src="${escapeAttr(item.src)}" muted loop playsinline preload="metadata"></video>`
        : `<img src="${escapeAttr(item.src)}" alt="${escapeAttr(item.noteTitle)}" loading="lazy">`;

    return `
        <button
            type="button"
            class="arc-module ${isVideo ? 'is-video' : 'is-image'}"
            data-instance-id="${escapeAttr(item.instanceId)}"
            data-side="${escapeAttr(item.side)}"
            aria-label="${escapeAttr(item.noteTitle)}">
            <div class="arc-module-content">${mediaMarkup}</div>
            <div class="arc-module-title">${escapeHtml(item.moduleTitle)}</div>
            <div class="arc-module-label">
                <span class="arc-module-tag">${escapeHtml(item.sideTag)}</span>
                <span class="arc-module-index">No. ${escapeHtml(item.displayIndex)}</span>
            </div>
        </button>
    `;
}

function bindModuleInteractions(moduleState) {
    moduleState.node.addEventListener('pointerenter', function () {
        setPauseReason('hover', true);
    });

    moduleState.node.addEventListener('pointerleave', function () {
        setPauseReason('hover', false);
    });

    moduleState.node.addEventListener('click', function (event) {
        event.stopPropagation();

        if (experienceState.noteItem && experienceState.noteItem.id === moduleState.id && isNoteVisible()) {
            closeMaterialNote();
            return;
        }

        openMaterialNote(moduleState);
    });
}

function applyTrackLayout(trackState, preserveProgress) {
    if (!trackState || !trackState.el) return;

    const previousLayout = trackState.layout;
    const progressSnapshot = previousLayout
        ? trackState.states.map(function (state) {
            return clamp((state.x - previousLayout.startX) / (previousLayout.endX - previousLayout.startX), 0, 1);
        })
        : [];

    const probe = trackState.states[0] ? trackState.states[0].node : null;
    const moduleSize = probe ? probe.offsetWidth : 160;
    const width = trackState.el.clientWidth || 320;
    const height = trackState.el.clientHeight || 400;
    const spacing = Math.max(moduleSize * 1.18, 178);
    const startX = trackState.side === 'reality' ? -moduleSize * 1.18 : -moduleSize * 0.72;
    const endX = trackState.side === 'reality'
        ? width - moduleSize * 0.12
        : width + moduleSize * 1.06;

    trackState.layout = {
        width,
        height,
        moduleSize,
        spacing,
        startX,
        endX,
        laneY: [height * 0.34, height * 0.58],
        travel: endX - startX,
        speed: width < 700 ? 44 : 34
    };

    trackState.states.forEach(function (state, index) {
        const laneOffset = state.lane * spacing * 0.35;

        if (preserveProgress && previousLayout) {
            const progress = progressSnapshot[index] || 0;
            state.x = trackState.layout.startX + progress * trackState.layout.travel;
            return;
        }

        state.x = trackState.layout.startX - (state.laneOrder * spacing) - laneOffset;
    });
}

function renderTrackInstantly(trackState) {
    if (!trackState || !trackState.layout) return;
    trackState.states.forEach(function (state) {
        applyModuleTransform(state, trackState.layout, trackState.side);
    });
}

function startArcAnimation() {
    cancelAnimationFrame(experienceState.rafId);
    experienceState.lastTimestamp = 0;

    function frame(timestamp) {
        if (!experienceState.lastTimestamp) {
            experienceState.lastTimestamp = timestamp;
        }

        const delta = Math.min(0.05, (timestamp - experienceState.lastTimestamp) / 1000);
        experienceState.lastTimestamp = timestamp;

        if (!experienceState.isPaused) {
            updateTrack(experienceState.realityTrack, delta);
            updateTrack(experienceState.aiTrack, delta);
        }

        experienceState.rafId = requestAnimationFrame(frame);
    }

    experienceState.rafId = requestAnimationFrame(frame);
}

function updateTrack(trackState, delta) {
    if (!trackState || !trackState.layout) return;

    const laneStates = [[], []];

    trackState.states.forEach(function (state) {
        laneStates[state.lane].push(state);
        state.x += trackState.layout.speed * delta;
    });

    laneStates.forEach(function (laneGroup) {
        laneGroup.forEach(function (state) {
            if (state.x <= trackState.layout.endX) return;

            const minLaneX = laneGroup.reduce(function (minimum, candidate) {
                return Math.min(minimum, candidate === state ? Number.POSITIVE_INFINITY : candidate.x);
            }, Number.POSITIVE_INFINITY);

            state.x = Number.isFinite(minLaneX)
                ? minLaneX - trackState.layout.spacing
                : trackState.layout.startX;
        });
    });

    trackState.states.forEach(function (state) {
        applyModuleTransform(state, trackState.layout, trackState.side);
    });
}

function applyModuleTransform(state, layout, side) {
    const t = clamp((state.x - layout.startX) / layout.travel, 0, 1);
    const eased = easeInOutCubic(t);
    const moduleSize = layout.moduleSize;
    const laneBase = layout.laneY[state.lane];
    const curveDirection = side === 'reality' ? 1 : -1;
    const curveWave = Math.sin(t * Math.PI) * 18 * (state.lane === 0 ? -1 : 1) * curveDirection;
    const centerY = laneBase + curveWave;
    const y = centerY - (moduleSize / 2);

    let scale;
    let translateZ;
    let rotateY;
    let opacity;
    let brightness;
    let focusStrength;

    if (side === 'reality') {
        const focus = bellCurve(t, 0.82, 0.22);
        scale = lerp(1.16, 0.72, eased);
        translateZ = lerp(220, -170, eased);
        rotateY = lerp(-58, 26, eased);
        opacity = clamp((0.36 + (1 - t) * 0.28) + focus * 0.42, 0.18, 1);
        brightness = 0.74 + (1 - t) * 0.12 + focus * 0.26;
        focusStrength = focus;
    } else {
        const focus = bellCurve(t, 0.16, 0.2);
        const edgeFade = 1 - smoothstep(0.74, 1.02, t) * 0.78;
        scale = lerp(0.72, 1.16, eased);
        translateZ = lerp(-170, 220, eased);
        rotateY = lerp(58, -26, eased);
        opacity = clamp((0.24 + t * 0.14 + focus * 0.64) * edgeFade, 0.14, 1);
        brightness = 0.76 + t * 0.1 + focus * 0.28;
        focusStrength = focus;
    }

    const rotateX = state.lane === 0 ? 7 : -7;
    const x = state.x;

    state.t = t;
    state.focusStrength = focusStrength;

    state.node.style.transform = `
        translate3d(${x}px, ${y}px, ${translateZ}px)
        rotateY(${rotateY}deg)
        rotateX(${rotateX}deg)
        scale(${scale})
    `;
    state.node.style.opacity = opacity.toFixed(3);
    state.node.style.filter = `brightness(${brightness.toFixed(3)}) saturate(${(0.94 + focusStrength * 0.18).toFixed(3)})`;
    state.node.style.zIndex = String(Math.round(400 + translateZ));
    state.node.classList.toggle('is-muted', focusStrength < 0.22);

    syncVideoPlayback(state);
}

function syncVideoPlayback(state) {
    if (!state.video) return;

    const shouldPlay = !experienceState.isPaused && state.focusStrength > 0.15 && state.t > 0.04 && state.t < 0.96;

    if (shouldPlay === state.isVideoPlaying) return;

    state.isVideoPlaying = shouldPlay;

    if (shouldPlay) {
        const playPromise = state.video.play();
        if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(function () {});
        }
        return;
    }

    state.video.pause();
}

function pauseAllVideos() {
    getAllModuleStates().forEach(function (state) {
        if (!state.video) return;
        state.video.pause();
        state.isVideoPlaying = false;
    });
}

function getAllModuleStates() {
    const states = [];
    if (experienceState.realityTrack) {
        states.push.apply(states, experienceState.realityTrack.states);
    }
    if (experienceState.aiTrack) {
        states.push.apply(states, experienceState.aiTrack.states);
    }
    return states;
}

function openMaterialNote(moduleState) {
    const note = document.getElementById('materialNote');
    const sideEl = document.getElementById('materialNoteSide');
    const indexEl = document.getElementById('materialNoteIndex');
    const titleEl = document.getElementById('materialNoteTitle');
    const bodyEl = document.getElementById('materialNoteBody');

    if (!note || !sideEl || !indexEl || !titleEl || !bodyEl) return;

    clearTimeout(experienceState.noteHideTimer);
    markActiveModule(moduleState);
    experienceState.noteItem = moduleState;

    sideEl.textContent = moduleState.media.side === 'reality'
        ? 'Reality / 真實素材'
        : 'AI Vision / 生成素材';
    indexEl.textContent = `${moduleState.media.type === 'video' ? 'Clip' : 'Frame'} ${moduleState.media.displayIndex}`;
    titleEl.textContent = moduleState.media.noteTitle;
    bodyEl.textContent = 'Loading note...';

    note.hidden = false;
    note.classList.remove('is-visible');
    positionMaterialNote(moduleState.node);

    requestAnimationFrame(function () {
        note.classList.add('is-visible');
    });

    setPauseReason('note', true);

    const requestId = ++experienceState.noteRequestId;
    resolveMaterialCopy(moduleState.media).then(function (copy) {
        if (requestId !== experienceState.noteRequestId) return;
        if (!experienceState.noteItem || experienceState.noteItem.id !== moduleState.id) return;

        titleEl.textContent = copy.title;
        bodyEl.textContent = copy.body;
        positionMaterialNote(moduleState.node);
    });
}

function closeMaterialNote() {
    const note = document.getElementById('materialNote');
    if (!note) return;

    experienceState.noteRequestId += 1;
    experienceState.noteItem = null;
    unmarkActiveModules();
    setPauseReason('note', false);
    note.classList.remove('is-visible');

    clearTimeout(experienceState.noteHideTimer);
    experienceState.noteHideTimer = window.setTimeout(function () {
        note.hidden = true;
    }, 280);
}

function isNoteVisible() {
    const note = document.getElementById('materialNote');
    return Boolean(note && !note.hidden && note.classList.contains('is-visible'));
}

function positionMaterialNote(anchor) {
    const note = document.getElementById('materialNote');
    const activeItem = experienceState.noteItem;
    if (!note || !anchor || !activeItem) return;

    note.style.left = '-9999px';
    note.style.top = '-9999px';

    const rect = anchor.getBoundingClientRect();
    const noteRect = note.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const gap = 18;
    let left;
    let top;

    if (viewportWidth < 900) {
        left = Math.max(14, (viewportWidth - noteRect.width) / 2);
        top = Math.max(14, viewportHeight - noteRect.height - 16);
    } else {
        left = activeItem.media.side === 'reality'
            ? rect.right + gap
            : rect.left - noteRect.width - gap;

        if (left < 18 || left + noteRect.width > viewportWidth - 18) {
            left = rect.left + (rect.width / 2) - (noteRect.width / 2);
        }

        top = rect.top + (rect.height / 2) - (noteRect.height / 2);
    }

    left = clamp(left, 18, viewportWidth - noteRect.width - 18);
    top = clamp(top, 18, viewportHeight - noteRect.height - 18);

    note.style.left = `${left}px`;
    note.style.top = `${top}px`;
}

async function resolveMaterialCopy(media) {
    if (!media.mdSrc) {
        return {
            title: media.noteTitle,
            body: media.fallbackBody
        };
    }

    if (experienceState.mdCache.has(media.mdSrc)) {
        return experienceState.mdCache.get(media.mdSrc);
    }

    const pending = fetch(media.mdSrc)
        .then(function (response) {
            if (!response.ok) {
                throw new Error(`Failed to load ${media.mdSrc}`);
            }
            return response.text();
        })
        .then(function (raw) {
            return parseMaterialCopy(raw, media.noteTitle, media.fallbackBody);
        })
        .catch(function () {
            return {
                title: media.noteTitle,
                body: media.fallbackBody
            };
        });

    experienceState.mdCache.set(media.mdSrc, pending);
    return pending;
}

function parseMaterialCopy(raw, fallbackTitle, fallbackBody) {
    const lines = String(raw || '')
        .replace(/\r/g, '')
        .split('\n')
        .map(function (line) { return line.trim(); })
        .filter(Boolean);

    if (!lines.length) {
        return {
            title: fallbackTitle,
            body: fallbackBody
        };
    }

    const titleCandidate = lines[0];
    const hasStandaloneTitle = lines.length >= 3 && titleCandidate.length <= 36;
    const title = hasStandaloneTitle ? titleCandidate : fallbackTitle;
    const bodyLines = hasStandaloneTitle ? lines.slice(1) : lines;
    const body = bodyLines.join('\n\n') || fallbackBody;

    return { title, body };
}

function bindGlobalInteractions() {
    const closeBtn = document.getElementById('materialNoteClose');

    if (closeBtn) {
        closeBtn.addEventListener('click', function (event) {
            event.stopPropagation();
            closeMaterialNote();
        });
    }

    document.addEventListener('click', function (event) {
        if (!isNoteVisible()) return;
        if (event.target.closest('.material-note')) return;
        if (event.target.closest('.arc-module')) return;
        closeMaterialNote();
    });

    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
            closeMaterialNote();
        }
    });

    window.addEventListener('resize', debounce(function () {
        if (experienceState.realityTrack) {
            applyTrackLayout(experienceState.realityTrack, true);
            renderTrackInstantly(experienceState.realityTrack);
        }

        if (experienceState.aiTrack) {
            applyTrackLayout(experienceState.aiTrack, true);
            renderTrackInstantly(experienceState.aiTrack);
        }

        if (experienceState.noteItem) {
            positionMaterialNote(experienceState.noteItem.node);
        }

        if (modelPreview) {
            modelPreview.resize();
        }

        if (typeof experienceState.particleResize === 'function') {
            experienceState.particleResize();
        }
    }, 140));
}

function setPauseReason(reason, active) {
    const sizeBefore = experienceState.pauseReasons.size;

    if (active) {
        experienceState.pauseReasons.add(reason);
    } else {
        experienceState.pauseReasons.delete(reason);
    }

    if (experienceState.pauseReasons.size === sizeBefore) {
        return;
    }

    const paused = experienceState.pauseReasons.size > 0;
    experienceState.isPaused = paused;
    document.body.classList.toggle('is-paused', paused);

    if (paused) {
        pauseAllVideos();
    }

    experienceState.lastTimestamp = 0;
}

function markActiveModule(moduleState) {
    unmarkActiveModules();
    moduleState.node.classList.add('is-active');
}

function unmarkActiveModules() {
    getAllModuleStates().forEach(function (state) {
        state.node.classList.remove('is-active');
    });
}

function renderMissingDish() {
    document.body.innerHTML = `
        <div style="padding:40px;color:#fff;font-family:var(--font-sans, sans-serif);background:#090807;min-height:100vh;">
            Dish not found. <a href="index.html" style="color:#feca57;">Go back</a>
        </div>
    `;
}

function getModelPath(dishId) {
    return detailModelConfig[dishId] || '';
}

function setModelStatus(text, hidden) {
    const statusEl = document.getElementById('winModelStatus');
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.classList.toggle('is-hidden', Boolean(hidden));
}

function initModelStage(dishId) {
    const stage = document.getElementById('winModelStage');
    const modelPath = getModelPath(dishId);

    if (!stage) return;

    if (typeof THREE === 'undefined' || typeof THREE.FBXLoader === 'undefined' || typeof THREE.OrbitControls === 'undefined') {
        setModelStatus('3D runtime unavailable', false);
        return;
    }

    if (!modelPath) {
        setModelStatus('No 3D model for this dish', false);
        return;
    }

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x000000, 32, 105);

    const camera = new THREE.PerspectiveCamera(44, 1, 0.1, 1000);
    camera.position.set(0, 2.6, 22);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const existingCanvas = stage.querySelector('canvas');
    if (existingCanvas) {
        existingCanvas.remove();
    }

    stage.appendChild(renderer.domElement);

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.7;
    controls.minDistance = 12;
    controls.maxDistance = 42;
    controls.target.set(0, 0, 0);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.18);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.3);
    directionalLight.position.set(30, 40, 30);
    directionalLight.castShadow = true;
    const pointLight1 = new THREE.PointLight(0xff6b6b, 0.45, 120);
    pointLight1.position.set(18, 16, 20);
    const pointLight2 = new THREE.PointLight(0xfeca57, 0.34, 120);
    pointLight2.position.set(-18, -12, 18);

    scene.add(ambientLight, directionalLight, pointLight1, pointLight2);

    const baseShadow = new THREE.Mesh(
        new THREE.CircleGeometry(6.2, 64),
        new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.16
        })
    );
    baseShadow.rotation.x = -Math.PI / 2;
    baseShadow.position.y = -6.1;
    scene.add(baseShadow);

    setModelStatus('Loading 3D model...', false);

    const loader = new THREE.FBXLoader();
    loader.load(modelPath, function (object) {
        object.scale.setScalar(0.08);
        object.rotation.x = Math.PI * 40 / 180;

        object.traverse(function (child) {
            if (!child.isMesh) return;
            child.castShadow = true;
            child.receiveShadow = true;

            if (!child.material) return;
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            materials.forEach(function (material) {
                if (material.map) {
                    material.map.flipY = true;
                    material.map.needsUpdate = true;
                }
                material.needsUpdate = true;
            });
        });

        const box = new THREE.Box3().setFromObject(object);
        const center = box.getCenter(new THREE.Vector3());
        object.position.sub(center);
        object.position.y = -1.4;

        scene.add(object);
        setModelStatus('', true);

        modelPreview = {
            stage,
            renderer,
            camera,
            scene,
            controls,
            object,
            resize: function () {
                const width = stage.clientWidth || 240;
                const height = stage.clientHeight || 240;
                renderer.setSize(width, height);
                camera.aspect = width / height;
                camera.updateProjectionMatrix();
                controls.update();
            }
        };

        modelPreview.resize();

        function animate() {
            if (!modelPreview) return;
            requestAnimationFrame(animate);

            const time = Date.now() * 0.001;
            object.position.y = -1.4 + Math.sin(time * 0.85) * 0.4;
            object.rotation.y += 0.008;
            controls.update();
            renderer.render(scene, camera);
        }

        animate();
    }, undefined, function (error) {
        const message = error && error.message ? error.message : 'Failed to load 3D model';
        setModelStatus(message, false);
    });
}

function initDetailParticles() {
    const canvas = document.getElementById('detail-particle-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const palette = [
        [255, 107, 107],
        [255, 144, 33],
        [254, 202, 87],
        [148, 237, 92],
        [255, 159, 243]
    ];

    let width = 0;
    let height = 0;
    let particles = [];
    let rafId = 0;

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        particles = createParticles(width, height, palette);
    }

    function draw() {
        ctx.clearRect(0, 0, width, height);

        particles.forEach(function (particle) {
            particle.phase += particle.phaseSpeed;
            const alpha = particle.alpha + Math.sin(particle.phase) * 0.08;

            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${particle.color[0]}, ${particle.color[1]}, ${particle.color[2]}, ${alpha})`;
            ctx.fill();

            particle.x += particle.vx;
            particle.y += particle.vy;

            if (particle.x < -8) particle.x = width + 8;
            if (particle.x > width + 8) particle.x = -8;
            if (particle.y < -8) particle.y = height + 8;
            if (particle.y > height + 8) particle.y = -8;
        });

        rafId = requestAnimationFrame(draw);
        experienceState.particleLoop = rafId;
    }

    resize();
    draw();

    experienceState.particleResize = resize;
}

function createParticles(width, height, palette) {
    const count = Math.max(90, Math.floor((width * height) / 18000));
    const particles = [];

    for (let index = 0; index < count; index += 1) {
        const color = palette[index % palette.length];
        particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            radius: Math.random() * 1.8 + 0.3,
            vx: (Math.random() - 0.5) * 0.22,
            vy: (Math.random() - 0.5) * 0.22,
            color,
            alpha: Math.random() * 0.25 + 0.08,
            phase: Math.random() * Math.PI * 2,
            phaseSpeed: Math.random() * 0.018 + 0.004
        });
    }

    return particles;
}

function createPlaceholderImage(tag, label) {
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="480" height="480" viewBox="0 0 480 480">
            <defs>
                <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#2b1d1d"/>
                    <stop offset="100%" stop-color="#0d0a09"/>
                </linearGradient>
            </defs>
            <rect width="480" height="480" rx="48" fill="url(#g)"/>
            <circle cx="240" cy="180" r="88" fill="rgba(255,255,255,0.06)"/>
            <text x="240" y="326" text-anchor="middle" fill="#f3e7df" font-family="Arial, sans-serif" font-size="24" letter-spacing="2">${escapeSvg(tag)}</text>
            <text x="240" y="360" text-anchor="middle" fill="#c9b9ac" font-family="Arial, sans-serif" font-size="18">${escapeSvg(label)}</text>
        </svg>
    `;

    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = value || '';
}

function debounce(fn, delay) {
    let timer = 0;
    return function () {
        const args = arguments;
        const context = this;
        window.clearTimeout(timer);
        timer = window.setTimeout(function () {
            fn.apply(context, args);
        }, delay);
    };
}

function lerp(start, end, amount) {
    return start + (end - start) * amount;
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function easeInOutCubic(value) {
    return value < 0.5
        ? 4 * value * value * value
        : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

function bellCurve(value, center, spread) {
    const distance = (value - center) / spread;
    return Math.exp(-(distance * distance));
}

function smoothstep(edge0, edge1, x) {
    const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
}

function escapeHtml(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function escapeAttr(value) {
    return escapeHtml(value);
}

function escapeSvg(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
