// ===========================
// FOOD DETAIL PAGE - v5 现代艺术布局
// 三栏布局：左侧实拍 | 中间3D+标题 | 右侧AI
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

    // 左侧：实拍内容（displayItems + videoItems）
    const realityItems = [
        ...displayItems.map(item => ({ ...item, type: 'image', category: 'reality' })),
        ...videoItems.map(item => ({ ...item, category: 'reality' }))
    ];

    // 右侧：AI生成内容（galleryItems）
    const aiItems = galleryItems.map(item => ({ ...item, category: 'ai' }));

    initRealityGrid(realityItems);
    initAIGrid(aiItems);

    initLightbox();
}

function setEl(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

// ===========================
// 左侧实拍内容网格
// ===========================

function initRealityGrid(items) {
    const grid = document.getElementById('realityGrid');
    if (!grid) return;

    if (items.length === 0) {
        grid.innerHTML = '<div class="empty-state">暂无实拍素材</div>';
        return;
    }

    grid.innerHTML = items.map((item, index) => {
        // 改进的尺寸分配策略 - 更有设计感
        let sizeClass = '';
        const itemCount = items.length;

        // 根据数量动态调整布局策略
        if (itemCount <= 3) {
            // 少量图片：第一张large，其他normal
            if (index === 0) sizeClass = 'large';
        } else if (itemCount <= 6) {
            // 中等数量：第一张tall，第三张wide
            if (index === 0) sizeClass = 'tall';
            else if (index === 2) sizeClass = 'wide';
        } else {
            // 较多数量：使用pattern增加变化
            // Pattern: tall, normal, normal, wide, normal, tall, ...
            const pattern = index % 6;
            if (pattern === 0) sizeClass = 'tall';
            else if (pattern === 3) sizeClass = 'wide';
        }

        if (item.type === 'video') {
            return `
                <div class="masonry-item ${sizeClass}"
                     data-src="${item.src}"
                     data-alt="${item.alt}"
                     data-type="video"
                     onclick="openRealityExplanation(this)">
                    <video src="${item.src}" alt="${item.alt}" muted loop playsinline
                           onmouseenter="this.play()" onmouseleave="this.pause();this.currentTime=0;"></video>
                </div>
            `;
        } else {
            return `
                <div class="masonry-item ${sizeClass}"
                     data-src="${item.src}"
                     data-alt="${item.alt}"
                     data-type="image"
                     onclick="openRealityExplanation(this)">
                    <img src="${item.src}" alt="${item.alt}" loading="lazy">
                </div>
            `;
        }
    }).join('');
}

// ===========================
// 实拍素材解释浮层
// ===========================

function openRealityExplanation(element) {
    // 复用AI解释的浮层结构
    const overlay = document.getElementById('aiExplanationOverlay');
    const img = document.getElementById('aiExplanationImg');
    const title = document.getElementById('aiExplanationTitle');
    const desc = document.getElementById('aiExplanationDesc');

    if (!overlay || !title || !desc) return;

    // 隐藏图片（CSS已经隐藏了，这里确保不显示）
    if (img) img.style.display = 'none';

    const alt = element.dataset.alt || '';
    const type = element.dataset.type || 'image';

    title.textContent = alt;
    desc.textContent = getRealityExplanation(alt, type);

    // 获取点击图片的位置
    const rect = element.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // 设置浮层位置
    overlay.style.display = 'block';

    // 等待一帧让浏览器计算浮层尺寸
    requestAnimationFrame(() => {
        const overlayRect = overlay.getBoundingClientRect();
        let left, top;

        // 水平居中
        left = rect.left + rect.width / 2 - overlayRect.width / 2;

        // 确保不超出屏幕左右边界
        left = Math.max(20, Math.min(left, viewportWidth - overlayRect.width - 20));

        // 垂直方向：优先显示在图片下方，空间不够则显示在上方
        if (rect.bottom + overlayRect.height + 20 < viewportHeight) {
            top = rect.bottom + 12;
        } else if (rect.top - overlayRect.height - 20 > 0) {
            top = rect.top - overlayRect.height - 12;
        } else {
            // 如果上下都不够，就居中显示
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
// 右侧AI内容网格
// ===========================

function initAIGrid(items) {
    const grid = document.getElementById('aiGrid');
    if (!grid) return;

    if (items.length === 0) {
        grid.innerHTML = '<div class="empty-state">暂无AI生成图像</div>';
        return;
    }

    grid.innerHTML = items.map((item, index) => {
        // 改进的尺寸分配 - 与左侧对称但有变化
        let sizeClass = '';
        const itemCount = items.length;

        if (itemCount <= 3) {
            // 少量图片：第二张large，其他normal
            if (index === 1) sizeClass = 'large';
        } else if (itemCount <= 6) {
            // 中等数量：第二张tall，第五张wide
            if (index === 1) sizeClass = 'tall';
            else if (index === 4) sizeClass = 'wide';
        } else {
            // 较多数量：使用pattern（与左侧错开）
            const pattern = index % 6;
            if (pattern === 2) sizeClass = 'tall';
            else if (pattern === 5) sizeClass = 'wide';
        }

        return `
            <div class="masonry-item ai-item ${sizeClass}"
                 data-src="${item.src}"
                 data-alt="${item.alt}"
                 onclick="openAIExplanation(this)">
                <img src="${item.src}" alt="${item.alt}" loading="lazy">
            </div>
        `;
    }).join('');
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

    // 隐藏图片元素
    if (img) img.style.display = 'none';

    title.textContent = element.dataset.alt || 'AI Generated Image';
    desc.textContent = getAIExplanation(element.dataset.alt);

    // 获取点击图片的位置
    const rect = element.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // 设置浮层位置
    overlay.style.display = 'block';

    // 等待一帧让浏览器计算浮层尺寸
    requestAnimationFrame(() => {
        const overlayRect = overlay.getBoundingClientRect();
        let left, top;

        // 水平居中
        left = rect.left + rect.width / 2 - overlayRect.width / 2;

        // 确保不超出屏幕左右边界
        left = Math.max(20, Math.min(left, viewportWidth - overlayRect.width - 20));

        // 垂直方向：优先显示在图片下方，空间不够则显示在上方
        if (rect.bottom + overlayRect.height + 20 < viewportHeight) {
            top = rect.bottom + 12;
        } else if (rect.top - overlayRect.height - 20 > 0) {
            top = rect.top - overlayRect.height - 12;
        } else {
            // 如果上下都不够，就居中显示
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
        // 等待动画完成后隐藏
        setTimeout(() => {
            overlay.style.display = 'none';
            // 重置图片显示状态
            if (img) img.style.display = '';
        }, 300);
    }
}

function getAIExplanation(alt) {
    // 简单的解释文本生成逻辑
    // 实际项目中可以从数据中读取更详细的说明
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
// Lightbox（用于实拍图片）
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

    // 点击浮层外部关闭AI解释
    document.addEventListener('click', function(e) {
        const overlay = document.getElementById('aiExplanationOverlay');
        if (overlay && overlay.classList.contains('active')) {
            // 检查点击是否在浮层或AI图片上
            const isClickOnOverlay = overlay.contains(e.target);
            const isClickOnAIItem = e.target.closest('.ai-item');

            if (!isClickOnOverlay && !isClickOnAIItem) {
                closeAIExplanation();
            }
        }
    });
}

function openLightbox(src, alt) {
    const lightbox = document.getElementById('lightboxOverlay');
    const lightboxImg = document.getElementById('lightboxImg');
    if (!lightbox || !lightboxImg || !src) return;

    lightboxImg.src = src;
    lightboxImg.alt = alt || '';
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
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
