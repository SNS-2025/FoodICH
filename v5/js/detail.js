// ===========================
// FOOD DETAIL PAGE - v5 弧形环幕布局
// 左右独立循环动画 + 中间遮罩窗口
// ===========================

function getDishIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('dish') || 'claypot';
}

let modelPreview = null;
const detailModelConfig = {
    'claypot': '../models/claypot-rice.fbx',
    'steam-buns': '../models/meat-bun.fbx',
    'hakka-tofu': '../models/garden-tofu.fbx',
    'healthy-ribs': '../models/healthy-ribs.fbx',
    'stir-fried-beef': '../models/spicy-ribs.fbx',
    'preserved-veg-pork': '../models/preserved-veg-pork.fbx',
    'vermicelli-shrimp': '../models/vermicelli-shrimp.fbx'
};

// 动画状态管理
let animationState = {
    leftTrack: null,
    rightTrack: null,
    isRunning: false
};

document.addEventListener('DOMContentLoaded', function () {
    const dishId = getDishIdFromURL();
    const dish = typeof dishData !== 'undefined' ? dishData[dishId] : null;

    if (!dish) {
        document.body.innerHTML = '<div style="color:#fff;padding:40px;font-family:sans-serif">Dish not found. <a href="index.html" style="color:#4a90d9">Go back</a></div>';
        return;
    }

    populatePage(dish);
    initModelStage(dishId);
});

function populatePage(dish) {
    // 填充标题卡片
    setEl('titleCardZh', dish.title);
    setEl('titleCardEn', dish.subtitle);

    // 填充描述
    const titleDesc = document.getElementById('titleDesc');
    if (titleDesc) {
        titleDesc.innerHTML = dish.description.map(p => `<p>${p}</p>`).join('');
    }

    // 分配内容到左右两栏
    const mediaItems = Array.isArray(dish.mediaItems) ? dish.mediaItems : [];
    const displayItems = Array.isArray(dish.displayItems) ? dish.displayItems : [];
    const galleryItems = Array.isArray(dish.galleryItems) ? dish.galleryItems : [];
    const videoItems = Array.isArray(dish.videoItems) && dish.videoItems.length > 0
        ? dish.videoItems
        : mediaItems.filter(item => item.type === 'video');

    // 左侧：实拍内容
    const realityItems = [
        ...displayItems.map(item => ({ ...item, type: 'image', category: 'reality' })),
        ...videoItems.map(item => ({ ...item, category: 'reality' }))
    ];

    // 右侧：AI生成内容
    const aiItems = galleryItems.map(item => ({ ...item, category: 'ai' }));

    initArcTracks(realityItems, aiItems);
    initLightbox();
}

function setEl(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

// ===========================
// 弧形轨道初始化
// ===========================

function initArcTracks(realityItems, aiItems) {
    const leftTrack = document.getElementById('realityTrack');
    const rightTrack = document.getElementById('aiTrack');

    if (!leftTrack || !rightTrack) return;

    // 创建左侧流动项（从左外进入，向中间移动，消失后重新开始）
    const leftElements = createArcItems(realityItems, 'reality');
    leftTrack.innerHTML = leftElements;

    // 创建右侧流动项（从中间滑出，向右外移动，消失后重新开始）
    const rightElements = createArcItems(aiItems, 'ai');
    rightTrack.innerHTML = rightElements;

    // 启动动画
    startArcAnimation(leftTrack, rightTrack, realityItems, aiItems);
}

function createArcItems(items, category) {
    if (items.length === 0) {
        return '<div class="empty-state">暂无内容</div>';
    }

    return items.map((item, index) => {
        const isVideo = item.type === 'video';
        const videoAttrs = isVideo
            ? 'muted loop playsinline onmouseenter="this.play()" onmouseleave="this.pause();this.currentTime=0;"'
            : '';

        return `
            <div class="arc-item"
                 data-src="${item.src}"
                 data-alt="${item.alt}"
                 data-type="${isVideo ? 'video' : 'image'}"
                 data-index="${index}"
                 onclick="${category === 'ai' ? 'openAIExplanation(this)' : 'openRealityExplanation(this)'}">
                ${isVideo
                    ? `<video src="${item.src}" alt="${item.alt}" ${videoAttrs}></video>`
                    : `<img src="${item.src}" alt="${item.alt}" loading="lazy">`
                }
            </div>
        `;
    }).join('');
}

// ===========================
// 弧形流动动画
// ===========================

function startArcAnimation(leftTrack, rightTrack, realityItems, aiItems) {
    if (animationState.isRunning) return;
    animationState.isRunning = true;

    // 动画参数
    const config = {
        itemHeight: 220,      // 每个项的高度
        gap: 30,              // 项之间的间距
        speed: 0.8,           // 移动速度 (px/frame)
        viewportHeight: window.innerHeight,
        centerZoneStart: 0.35,  // 中间区域开始位置 (相对视口比例)
        centerZoneEnd: 0.65,    // 中间区域结束位置
        decelerationZone: 0.1   // 中间区域减速范围
    };

    const leftItems = leftTrack.querySelectorAll('.arc-item');
    const rightItems = rightTrack.querySelectorAll('.arc-item');

    // 初始化左侧轨道（从左外滑入）
    let leftOffset = -config.viewportHeight; // 从屏幕上方外侧开始

    // 初始化右侧轨道（从中间开始）
    let rightOffset = 0; // 从中间开始

    function animate() {
        if (!animationState.isRunning) return;

        // 左侧：从上往下（左外→中间→下外→循环）
        leftOffset += config.speed;
        const leftTotalHeight = realityItems.length * (config.itemHeight + config.gap);
        if (leftOffset > config.viewportHeight + leftTotalHeight) {
            leftOffset = -leftTotalHeight;
        }
        updateLeftTrack(leftItems, leftOffset, config);

        // 右侧：从中间往下（中间→右外→循环）
        rightOffset += config.speed;
        const rightTotalHeight = aiItems.length * (config.itemHeight + config.gap);
        if (rightOffset > config.viewportHeight + rightTotalHeight) {
            rightOffset = -rightTotalHeight;
        }
        updateRightTrack(rightItems, rightOffset, config);

        requestAnimationFrame(animate);
    }

    // 启动动画循环
    animate();

    // 保存动画状态
    animationState.leftTrack = { track: leftTrack, items: leftItems, config };
    animationState.rightTrack = { track: rightTrack, items: rightItems, config };
}

function updateLeftTrack(items, offset, config) {
    items.forEach((item, index) => {
        const baseY = offset + index * (config.itemHeight + config.gap);
        const centerY = baseY + config.itemHeight / 2;

        // 计算在视口中的位置 (0-1)
        const normalizedY = centerY / config.viewportHeight;

        // 中间区域清晰，边缘淡化
        const inCenter = normalizedY >= config.centerZoneStart && normalizedY <= config.centerZoneEnd;

        // 透明度：中间区域为1，边缘渐变到0.4
        let opacity = 1;
        if (!inCenter) {
            const distanceFromCenter = normalizedY < config.centerZoneStart
                ? config.centerZoneStart - normalizedY
                : normalizedY - config.centerZoneEnd;
            opacity = Math.max(0.4, 1 - distanceFromCenter * 1.5);
        }

        // 弧形效果：轻微旋转、缩放和透视
        const rotationAngle = (normalizedY - 0.5) * 20; // -10° 到 10°
        const scale = inCenter ? 1 : Math.max(0.75, 0.85 + (1 - Math.abs(normalizedY - 0.5) * 2) * 0.15);
        const translateZ = inCenter ? 50 : 0;

        // 应用变换
        item.style.transform = `
            translateY(${baseY}px)
            translateZ(${translateZ}px)
            rotateX(${rotationAngle}deg)
            scale(${scale})
        `;
        item.style.opacity = opacity;

        // 中间区域添加发光效果
        if (inCenter) {
            item.style.filter = 'drop-shadow(0 0 40px rgba(255,107,107,0.4)) brightness(1.1)';
            item.style.zIndex = '10';
        } else {
            item.style.filter = 'brightness(0.9)';
            item.style.zIndex = '1';
        }
    });
}

function updateRightTrack(items, offset, config) {
    items.forEach((item, index) => {
        const baseY = offset + index * (config.itemHeight + config.gap);
        const centerY = baseY + config.itemHeight / 2;

        // 计算在视口中的位置 (0-1)
        const normalizedY = centerY / config.viewportHeight;

        // 中间区域清晰，边缘淡化
        const inCenter = normalizedY >= config.centerZoneStart && normalizedY <= config.centerZoneEnd;

        // 透明度
        let opacity = 1;
        if (!inCenter) {
            const distanceFromCenter = normalizedY < config.centerZoneStart
                ? config.centerZoneStart - normalizedY
                : normalizedY - config.centerZoneEnd;
            opacity = Math.max(0.4, 1 - distanceFromCenter * 1.5);
        }

        // 弧形效果：反向旋转
        const rotationAngle = (normalizedY - 0.5) * -20;
        const scale = inCenter ? 1 : Math.max(0.75, 0.85 + (1 - Math.abs(normalizedY - 0.5) * 2) * 0.15);
        const translateZ = inCenter ? 50 : 0;

        item.style.transform = `
            translateY(${baseY}px)
            translateZ(${translateZ}px)
            rotateX(${rotationAngle}deg)
            scale(${scale})
        `;
        item.style.opacity = opacity;

        if (inCenter) {
            item.style.filter = 'drop-shadow(0 0 40px rgba(255,107,107,0.4)) brightness(1.1)';
            item.style.zIndex = '10';
        } else {
            item.style.filter = 'brightness(0.9)';
            item.style.zIndex = '1';
        }
    });
}

// ===========================
// 实拍素材解释浮层
// ===========================

function openRealityExplanation(element) {
    const overlay = document.getElementById('aiExplanationOverlay');
    const img = document.getElementById('aiExplanationImg');
    const title = document.getElementById('aiExplanationTitle');
    const desc = document.getElementById('aiExplanationDesc');

    if (!overlay || !title || !desc) return;

    if (img) img.style.display = 'none';

    const alt = element.dataset.alt || '';
    const type = element.dataset.type || 'image';

    title.textContent = alt;
    desc.textContent = getRealityExplanation(alt, type);

    const rect = element.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    overlay.style.display = 'block';

    requestAnimationFrame(() => {
        const overlayRect = overlay.getBoundingClientRect();
        let left, top;

        left = rect.left + rect.width / 2 - overlayRect.width / 2;
        left = Math.max(20, Math.min(left, viewportWidth - overlayRect.width - 20));

        if (rect.bottom + overlayRect.height + 20 < viewportHeight) {
            top = rect.bottom + 12;
        } else if (rect.top - overlayRect.height - 20 > 0) {
            top = rect.top - overlayRect.height - 12;
        } else {
            top = (viewportHeight - overlayRect.height) / 2;
        }

        overlay.style.left = left + 'px';
        overlay.style.top = top + 'px';
        overlay.classList.add('active');
    });
}

function getRealityExplanation(alt, type) {
    const typeText = type === 'video' ? '实拍视频' : '实拍照片';

    const explanations = {
        '腊肠特写': '这是一张精心拍摄的腊肠特写照片，展现了传统腊肠独特的质感和诱人的油润光泽。通过专业摄影技术，真实记录了腊肠的纹理和色彩细节。',
        '煲仔饭': '实拍煲仔饭成品，展示了传统烹饪工艺的精髓。米饭颗粒分明，腊肠切片均匀，整体呈现出诱人的色泽和香气。',
        '制作过程': '记录了传统美食制作的真实过程，捕捉了烹饪中的关键步骤。火候的掌控、食材的搭配都在镜头下一览无余。',
    };

    return explanations[alt] || `这是一张${typeText}，真实记录了传统美食的制作过程或成品。通过镜头，我们捕捉了食物最真实的质感、色彩和细节，展现了传统烹饪文化的魅力。`;
}

// ===========================
// AI解释浮层
// ===========================

function openAIExplanation(element) {
    const overlay = document.getElementById('aiExplanationOverlay');
    const img = document.getElementById('aiExplanationImg');
    const title = document.getElementById('aiExplanationTitle');
    const desc = document.getElementById('aiExplanationDesc');

    if (!overlay || !title || !desc) return;

    if (img) img.style.display = 'none';

    title.textContent = element.dataset.alt || 'AI Generated Image';
    desc.textContent = getAIExplanation(element.dataset.alt);

    const rect = element.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    overlay.style.display = 'block';

    requestAnimationFrame(() => {
        const overlayRect = overlay.getBoundingClientRect();
        let left, top;

        left = rect.left + rect.width / 2 - overlayRect.width / 2;
        left = Math.max(20, Math.min(left, viewportWidth - overlayRect.width - 20));

        if (rect.bottom + overlayRect.height + 20 < viewportHeight) {
            top = rect.bottom + 12;
        } else if (rect.top - overlayRect.height - 20 > 0) {
            top = rect.top - overlayRect.height - 12;
        } else {
            top = (viewportHeight - overlayRect.height) / 2;
        }

        overlay.style.left = left + 'px';
        overlay.style.top = top + 'px';
        overlay.classList.add('active');
    });
}

function closeAIExplanation() {
    const overlay = document.getElementById('aiExplanationOverlay');
    const img = document.getElementById('aiExplanationImg');
    if (overlay) {
        overlay.classList.remove('active');
        setTimeout(() => {
            overlay.style.display = 'none';
            if (img) img.style.display = '';
        }, 300);
    }
}

function getAIExplanation(alt) {
    const explanations = {
        '腊肠特写': 'AI生成的腊肠特写图像，展现了传统腊肠的质感和色泽。通过深度学习模型，AI重现了腊肠独特的纹理和诱人的油润光泽，体现了传统食材的魅力。',
        '煲仔饭': 'AI视角下的煲仔饭，融合了传统烹饪艺术与现代生成技术。图像展现了米饭的颗粒感、腊肠的切片形态以及整体的蒸汽氛围。',
        '制作过程': 'AI捕捉的制作过程瞬间，通过生成式模型重现了传统烹饪的动态美。火光、蒸汽、锅气被AI以独特的艺术视角呈现。',
    };

    return explanations[alt] || '这张AI生成图像通过先进的生成模型，以独特的艺术视角重新诠释了传统美食文化。AI学习了数千张美食图像，捕捉了食物的质感、光影和色彩，创造出既真实又具有艺术感的视觉作品。';
}

// ===========================
// 3D模型加载
// ===========================

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
    scene.fog = new THREE.Fog(0x000000, 35, 120);

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.set(0, 2, 22);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const existingCanvas = stage.querySelector('canvas');
    if (existingCanvas) existingCanvas.remove();
    stage.appendChild(renderer.domElement);

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.8;
    controls.target.set(0, 0, 0);

    // 灯光
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(50, 50, 50);
    directionalLight.castShadow = true;
    const pointLight1 = new THREE.PointLight(0xff6b6b, 0.5, 100);
    pointLight1.position.set(20, 20, 20);
    const pointLight2 = new THREE.PointLight(0x4ecdc4, 0.5, 100);
    pointLight2.position.set(-20, -20, 20);

    scene.add(ambientLight, directionalLight, pointLight1, pointLight2);

    // 底部阴影
    const baseShadow = new THREE.Mesh(
        new THREE.CircleGeometry(6.5, 64),
        new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.15
        })
    );
    baseShadow.rotation.x = -Math.PI / 2;
    baseShadow.position.y = -5.8;
    scene.add(baseShadow);

    setModelStatus('Loading 3D model...', false);

    const loader = new THREE.FBXLoader();
    loader.load(modelPath, function(object) {
        object.scale.setScalar(0.08);
        object.rotation.x = Math.PI * 40 / 180;

        object.traverse(function(child) {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                if (child.material) {
                    const mats = Array.isArray(child.material) ? child.material : [child.material];
                    mats.forEach(mat => {
                        if (mat.map) {
                            mat.map.flipY = true;
                            mat.map.needsUpdate = true;
                        }
                        mat.needsUpdate = true;
                    });
                }
            }
        });

        const box = new THREE.Box3().setFromObject(object);
        const center = box.getCenter(new THREE.Vector3());
        object.position.sub(center);
        object.position.y = -1;

        scene.add(object);
        setModelStatus('', true);

        modelPreview = {
            stage,
            renderer,
            camera,
            scene,
            controls,
            object,
            resize() {
                const width = stage.clientWidth || 320;
                const height = stage.clientHeight || 320;
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
            object.position.y = -1 + Math.sin(time * 0.8) * 0.5;
            object.rotation.y += 0.01;
            controls.update();
            renderer.render(scene, camera);
        }

        animate();
    }, undefined, function(error) {
        const message = error && error.message ? error.message : 'Failed to load 3D model';
        setModelStatus(message, false);
    });
}

// ===========================
// Lightbox
// ===========================

function initLightbox() {
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox-overlay';
    lightbox.id = 'lightboxOverlay';
    lightbox.innerHTML = '<img id="lightboxImg" src="" alt="" />';
    document.body.appendChild(lightbox);

    lightbox.addEventListener('click', () => {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeAIExplanation();
            const lightbox = document.getElementById('lightboxOverlay');
            if (lightbox) {
                lightbox.classList.remove('active');
                document.body.style.overflow = '';
            }
        }
    });

    document.addEventListener('click', function(e) {
        const overlay = document.getElementById('aiExplanationOverlay');
        if (overlay && overlay.classList.contains('active')) {
            const isClickOnOverlay = overlay.contains(e.target);
            const isClickOnAIItem = e.target.closest('.arc-item');

            if (!isClickOnOverlay && !isClickOnAIItem) {
                closeAIExplanation();
            }
        }
    });
}

// ===========================
// 窗口resize处理
// ===========================

window.addEventListener('resize', debounce(function() {
    if (modelPreview) {
        modelPreview.resize();
    }
    if (typeof window.resizeParticleCanvas === 'function') {
        window.resizeParticleCanvas();
    }
    // 更新动画配置中的视口高度
    if (animationState.leftTrack) {
        animationState.leftTrack.config.viewportHeight = window.innerHeight;
    }
    if (animationState.rightTrack) {
        animationState.rightTrack.config.viewportHeight = window.innerHeight;
    }
}, 300));

function debounce(fn, delay) {
    let timer;
    return function(...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

// ===========================
// 粒子背景系统
// ===========================

(function initDetailParticles() {
    const canvas = document.getElementById('detail-particle-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    const palette = [
        [255, 107, 107],
        [255, 46,  143],
        [255, 144, 33],
        [148, 237, 92],
        [254, 202, 87],
        [255, 159, 243],
        [186, 234, 169],
        [74,  144, 217],
    ];

    let W, H;
    let particles = [];
    let animId;

    function resize() {
        W = canvas.width  = window.innerWidth;
        H = canvas.height = window.innerHeight;
    }

    window.resizeParticleCanvas = resize;

    function createParticles() {
        particles = [];
        const count = Math.floor((W * H) / 6000);
        for (let i = 0; i < count; i++) {
            const col = palette[Math.floor(Math.random() * palette.length)];
            particles.push({
                x:    Math.random() * W,
                y:    Math.random() * H,
                r:    Math.random() * 1.8 + 0.4,
                vx:   (Math.random() - 0.5) * 0.35,
                vy:   (Math.random() - 0.5) * 0.35,
                col:  col,
                a:    Math.random() * 0.5 + 0.15,
                pulse: Math.random() * Math.PI * 2,
                pulseSpeed: Math.random() * 0.02 + 0.005
            });
        }
    }

    function draw() {
        ctx.clearRect(0, 0, W, H);

        particles.forEach(p => {
            p.pulse += p.pulseSpeed;
            const alpha = p.a + Math.sin(p.pulse) * 0.12;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${p.col[0]},${p.col[1]},${p.col[2]},${alpha})`;
            ctx.fill();

            p.x += p.vx;
            p.y += p.vy;

            if (p.x < -5)  p.x = W + 5;
            if (p.x > W+5) p.x = -5;
            if (p.y < -5)  p.y = H + 5;
            if (p.y > H+5) p.y = -5;
        });

        animId = requestAnimationFrame(draw);
    }

    resize();
    createParticles();
    draw();
})();
