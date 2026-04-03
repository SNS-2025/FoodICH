// ===========================
// NAVIGATION MENU
// ===========================
function toggleMenu() {
    const hamburgerBtn = document.querySelector('.hamburger-btn');
    const menuDropdown = document.getElementById('menuDropdown');

    if (!hamburgerBtn || !menuDropdown) return;

    hamburgerBtn.classList.toggle('active');
    menuDropdown.classList.toggle('show');
}

// Close menu when clicking outside
document.addEventListener('click', function (event) {
    const hamburgerMenu = document.querySelector('.hamburger-menu');
    const menuDropdown = document.getElementById('menuDropdown');
    const hamburgerBtn = document.querySelector('.hamburger-btn');

    if (hamburgerMenu && !hamburgerMenu.contains(event.target)) {
        if (menuDropdown) menuDropdown.classList.remove('show');
        if (hamburgerBtn) hamburgerBtn.classList.remove('active');
    }
});

// Prevent closing when clicking inside the menu
const menuEl = document.querySelector('.hamburger-menu');
if (menuEl) {
    menuEl.addEventListener('click', function (event) {
        event.stopPropagation();
    });
}

// ===========================
// GLOBAL UTILITIES
// ===========================
function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
}

function createTextCanvas(text, options) {
    const settings = options || {};
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const fontSize = settings.fontSize || 160;
    const fontFamily = settings.fontFamily || 'Sora, Arial, sans-serif';
    const paddingX = settings.paddingX || 80;
    const paddingY = settings.paddingY || 56;

    context.font = `500 ${fontSize}px ${fontFamily}`;
    const metrics = context.measureText(text);
    canvas.width = Math.max(256, Math.ceil(metrics.width + paddingX * 2));
    canvas.height = Math.max(128, Math.ceil(fontSize + paddingY * 2));

    const renderContext = canvas.getContext('2d');
    renderContext.clearRect(0, 0, canvas.width, canvas.height);
    renderContext.font = `500 ${fontSize}px ${fontFamily}`;
    renderContext.textAlign = 'center';
    renderContext.textBaseline = 'middle';
    renderContext.fillStyle = settings.color || '#ffffff';
    renderContext.fillText(text, canvas.width / 2, canvas.height / 2);

    return canvas;
}

function createTextPlane(text, options) {
    const settings = options || {};
    const canvas = createTextCanvas(text, settings);
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;

    const aspect = canvas.width / canvas.height;
    const height = settings.height || 2.2;
    const width = height * aspect;
    const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide,
        opacity: settings.opacity == null ? 0.98 : settings.opacity,
        depthWrite: false
    });

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
    mesh.userData.texture = texture;
    return mesh;
}

function createLayeredTextGroup(lines, options) {
    const settings = options || {};
    const textGroup = new THREE.Group();
    const lineSpacing = settings.lineSpacing || 3;
    const totalHeight = (Math.max(lines.length - 1, 0)) * lineSpacing;

    lines.forEach((line, index) => {
        const mesh = createTextPlane(line.text, {
            color: line.color,
            fontSize: line.fontSize || settings.fontSize,
            fontFamily: line.fontFamily || settings.fontFamily,
            height: line.height || settings.height,
            opacity: line.opacity
        });
        mesh.position.y = (totalHeight / 2) - (index * lineSpacing);
        if (line.positionX) mesh.position.x = line.positionX;
        if (line.positionZ) mesh.position.z = line.positionZ;
        textGroup.add(mesh);
    });

    return textGroup;
}

window.createLayeredTextGroup = createLayeredTextGroup;

// ===========================
// PARTICLE SYSTEM (Colorful Theme)
// ===========================
(function initGlobalParticles() {
    const container = document.getElementById('particle-container');
    if (!container || typeof THREE === 'undefined') return;

    // Colorful particle colors matching v2
    const particleColors = [0xff6b6b, 0xff2e8f, 0xff9021, 0x94ed5c, 0xfeca57, 0xff9ff3, 0xbaeaa9];
    let scene, camera, renderer, particles;

    function init() {
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 5;

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0x000000, 0);
        container.appendChild(renderer.domElement);

        addParticles();
        animateParticles();

        window.addEventListener('resize', onWindowResize, false);
    }

    function addParticles() {
        const particleCount = 500;
        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 20;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 20;

            const color = new THREE.Color(particleColors[Math.floor(Math.random() * particleColors.length)]);
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
        }

        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const particleMaterial = new THREE.PointsMaterial({
            size: 0.1,
            vertexColors: true,
            transparent: true,
            opacity: 0.7
        });

        particles = new THREE.Points(particleGeometry, particleMaterial);
        scene.add(particles);
    }

    function animateParticles() {
        requestAnimationFrame(animateParticles);
        if (particles) {
            particles.rotation.y += 0.0002;
            particles.rotation.x += 0.0001;
        }
        renderer.render(scene, camera);
    }

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    init();
})();

// ===========================
// DISH DATA
// ===========================
function createPlaceholderImage(title, subtitle, background, foreground) {
    const bg = background || '#e7dbd2';
    const fg = foreground || '#5d4b45';
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
            <rect width="1200" height="900" fill="${bg}"/>
            <circle cx="600" cy="360" r="180" fill="rgba(255,255,255,0.28)"/>
            <circle cx="600" cy="360" r="116" fill="rgba(255,255,255,0.4)"/>
            <text x="600" y="660" text-anchor="middle" font-family="Sora, Arial, sans-serif" font-size="64" fill="${fg}" font-weight="600">${title}</text>
            <text x="600" y="730" text-anchor="middle" font-family="Sora, Arial, sans-serif" font-size="30" fill="${fg}" opacity="0.8">${subtitle || ''}</text>
        </svg>
    `;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function createAssetItems(basePath, filenames, type, altBase) {
    return filenames.map((filename, index) => ({
        type,
        src: `${basePath}/${filename}`,
        alt: `${altBase} ${String(index + 1).padStart(2, '0')}`
    }));
}

function createImageItems(basePath, filenames, altBase) {
    return createAssetItems(basePath, filenames, 'image', altBase);
}

function createVideoItems(basePath, filenames, altBase) {
    return createAssetItems(basePath, filenames, 'video', altBase);
}

function mergeMediaGroups(...groups) {
    return groups.flatMap(group => Array.isArray(group) ? group : []);
}

const dishAssets = {
    claypot: {
        displayItems: createImageItems('../food/claypot-rice/AI', ['caihong.png', 'taiguo.png', 'xingkong.png'], 'Clay Pot Rice AI'),
        galleryItems: createImageItems('../food/claypot-rice/Reality', ['PressedRice.png', 'a (3).png', 'a (4).png', 'lachang.png', 'paigu.png', 'wodanniu.png'], 'Clay Pot Rice Reality'),
        videoItems: createVideoItems('../food/claypot-rice/video', ['VID20241112204653.mp4', 'VID20241112204313.mp4'], 'Clay Pot Rice Video')
    },
    steamBuns: {
        displayItems: [],
        galleryItems: createImageItems('../food/steamed-buns/Reality', ['1.png', '2.png', '3.png', '4.png', '5.png'], 'Steam Buns Reality'),
        videoItems: createVideoItems('../food/steamed-buns/video', ['fen_DJI_0003.mp4', 'ya_DJI_0006.mp4', 'bao_DJI_0044.mp4', 'steam_DJI_0050.mp4'], 'Steam Buns Video')
    },
    hakkaTofu: {
        displayItems: createImageItems('../food/hakka-tofu/AI', ['79e1578f883159895015bffe8915e0d0e51d6949.png'], 'Hakka Tofu AI'),
        galleryItems: createImageItems('../food/hakka-tofu/Reality', ['73baa3575d77c954323cf25f93704f58aecbeb4b.jpg', '1.jpg', '2.jpg', '3.jpg', '4.jpg', '5.jpg', '6.jpg', '7.jpg', '8.jpg'], 'Hakka Tofu Reality'),
        videoItems: createVideoItems('../food/hakka-tofu/video', ['VID20241215111124.mp4', 'VID20241215111137.mp4', 'cut_VID20241215110009.mp4', 'fry_VID20241215111725.mp4'], 'Hakka Tofu Video')
    },
    healthyRibs: {
        displayItems: createImageItems('../food/healthy-ribs/AI', ['1.png', '2.png', '3.png', '4.png'], 'Liuyang Steamed Ribs AI'),
        galleryItems: createImageItems('../food/healthy-ribs/Reality', ['1.png', '2.png', '3.jpg', '4.png', '5.png', '6.png', '7.png', '8.png', '9.png'], 'Liuyang Steamed Ribs Reality'),
        videoItems: createVideoItems('../food/healthy-ribs/video', ['videoplayback.mp4'], 'Liuyang Steamed Ribs Video')
    },
    stirFriedBeef: {
        displayItems: createImageItems('../food/spicy-ribs/AI', ['1.png', '2.png', '3.png', '4.png', '5.png', '6.png', '7.png', '8.png'], 'Stir-fried Yellow Beef AI'),
        galleryItems: [],
        videoItems: createVideoItems('../food/spicy-ribs/video', ['videoplayback.mp4'], 'Stir-fried Yellow Beef Video')
    },
    preservedVegPork: {
        displayItems: createImageItems('../food/preserved-veg-pork/AI', ['1.png', '2.png', '3.png', '4.png', '5.png'], 'Preserved Veg Pork AI'),
        galleryItems: createImageItems('../food/preserved-veg-pork/Reality', ['1.png', '2.png', '3.png', '4.png', '5.png', '6.png'], 'Preserved Veg Pork Reality'),
        videoItems: createVideoItems('../food/preserved-veg-pork/video', ['videoplayback.mp4'], 'Preserved Veg Pork Video')
    },
    vermicelliShrimp: {
        displayItems: createImageItems('../food/vermicelli-shrimp/AI', ['1.png', '2.png', '3.png', '4.png', '5.png', '6.png'], 'Vermicelli Shrimp AI'),
        galleryItems: createImageItems('../food/vermicelli-shrimp/Reality', ['DJI_0001.JPG', 'DJI_0014.JPG', 'DJI_0017.JPG', 'DJI_0021.JPG', 'DJI_0035.JPG', 'DJI_0042.JPG', 'DJI_0048.JPG'], 'Vermicelli Shrimp Reality'),
        videoItems: createVideoItems('../food/vermicelli-shrimp/video', ['videoplayback.mp4'], 'Vermicelli Shrimp Video')
    }
};

const dishData = {
    'claypot': {
        number: '(01)',
        title: '煲仔飯',
        subtitle: 'Clay Pot Rice',
        location: 'Guangdong · Hong Kong',
        coverImage: dishAssets.claypot.galleryItems[0].src,
        info: [
            { label: 'Origin', value: '廣東省 · 香港' },
            { label: 'Era', value: 'Ming & Qing Dynasty' },
            { label: 'Pledges', value: '9/100', large: true }
        ],
        description: [
            '煲仔飯的起源可以追溯到中國南方的農村地區。早在明清時期，廣東、福建等地的農民在勞動之餘，會將米、菜、肉等食材放入瓦煲中，用慢火燉煮，製成美味煲仔飯。',
            '我們邀請到了嚐囍煲仔小菜的康哥，分享了他對煲仔飯的見解以及如何使用AI進行記錄變化與創新的過程。',
            'The origins of clay pot rice can be traced back to rural areas in southern China. As early as during the Ming and Qing dynasties, farmers in Guangdong and Fujian provinces would place rice, vegetables, and meat into a clay pot and slowly simmer them over low heat.'
        ],
        ...dishAssets.claypot,
        mediaItems: mergeMediaGroups(dishAssets.claypot.galleryItems, dishAssets.claypot.videoItems, dishAssets.claypot.displayItems)
    },
    'steam-buns': {
        number: '(02)',
        title: '流汁湯包',
        subtitle: 'Steam Buns',
        location: 'Jiangnan · China',
        coverImage: dishAssets.steamBuns.galleryItems[0].src,
        info: [
            { label: 'Origin', value: '江南地區' },
            { label: 'Style', value: 'Traditional Dim Sum' },
            { label: 'Pledges', value: '12/100', large: true }
        ],
        description: [
            '「輕輕提，慢慢移，先開窗，後喝湯。」這句順口溜，精準地概括了品嚐流汁湯包的精髓。流汁湯包，一道源自中國江南地區的傳統名點，以其皮薄、餡大、湯多、味鮮的特點，贏得了無數食客的青睞。',
            '我們邀請到了小李（化名），分享了他對流汁湯包的見解以及如何使用AI進行記錄變化與創新的過程。',
            '"Gently lift, move slowly, first open the window, then drink the soup." This catchy phrase accurately summarizes the essence of tasting steam buns.'
        ],
        ...dishAssets.steamBuns,
        mediaItems: mergeMediaGroups(dishAssets.steamBuns.galleryItems, dishAssets.steamBuns.videoItems)
    },
    'hakka-tofu': {
        number: '(03)',
        title: '客家釀豆腐',
        subtitle: 'Hakka Stuffed Tofu',
        location: 'Hakka · Guangdong',
        coverImage: dishAssets.hakkaTofu.galleryItems[0].src,
        info: [
            { label: 'Origin', value: '客家地區' },
            { label: 'Style', value: 'Hakka Cuisine' },
            { label: 'Pledges', value: '7/100', large: true }
        ],
        description: [
            '客家釀豆腐作為一道極具代表性的客家名菜，承載著深厚的歷史文化內涵，其起源與發展和客家人的遷徙歷程緊密相連。',
            '身為客家人，小李（化名）為我們展示了他們家庭製作客家釀豆腐的過程，並嘗試使用AI記錄了不同的偶然性，及根據AI的提示，創作了一道保留傳統味道的創新菜。',
            'As a representative Hakka dish, Hakka Stuffed Tofu carries profound historical and cultural connotations. Its origin and development are closely linked to the migration of Hakka people.'
        ],
        ...dishAssets.hakkaTofu,
        mediaItems: mergeMediaGroups(dishAssets.hakkaTofu.galleryItems, dishAssets.hakkaTofu.videoItems, dishAssets.hakkaTofu.displayItems)
    },
    'healthy-ribs': {
        number: '(04)',
        title: '瀏陽蒸排骨',
        subtitle: 'Liuyang Steamed Ribs',
        location: 'Liuyang · Hunan',
        coverImage: dishAssets.healthyRibs.galleryItems[0].src,
        info: [
            { label: 'Origin', value: '湖南瀏陽蒸菜' },
            { label: 'Style', value: 'Steamed Savoury' },
            { label: 'Status', value: 'Model Ready', large: true }
        ],
        description: [
            '瀏陽蒸排骨是瀏陽蒸菜中的經典代表，以豆豉香氣、排骨油脂與蒸製手法形成鮮明的地方風味。',
            '這道菜目前已接入首頁模型與統一詳情頁模板，可對應你已整理好的 AI 圖片與 Reality 圖集素材。',
            'Liuyang Steamed Ribs is now presented with the same unified detail-page layout, using the updated dish name and the existing local media assets.'
        ],
        ...dishAssets.healthyRibs,
        mediaItems: mergeMediaGroups(dishAssets.healthyRibs.galleryItems, dishAssets.healthyRibs.videoItems, dishAssets.healthyRibs.displayItems)
    },
    'stir-fried-beef': {
        number: '(05)',
        title: '小炒黃牛肉',
        subtitle: 'Stir-fried Yellow Beef',
        location: 'Hunan · Wok Stir-fry',
        coverImage: dishAssets.stirFriedBeef.displayItems[0].src,
        info: [
            { label: 'Origin', value: '湘菜風味' },
            { label: 'Style', value: 'Wok Stir-fry' },
            { label: 'Status', value: 'Model Ready', large: true }
        ],
        description: [
            '小炒黃牛肉目前已接入首頁模型與統一詳情頁模板，會使用和其他菜品相同的版面結構、3D 展示區與圖集互動。',
            '如果之後補上實拍照片，建議優先整理成成品圖、備料圖與翻炒步驟圖，頁面就能直接呈現更完整的內容層次。',
            'This model now opens as Stir-fried Yellow Beef and uses the same detail-page layout, ready for final photos and refined copy later.'
        ],
        ...dishAssets.stirFriedBeef,
        mediaItems: mergeMediaGroups(dishAssets.stirFriedBeef.videoItems, dishAssets.stirFriedBeef.displayItems)
    },
    'preserved-veg-pork': {
        number: '(06)',
        title: '梅菜豬肉',
        subtitle: 'Preserved Veg Pork',
        location: 'Hakka · Preserved Flavour',
        coverImage: dishAssets.preservedVegPork.galleryItems[0].src,
        info: [
            { label: 'Origin', value: '客家鹹香風味' },
            { label: 'Style', value: 'Braised & Preserved' },
            { label: 'Status', value: 'Model Ready', large: true }
        ],
        description: [
            '梅菜豬肉頁面已接入目前統一的詳情頁樣式，可以顯示 3D 模型、圖集、圖片展示與文字說明。',
            '在正式圖片到位前，頁面先使用佔位圖確保結構完整，後續只需把素材放入指定資料夾並替換路徑即可。',
            'This dish now uses the same unified detail-page experience and is ready for the final media set to be dropped in.'
        ],
        ...dishAssets.preservedVegPork,
        mediaItems: mergeMediaGroups(dishAssets.preservedVegPork.galleryItems, dishAssets.preservedVegPork.videoItems, dishAssets.preservedVegPork.displayItems)
    },
    'vermicelli-shrimp': {
        number: '(07)',
        title: '粉絲蝦煲',
        subtitle: 'Vermicelli Shrimp',
        location: 'Cantonese · Seafood Pot',
        coverImage: dishAssets.vermicelliShrimp.galleryItems[0].src,
        info: [
            { label: 'Origin', value: '粵式海鮮家常菜' },
            { label: 'Style', value: 'Seafood & Vermicelli' },
            { label: 'Assets', value: '7/7', large: true }
        ],
        description: [
            '粉絲蝦煲的素材目錄已經有一組實拍圖片，因此這個模型現在可以直接進入與 hakka-tofu 相同風格的詳情頁。',
            '你可以把這些圖片當作初版圖集，之後如果補上更多製作步驟圖或訪談影音，只要繼續加進同一個資料夾並更新資料配置即可。',
            'The Vermicelli Shrimp model now opens the same detail-page layout and already uses the available local gallery images as its image set.'
        ],
        ...dishAssets.vermicelliShrimp,
        mediaItems: mergeMediaGroups(dishAssets.vermicelliShrimp.galleryItems, dishAssets.vermicelliShrimp.videoItems, dishAssets.vermicelliShrimp.displayItems)
    }
};

// ===========================
// NAVIGATE TO DETAIL PAGE
// ===========================
function enterDishDetail(dishId) {
    window.location.href = `food-detail.html?dish=${dishId}`;
}

// ===========================
// IMAGE ERROR HANDLER
// ===========================
document.addEventListener('DOMContentLoaded', function() {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        img.addEventListener('error', function() {
            console.error('Image failed to load:', this.src);
            if (!this.src.includes('placehold.co')) {
                this.src = 'https://placehold.co/150x150/2b1d1d/b5a59a?text=N/A';
                this.alt = 'Image not available';
            }
        });
    });
});

// ===========================
// SCROLLABLE CARDS
// ===========================
document.addEventListener('DOMContentLoaded', function() {
    const cards = document.querySelectorAll('.card');

    cards.forEach(card => {
        const header = card.querySelector('.card-header');
        const toggle = card.querySelector('.card-toggle');

        if (header) {
            header.addEventListener('click', function() {
                const isExpanded = card.classList.contains('expanded');

                cards.forEach(c => {
                    if (c !== card && c.classList.contains('expanded')) {
                        c.classList.remove('expanded');
                    }
                });

                card.classList.toggle('expanded');
            });
        }

        if (toggle) {
            toggle.addEventListener('click', function(e) {
                e.stopPropagation();
                const isExpanded = card.classList.contains('expanded');

                cards.forEach(c => {
                    if (c !== card && c.classList.contains('expanded')) {
                        c.classList.remove('expanded');
                    }
                });

                card.classList.toggle('expanded');
            });
        }
    });
});
