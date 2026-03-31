// ===========================
// FOOD DETAIL PAGE
// 可拖动浮动窗口系统
// Updated: 2026-03-05 v4.1
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

    const desktopLabel = document.getElementById('desktopLabel');
    if (desktopLabel) desktopLabel.textContent = dish.subtitle.toUpperCase();

    populatePage(dish);
    initLightbox();
    initModelStage(dishId);
});

function populatePage(dish) {
    setEl('titleCardNumber', dish.number);
    setEl('titleCardZh', dish.title);
    setEl('titleCardEn', dish.subtitle);
    setEl('titleCardLocation', dish.location);

    const mediaItems = Array.isArray(dish.mediaItems) ? dish.mediaItems : [];
    const displayItems = Array.isArray(dish.displayItems) ? dish.displayItems : [];
    const galleryItems = Array.isArray(dish.galleryItems) ? dish.galleryItems : [];
    const videoItems = Array.isArray(dish.videoItems) && dish.videoItems.length > 0
        ? dish.videoItems
        : mediaItems.filter(item => item.type === 'video');

    const videoSrc = document.getElementById('winVideoSrc');
    const videoEl = document.getElementById('winVideo');
    if (videoItems.length > 0 && videoSrc && videoEl) {
        videoSrc.src = '';
        videoEl.preload = 'none';
        videoEl.src = videoItems[0].src;
        setEl('winVideoTitle', '視頻');
    } else {
        const winVideo = document.getElementById('win-video');
        if (winVideo) winVideo.style.display = 'none';
    }

    setEl('winDisplayTitle', '圖片展示');
    setEl('winGalleryTitle', '圖集');

    const descContent = document.getElementById('winDescContent');
    if (descContent) {
        descContent.innerHTML = `
            <h3>${dish.title} — ${dish.subtitle}</h3>
            ${dish.description.map(p => `<p>${p}</p>`).join('')}
        `;
    }

    const galleryGrid = document.getElementById('winGalleryGrid');
    if (galleryGrid) {
        galleryGrid.innerHTML = '';
    }

    initDisplayWall(displayItems);
    initRealityGallery(galleryItems);

    const infoCard = document.getElementById('winInfoCard');
    if (infoCard) {
        infoCard.innerHTML = buildFragments(dish, displayItems, galleryItems, videoItems);
    }
}

function setEl(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function buildFragments(dish, displayItems, galleryItems, videoItems) {
    const fragments = [
        { label: 'Dish', value: dish.title },
        { label: 'Location', value: dish.location },
        { label: 'Display', value: `${displayItems.length}` },
        { label: 'Gallery', value: `${galleryItems.length}` },
        { label: 'Videos', value: `${videoItems.length}` },
        ...dish.info.map(item => ({ label: item.label, value: item.value, large: item.large }))
    ];

    if (videoItems.length > 0) {
        videoItems.slice(0, 3).forEach((item, index) => {
            fragments.push({
                label: `Clip ${String(index + 1).padStart(2, '0')}`,
                value: item.alt
            });
        });
    } else if (dish.description[0]) {
        fragments.push({
            label: 'Excerpt',
            value: dish.description[0]
        });
    }

    return fragments.map(item => `
        <article class="fragment-item">
            <span class="fragment-item-label">${item.label}</span>
            <div class="fragment-item-value ${item.large ? 'large' : ''}">${item.value}</div>
        </article>
    `).join('');
}

function initDisplayWall(displayItems) {
    const displayWall = document.getElementById('winDisplayWall');
    if (!displayWall) return;

    if (displayItems.length === 0) {
        displayWall.innerHTML = '<div class="detail-empty-state">暫無可展示圖片</div>';
        return;
    }

    displayWall.innerHTML = displayItems.map(item => `
        <img src="${item.src}" alt="${item.alt}" data-lightbox-src="${item.src}" data-lightbox-alt="${item.alt}" />
    `).join('');

    Array.from(displayWall.querySelectorAll('img')).forEach(image => {
        image.addEventListener('click', function() {
            openLightbox(image.dataset.lightboxSrc || image.src, image.dataset.lightboxAlt || image.alt);
        });
    });
}

function initRealityGallery(galleryItems) {
    const galleryGrid = document.getElementById('winGalleryGrid');
    if (!galleryGrid) return;

    if (galleryItems.length === 0) {
        galleryGrid.innerHTML = '<div class="detail-empty-state">暫無圖集素材</div>';
        return;
    }

    galleryGrid.innerHTML = galleryItems.map((item, index) =>
        `<img src="${item.src}" alt="${item.alt}" data-image-index="${index}" />`
    ).join('');

    const thumbnails = Array.from(galleryGrid.querySelectorAll('img'));
    const setActiveThumbnail = function(activeIndex) {
        thumbnails.forEach((thumb, index) => {
            thumb.classList.toggle('is-active', index === activeIndex);
        });
    };

    thumbnails.forEach((thumb, index) => {
        thumb.addEventListener('click', function() {
            setActiveThumbnail(index);
            openLightbox(thumb.src, thumb.alt);
        });
    });

    setActiveThumbnail(0);
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
    scene.fog = new THREE.Fog(0xefe3d8, 35, 120);

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

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(50, 50, 50);
    directionalLight.castShadow = true;
    const pointLight1 = new THREE.PointLight(0xff6b6b, 0.3, 100);
    pointLight1.position.set(20, 20, 20);
    const pointLight2 = new THREE.PointLight(0x4ecdc4, 0.3, 100);
    pointLight2.position.set(-20, -20, 20);

    scene.add(ambientLight, directionalLight, pointLight1, pointLight2);

    const baseShadow = new THREE.Mesh(
        new THREE.CircleGeometry(6.5, 64),
        new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.1
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

function initLightbox() {
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox-overlay';
    lightbox.id = 'lightboxOverlay';
    lightbox.innerHTML = '<img id="lightboxImg" src="" alt="" />';
    document.body.appendChild(lightbox);

    lightbox.addEventListener('click', () => {
        lightbox.classList.remove('active');
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            lightbox.classList.remove('active');
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
}

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
// 粒子背景系统（与首页一致）
// ===========================
(function initDetailParticles() {
    const canvas = document.getElementById('detail-particle-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // 与首页相同的彩色粒子色板
    const palette = [
        [255, 107, 107],  // accent-red
        [255, 46,  143],  // pink
        [255, 144, 33],   // orange
        [148, 237, 92],   // green
        [254, 202, 87],   // gold
        [255, 159, 243],  // purple-pink
        [186, 234, 169],  // light-green
        [74,  144, 217],  // blue
    ];

    let W, H;
    let particles = [];
    let animId;

    function resize() {
        W = canvas.width  = window.innerWidth;
        H = canvas.height = window.innerHeight;
    }

    // 暴露给 resize 监听器
    window.resizeParticleCanvas = resize;

    function createParticles() {
        particles = [];
        const count = Math.floor((W * H) / 6000); // 密度自适应
        for (let i = 0; i < count; i++) {
            const col = palette[Math.floor(Math.random() * palette.length)];
            particles.push({
                x:    Math.random() * W,
                y:    Math.random() * H,
                r:    Math.random() * 1.8 + 0.4,
                vx:   (Math.random() - 0.5) * 0.35,
                vy:   (Math.random() - 0.5) * 0.35,
                col:  col,
                a:    Math.random() * 0.5 + 0.15,   // 透明度
                pulse: Math.random() * Math.PI * 2,  // 闪烁相位
                pulseSpeed: Math.random() * 0.02 + 0.005
            });
        }
    }

    function draw() {
        ctx.clearRect(0, 0, W, H);

        particles.forEach(p => {
            // 缓慢闪烁
            p.pulse += p.pulseSpeed;
            const alpha = p.a + Math.sin(p.pulse) * 0.12;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${p.col[0]},${p.col[1]},${p.col[2]},${alpha})`;
            ctx.fill();

            // 移动
            p.x += p.vx;
            p.y += p.vy;

            // 边界环绕
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
