from pathlib import Path
import re
path=Path("claypot2.html")
text=path.read_text(encoding='utf-8')
pattern=r'''        const container = document.getElementById\('mediaCanvas'\);\r?\n\r?\n        function randomBetween\(min, max\) {\r?\n            return Math.random\(\) \* \(max - min\) \+ min;\r?\n        }\r?\n\r?\n        function placeMediaElements\(\) {\r?\n            container.innerHTML = '';?\n            const \{ clientWidth, clientHeight \} = container;\r?\n\r?\n            mediaItems.forEach\((?:.|\n)*?        \);\r?\n\r?\n        window.addEventListener\('load', \(\) => {\r?\n            placeMediaElements\(\);\r?\n        }\);\r?\n\r?\n        window.addEventListener\('resize', \(\) => {\r?\n            clearTimeout\(window.__mediaResizeTimer\);\r?\n            window.__mediaResizeTimer = setTimeout\(placeMediaElements, 200\);\r?\n        }\);'''
match=re.search(pattern,text,re.DOTALL)
if not match:
    raise SystemExit('old placement block not found')
new_block='''        const container = document.getElementById('mediaCanvas');
        const orbitScene = {
            items: [],
            speed: 0.28,
            xRadius: 220,
            yRadius: 90,
            zRadius: 240,
            animationFrameId: null
        };

        function createMediaElement(item) {
            const el = document.createElement(item.type === 'video' ? 'video' : 'img');
            el.classList.add('floating-media');
            el.src = item.src;
            el.alt = item.alt;

            const baseWidth = item.type === 'video' ? 320 : 240;
            el.style.width = `${baseWidth}px`;

            if (item.type === 'video') {
                el.muted = true;
                el.loop = true;
                el.autoplay = true;
                el.playsInline = true;
            }

            return {
                element: el,
                angle: 0,
                baseWidth,
                speedFactor: 0.75 + Math.random() * 0.5,
                depthBoost: item.type === 'video' ? 0.12 : 0
            };
        }

        function mountMediaElements() {
            if (!container) {
                return;
            }

            container.innerHTML = '';
            orbitScene.items = mediaItems.map((item, index) => {
                const media = createMediaElement(item);
                media.angle = (360 / mediaItems.length) * index;
                container.appendChild(media.element);
                return media;
            });

            updateOrbitGeometry();
            startOrbit();
        }

        function updateOrbitGeometry() {
            if (!container) {
                return;
            }

            const bounds = container.getBoundingClientRect();
            const width = bounds.width || container.offsetWidth || 680;
            const computed = getComputedStyle(container);
            const minHeight = parseFloat(computed.minHeight) || 480;
            const height = bounds.height || container.offsetHeight || minHeight;

            orbitScene.xRadius = Math.max(width * 0.32, 180);
            orbitScene.zRadius = Math.max(width * 0.24, 150);
            orbitScene.yRadius = Math.max(height * 0.2, 90);
        }

        function renderOrbit() {
            orbitScene.items.forEach((item) => {
                item.angle = (item.angle + orbitScene.speed * item.speedFactor) % 360;
                const radians = item.angle * (Math.PI / 180);

                const x = Math.cos(radians) * orbitScene.xRadius;
                const z = Math.sin(radians) * orbitScene.zRadius;
                const y = Math.sin(radians * 1.3) * orbitScene.yRadius;

                const depthRatio = (z + orbitScene.zRadius) / (2 * orbitScene.zRadius);
                const scale = 0.6 + depthRatio * 0.5 + item.depthBoost;
                const opacity = 0.35 + depthRatio * 0.65;

                item.element.style.transform = `translate3d(-50%, -50%, 0) translate3d(${x}px, ${y}px, ${z}px) scale(${scale})`;
                item.element.style.opacity = opacity.toFixed(2);
                item.element.style.zIndex = String(Math.floor(depthRatio * 100));
            });

            orbitScene.animationFrameId = requestAnimationFrame(renderOrbit);
        }

        function startOrbit() {
            cancelAnimationFrame(orbitScene.animationFrameId);
            renderOrbit();
        }

        window.addEventListener('load', () => {
            mountMediaElements();
        });

        window.addEventListener('resize', () => {
            clearTimeout(window.__claypotEllipseTimer);
            window.__claypotEllipseTimer = setTimeout(() => {
                updateOrbitGeometry();
            }, 140);
        });'''
text=text[:match.start()]+new_block+text[match.end():]
path.write_text(text,encoding='utf-8')