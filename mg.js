// 1st section
class AVIFFrameAnimationHero {
    constructor() {
        this.canvas = document.getElementById('heroCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.frames = [];
        this.currentFrame = 0;
        this.totalFrames = 401;
        this.isLoaded = false;
        this.loadedFrames = 0;
        this.batchSize = 20;
        this.preloadDistance = 50;

        this.frameBasePath = './frames/';
        this.frameFilePrefix = 'frame_';
        this.frameFileExtension = '.avif';
        this.framePadding = 4;

        this.textChangePoints = [0.25, 0.6];
        this.textStates = [
            {
                title: "MG Cyberster",
                subtitle: "Because turning heads is just the beginning.",
                cta: "DOWNLOAD BROCHURE"
            },
            {
                title: "Not Designed For Subtlety",
                subtitle: "Convertible Roof. Electric Scissor Doors.",
                cta: "DOWNLOAD BROCHURE"
            },
            {
                title: "Electric Excellence",
                subtitle: "The future of driving is here.",
                cta: "EXPLORE MORE"
            }
        ];

        this.init();
    }

    init() {
        this.setupCanvas();
        this.startImagePreloading();
        this.bindEvents();
    }

    setupCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    getFrameFileName(index) {
        const paddedIndex = String(index + 1).padStart(this.framePadding, '0');
        return `${this.frameBasePath}${this.frameFilePrefix}${paddedIndex}${this.frameFileExtension}`;
    }

    async startImagePreloading() {
        document.getElementById('loadingPlaceholder').style.display = 'none';

        await this.loadFrameBatch(0, Math.min(this.batchSize, this.totalFrames));

        for (let i = this.batchSize; i < this.totalFrames; i += this.batchSize) {
            const endIndex = Math.min(i + this.batchSize, this.totalFrames);
            await this.loadFrameBatch(i, endIndex);
            await new Promise(resolve => setTimeout(resolve, 10));
        }

        this.onAllFramesLoaded();
    }

    async loadFrameBatch(startIndex, endIndex) {
        const promises = [];
        for (let i = startIndex; i < endIndex; i++) {
            promises.push(this.loadSingleFrame(i));
        }
        await Promise.all(promises);
    }

    loadSingleFrame(index) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const fileName = this.getFrameFileName(index);

            img.onload = () => {
                this.frames[index] = img;
                this.loadedFrames++;
                resolve(img);
            };

            img.onerror = () => {
                console.warn(`Failed to load frame: ${fileName}`);
                this.frames[index] = this.frames[Math.max(0, index - 1)] || null;
                this.loadedFrames++;
                resolve(null);
            };

            img.src = fileName;
        });
    }

    onAllFramesLoaded() {
        this.isLoaded = true;
        this.simulatePreloader();
    }

    simulatePreloader() {
        setTimeout(() => {
            const preloader = document.getElementById('preloader');
            const logo = document.getElementById('preloaderLogo');
            const header = document.getElementById('header');

            logo.classList.add('shrink');

            setTimeout(() => {
                header.classList.add('seamless-transition');
            }, 1700);

            setTimeout(() => {
                preloader.classList.add('fade-out');

                setTimeout(() => {
                    header.classList.remove('seamless-transition');
                    header.classList.add('visible');
                }, 200);

                setTimeout(() => {
                    this.startHeroAnimation();
                }, 500);

                setTimeout(() => {
                    preloader.remove();
                }, 1000);
            }, 2000);
        }, 1500);
    }

    startHeroAnimation() {
        document.getElementById('heroContent').classList.add('visible');
        document.getElementById('scrollIndicator').classList.add('visible');
        this.drawFrame(0);
    }

    drawFrame(frameIndex) {
        if (!this.isLoaded || !this.frames[frameIndex]) return;

        const img = this.frames[frameIndex];
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const canvasAspect = this.canvas.width / this.canvas.height;
        const imgAspect = img.width / img.height;

        let drawWidth = this.canvas.width;
        let drawHeight = this.canvas.height;
        let offsetX = 0;
        let offsetY = 0;

        if (imgAspect > canvasAspect) {
            drawHeight = this.canvas.height;
            drawWidth = drawHeight * imgAspect;
            offsetX = (this.canvas.width - drawWidth) / 2;
        } else {
            drawWidth = this.canvas.width;
            drawHeight = drawWidth / imgAspect;
            offsetY = (this.canvas.height - drawHeight) / 2;
        }

        this.ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
        this.currentFrame = frameIndex;

        const frameCounter = document.getElementById('currentFrameNumber');
        if (frameCounter) {
            frameCounter.textContent = frameIndex + 1;
        }
    }

    updateTextContent(progress) {
        const heroTitle = document.getElementById('heroTitle');
        const heroSubtitle = document.getElementById('heroSubtitle');
        const heroCta = document.getElementById('heroCta');

        let textStateIndex = 0;

        if (progress >= this.textChangePoints[1]) {
            textStateIndex = 2;
        } else if (progress >= this.textChangePoints[0]) {
            textStateIndex = 1;
        }

        const currentState = this.textStates[textStateIndex];

        if (heroTitle.textContent !== currentState.title) {
            heroTitle.style.opacity = '0';
            heroSubtitle.style.opacity = '0';
            heroCta.style.opacity = '0';

            setTimeout(() => {
                heroTitle.textContent = currentState.title;
                heroSubtitle.textContent = currentState.subtitle;
                heroCta.textContent = currentState.cta;

                heroTitle.style.opacity = '1';
                heroSubtitle.style.opacity = '0.8';
                heroCta.style.opacity = '1';
            }, 200);
        }
    }

    preloadNearbyFrames(currentIndex) {
        const start = Math.max(0, currentIndex - this.preloadDistance);
        const end = Math.min(this.totalFrames - 1, currentIndex + this.preloadDistance);

        for (let i = start; i <= end; i++) {
            if (!this.frames[i]) {
                this.loadSingleFrame(i);
            }
        }
    }

    bindEvents() {
        let ticking = false;

        const updateAnimation = () => {
            const heroSection = document.getElementById('heroSection');
            const rect = heroSection.getBoundingClientRect();
            const progress = Math.max(0, Math.min(1, -rect.top / (rect.height - window.innerHeight)));

            const frameIndex = Math.floor(progress * (this.totalFrames - 1));
            this.drawFrame(frameIndex);
            this.preloadNearbyFrames(frameIndex);
            this.updateTextContent(progress);

            const scrollLine = document.getElementById('scrollLine');
            if (scrollLine) {
                scrollLine.style.setProperty('--progress', `${progress * 100}%`);
            }

            this.updateSecondSection();
            ticking = false;
        };

        const onScroll = () => {
            if (!ticking && this.isLoaded) {
                requestAnimationFrame(updateAnimation);
                ticking = true;
            }
        };

        window.addEventListener('scroll', onScroll);
        window.addEventListener('resize', () => {
            this.setupCanvas();
            if (this.isLoaded) {
                this.drawFrame(this.currentFrame);
            }
        });
    }
    updateSecondSection() {
        const secondSection = document.getElementById('secondSection');
        const carBackground = document.getElementById('carBackground');
        const carImage = document.getElementById('carImage');
        const sectionContent = document.getElementById('sectionContent');
        if (!secondSection || !carBackground || !carImage) return;

        const rect = secondSection.getBoundingClientRect();
        const progress = Math.max(0, Math.min(1, -rect.top / (rect.height - window.innerHeight)));
        const backgroundY = progress * 100;
        carBackground.style.backgroundPosition = `center ${backgroundY}%`;
        if (progress <= 0.3) {
            carImage.style.opacity = '1';
            sectionContent.classList.remove('visible');
        } else if (progress <= 0.6) {
            const fadeProgress = (progress - 0.3) / 0.3;
            carImage.style.opacity = `${1 - fadeProgress}`;
            sectionContent.classList.remove('visible');
        } else {
            carImage.style.opacity = '0';
            sectionContent.classList.add('visible');
        }
    }
}
document.addEventListener('DOMContentLoaded', () => {
    new AVIFFrameAnimationHero();
});

// 2nd video section 
(() => {
    /**
     * CONFIG — replace with your assets & timings
     */
    const Video2 = "./assets/Animation-Video-2.mp4";
    const mainText = document.getElementById('mainText');

    const CONFIG = {
        MAIN_SRC: Video2, // demo video
        MAIN_STOP_AT: 3.5, // seconds — pause here to show hotspots
        REVERSE_FPS: 45, // smoothness when reversing
        MODULES: [
            {
                id: "hs-1",
                title: "Left Module",
                info: "Explain the part shown at hotspot #1. Add specs, benefits, etc.",
                video: {
                    // src: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm",
                    src: Video2,
                    playFrom: 3.6,
                    playTo: 5.0
                }
            },
            {
                id: "hs-2",
                title: "Center Module",
                info: "Deep dive into component #2 with a short clip and overlayed details.",
                video: {
                    // src: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
                    src: Video2,
                    playFrom: 13.0,
                    playTo: 21.0
                }
            },
            {
                id: "hs-3",
                title: "Right Module",
                info: "Overview of the system behavior around hotspot #3.",
                video: {
                    // src: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
                    src: Video2,
                    playFrom: 6.0,
                    playTo: 9.0
                }
            }
        ]
    };

    /**
     * ELEMENTS
     */
    const video = document.getElementById('video');
    const hotspotsWrap = document.getElementById('hotspots');
    const loader = document.getElementById('loader');
    const panel = document.getElementById('panel');
    const panelTitle = document.getElementById('panelTitle');
    const panelBody = document.getElementById('panelBody');
    const closePanelBtn = document.getElementById('closePanel');
    const hint = document.getElementById('hint');

    /**
     * STATE
     */
    let reversing = false;
    let reverseRAF = null;
    let activeModule = null; // object from CONFIG.MODULES
    const mainState = { src: CONFIG.MAIN_SRC, pausedAt: CONFIG.MAIN_STOP_AT };

    /**
     * HELPERS
     */
    const show = (el) => el.removeAttribute('hidden');
    const hide = (el) => el.setAttribute('hidden', '');
    const showLoader = (flag) => loader.classList.toggle('show', !!flag);
    const openPanel = (title, html) => { panelTitle.textContent = title; panelBody.textContent = ""; panelBody.innerHTML = html; panel.classList.add('open'); panel.setAttribute('aria-hidden', 'false'); };
    const closePanel = () => { panel.classList.remove('open'); panel.setAttribute('aria-hidden', 'true'); };

    function whenVisibleOnce(node, cb) {
        // Observe entrance into viewport to start main playback once
        const io = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) { io.disconnect(); cb(); }
            })
        }, { threshold: .6 });
        io.observe(node);
    }

    function loadMainAtStop() {
        return new Promise((resolve) => {
            if (video.src !== mainState.src) { video.src = mainState.src; }
            video.pause();
            // Wait for metadata to allow currentTime seek
            const onMeta = () => {
                video.currentTime = Math.min(CONFIG.MAIN_STOP_AT, video.duration || CONFIG.MAIN_STOP_AT);
                resolve();
            };
            if (Number.isFinite(video.duration) && video.duration > 0) { onMeta(); }
            else { video.addEventListener('loadedmetadata', onMeta, { once: true }); }
        });
    }

    function playMainUntilStop() {
        video.src = mainState.src;
        video.currentTime = 0;
        video.play().catch(() => { });
        mainText?.classList.remove('show'); // keep hidden while playing
        const onTime = () => {
            if (video.currentTime >= CONFIG.MAIN_STOP_AT) {
                video.pause();
                video.removeEventListener('timeupdate', onTime);
                show(hotspotsWrap);
                hint.classList.add('show');
                //   mainText?.classList.remove('hidden');
                //   mainText?.classList.add('show');
                if (mainText) {                         // ← remove the ATTRIBUTE, then fade in
                    show(mainText);                       // calls el.removeAttribute('hidden')
                    mainText.classList.add('show');
                }
            }
        };
        video.addEventListener('timeupdate', onTime);
    }

    function playModule(mod) {
        activeModule = mod;
        hint.classList.remove('show');
        hide(hotspotsWrap);
        mainText?.classList.remove('show');
        showLoader(true);

        // Switch to module video, seek, play to playTo then pause and open info
        video.src = mod.video.src;
        const start = mod.video.playFrom ?? 0;
        const end = mod.video.playTo ?? null;

        const onMeta = async () => {
            video.currentTime = Math.min(start, video.duration || start);
            try { await video.play(); } catch (e) { }
            if (end != null) {
                const onTime = () => {
                    if (video.currentTime >= end) {
                        video.pause();
                        video.removeEventListener('timeupdate', onTime);
                        showLoader(false);
                        openPanel(mod.title, mod.info);
                    }
                };
                video.addEventListener('timeupdate', onTime);
            } else {
                // If no end provided, open panel immediately after playback starts
                showLoader(false);
                openPanel(mod.title, mod.info);
            }
        };

        if (Number.isFinite(video.duration) && video.duration > 0) { onMeta(); }
        else { video.addEventListener('loadedmetadata', onMeta, { once: true }); }
    }

    function reverseToMainStop() {
        // Simulate reverse playback back to MAIN_STOP_AT, then show hotspots
        reversing = true;
        const target = CONFIG.MAIN_STOP_AT;

        // First ensure main source is loaded at current frame of module end
        const startFrom = video.currentTime; // where we are now in module

        // Swap back to main video at pausedAt frame for a smooth visual? Two options:
        // (A) visually reverse current (module) then cut — might look wrong.
        // (B) cut to main track immediately and reverse that to target.
        // We'll do (B) for consistency.
        video.pause();
        const currentDisplay = startFrom; // unused but kept for clarity

        const begin = () => {
            // Seek a bit ahead of target so the reverse feels natural
            const startPoint = Math.max(target, target + 0.001);
            video.currentTime = Math.min(startPoint + 1.0, video.duration || startPoint + 1.0); // 1s ahead if possible

            const step = 1 / CONFIG.REVERSE_FPS; // ~ frame step
            let last = performance.now();

            const tick = (now) => {
                if (!reversing) { return; }
                const dt = Math.min(0.06, (now - last) / 1000); // cap in case of tab jank
                last = now;
                const newTime = video.currentTime - dt;
                if (newTime <= target) {
                    video.currentTime = target;
                    reversing = false;
                    cancelAnimationFrame(reverseRAF);
                    show(hotspotsWrap);
                    hint.classList.add('show');
                    // mainText?.classList.add('show');
                    if (mainText) { show(mainText); mainText.classList.add('show'); }
                    return;
                }
                video.currentTime = newTime;
                reverseRAF = requestAnimationFrame(tick);
            };
            reverseRAF = requestAnimationFrame(tick);
        };

        // Ensure main video is the source before reversing
        if (video.src !== mainState.src) {
            video.src = mainState.src;
            video.addEventListener('loadedmetadata', () => {
                begin();
            }, { once: true });
        } else {
            begin();
        }
    }

    /**
     * WIRE UP
     */
    // Initial load
    video.src = CONFIG.MAIN_SRC;
    video.muted = true; // autoplay policies
    video.playsInline = true;

    whenVisibleOnce(document.getElementById('stage'), () => {
        playMainUntilStop();
    });

    // Hotspot interactions
    CONFIG.MODULES.forEach(mod => {
        const el = document.getElementById(mod.id);
        el?.addEventListener('click', () => playModule(mod));
    });

    // Close info panel -> reverse and restore main stop frame & hotspots
    closePanelBtn.addEventListener('click', async () => {
        closePanel();
        showLoader(true);
        // Smoothly reverse back to main
        await loadMainAtStop(); // ensure we have the main track ready and seekable
        showLoader(false);
        reverseToMainStop();
        activeModule = null;
    });

    // Safety: if user scrolls away, pause video to save CPU
    const visibilityHandler = () => {
        const r = document.getElementById('stage').getBoundingClientRect();
        const inView = r.top < window.innerHeight * 0.9 && r.bottom > window.innerHeight * 0.1;
        if (!inView) video.pause();
    };
    document.addEventListener('scroll', visibilityHandler, { passive: true });
    window.addEventListener('resize', visibilityHandler);
})();

// 2nd hover animation
const overlayImage = document.getElementById('overlayImage');
const container = document.querySelector('.image__reveal--container');
const revealStrip = document.getElementById('revealStrip');

// Mouse move event
container.addEventListener('mousemove', (e) => {
    const containerHeight = container.clientHeight;
    const rect = container.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const percentage = (y / containerHeight) * 100;

    // Calculate strip height based on position - bigger in middle (around 35-65%), smaller at top/bottom
    const distanceFromMiddle = Math.abs(50 - percentage);
    const minStripHeight = 8; // Minimum strip height percentage at top/bottom (increased from 6)
    const maxStripHeight = 30; // Maximum strip height percentage in middle (increased from 25)

    // Use smoother curve for strip height
    const normalizedDistance = distanceFromMiddle / 50; // 0 at middle, 1 at edges
    const stripHeightPercent = minStripHeight + (maxStripHeight - minStripHeight) * (1 - Math.pow(normalizedDistance, 1.5));

    // Calculate the top and bottom bounds of the reveal strip centered on cursor
    const halfStrip = stripHeightPercent / 2;
    const stripTop = Math.max(0, percentage - halfStrip);
    const stripBottom = Math.min(100, percentage + halfStrip);

    // Calculate clip path - only show frame in the strip area
    const topClip = stripTop;
    const bottomClip = 100 - stripBottom;

    // Reveal the frame image within the strip area
    overlayImage.style.transition = 'clip-path 0.1s ease-out';
    overlayImage.style.clipPath = `inset(${topClip}% 0 ${bottomClip}% 0)`;
});

// Reset on mouse leave
container.addEventListener('mouseleave', () => {
    overlayImage.style.transition = 'clip-path 0.3s ease-out';
    overlayImage.style.clipPath = 'inset(0 0 100% 0)';
});

// 3rd video section
(function () {
    const video = document.getElementById('bgVideo');
    const btn = document.getElementById('launchBtn');
    const hint1 = document.getElementById('hint1');
    let holding = false;

    // Ensure we start paused at 0
    video.pause();
    video.currentTime = 0;

    // Play on hold (pointer + touch + keyboard)
    const startHold = async () => {
        if (holding) return;
        holding = true;
        btn.setAttribute('aria-pressed', 'true');
        hint1.textContent = 'Release to pause';
        try {
            await video.play(); // muted + user gesture -> should succeed
        } catch (e) {
            console.warn('Playback failed:', e);
        }
    };

    const endHold = () => {
        if (!holding) return;
        holding = false;
        btn.setAttribute('aria-pressed', 'false');
        hint1.textContent = 'Hold the button to feel the rush';
        video.pause();
    };

    // Button events
    btn.addEventListener('pointerdown', startHold);
    btn.addEventListener('pointerup', endHold);
    btn.addEventListener('pointerleave', endHold);
    btn.addEventListener('pointercancel', endHold);

    // Keyboard accessibility: Space / Enter to hold
    btn.addEventListener('keydown', (e) => {
        if (e.code === 'Space' || e.code === 'Enter') {
            e.preventDefault();
            startHold();
        }
    });
    btn.addEventListener('keyup', (e) => {
        if (e.code === 'Space' || e.code === 'Enter') {
            e.preventDefault();
            endHold();
        }
    });

    // Pause when section goes off-screen
    const section = document.getElementById('drive');
    const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) {
                video.pause();
                btn.setAttribute('aria-pressed', 'false');
                holding = false;
                hint1.textContent = 'Hold the button to feel the rush';
            }
        });
    }, { threshold: 0.25 });
    io.observe(section);

    // Optional: reset to “hero stop point” when paused (e.g., 3.2s)
    // Set a frame to return to if you want a consistent paused frame:
    const HERO_TIME = 0; // change to e.g., 3.2
    video.addEventListener('pause', () => {
        if (!holding && HERO_TIME >= 0) {
            // Snap back slightly later to avoid jarring seek during user pause
            requestAnimationFrame(() => { video.currentTime = HERO_TIME; });
        }
    });
})();

// 5th section animation
// (() => {
//     const STOP_AT = 5.2;
//     const REVERSE_MS = 900;
//     const OBSERVE_THRESHOLD = 0.35;

//     const section = document.getElementById('videoSection');
//     const mainVideo = document.getElementById('videoSection_mainVideo');
//     const hotspots = document.getElementById('videoSection_hotspots');
//     const drawer = document.getElementById('videoSection_drawer');
//     const drawerTitle = document.getElementById('videoSection_drawerTitle');
//     const drawerInfo = document.getElementById('videoSection_drawerInfo');
//     const closeBtn = document.getElementById('videoSection_closeBtn');
//     const detailVideo = document.getElementById('videoSection_detailVideo');

//     let reachedStop = false;
//     let reversing = false;
//     let rafId;

//     const observer = new IntersectionObserver((entries) => {
//         entries.forEach(entry => {
//             if (entry.isIntersecting) playMainVideo();
//             else pauseAll();
//         });
//     }, { threshold: OBSERVE_THRESHOLD });

//     observer.observe(section);

//     function playMainVideo() {
//         if (reachedStop) {
//             mainVideo.currentTime = STOP_AT;
//             pause(mainVideo);
//             toggleHotspots(true);
//             return;
//         }
//         toggleHotspots(false);
//         mainVideo.play().catch(() => { });
//     }

//     mainVideo.addEventListener('timeupdate', () => {
//         if (!reachedStop && mainVideo.currentTime >= STOP_AT) {
//             reachedStop = true;
//             mainVideo.currentTime = STOP_AT;
//             pause(mainVideo);
//             toggleHotspots(true);
//         }
//     });

//     function toggleHotspots(state) {
//         hotspots.classList.toggle('active', state);
//     }

//     hotspots.addEventListener('click', (e) => {
//         const btn = e.target.closest('.videoSection_spot');
//         if (!btn) return;
//         pause(mainVideo);
//         toggleHotspots(false);
//         const title = btn.dataset.detailTitle;
//         const src = btn.dataset.detailVideo;
//         const text = btn.dataset.detailText;
//         drawerTitle.textContent = title;
//         drawerInfo.textContent = text;
//         if (src) {
//             detailVideo.src = src;
//             detailVideo.currentTime = 0;
//             detailVideo.play().catch(() => { });
//         }
//         openDrawer();
//     });

//     function openDrawer() {
//         drawer.classList.add('open');
//     }

//     function closeDrawer() {
//         drawer.classList.remove('open');
//         pause(detailVideo);
//         detailVideo.removeAttribute('src');
//         detailVideo.load();
//         reverseTo(mainVideo, STOP_AT, REVERSE_MS, () => {
//             toggleHotspots(true);
//             pause(mainVideo);
//             mainVideo.currentTime = STOP_AT;
//         });
//     }

//     closeBtn.addEventListener('click', closeDrawer);
//     window.addEventListener('keydown', e => {
//         if (e.key === 'Escape' && drawer.classList.contains('open')) closeDrawer();
//     });

//     function reverseTo(video, target, duration, done) {
//         if (!Number.isFinite(video.currentTime)) { done(); return; }
//         cancelAnimationFrame(rafId);
//         reversing = true;
//         const start = video.currentTime;
//         const delta = start - target;
//         if (delta <= 0.01) { reversing = false; done(); return; }
//         const startTime = performance.now();
//         (function step(now) {
//             const t = Math.min(1, (now - startTime) / duration);
//             const eased = 1 - Math.pow(1 - t, 3);
//             const newTime = start - delta * eased;
//             try { video.currentTime = Math.max(target, newTime); } catch (_) { }
//             if (t < 1 && video.currentTime > target + 0.001)
//                 rafId = requestAnimationFrame(step);
//             else { reversing = false; video.currentTime = target; done(); }
//         })(startTime);
//     }

//     function pause(v) { try { v.pause(); } catch (_) { } }
//     function pauseAll() { pause(mainVideo); pause(detailVideo); }

// })();

// Reusable hotspot video behavior (stage-like), applied to videoSection too
(function attachHotspotVideo({
    sectionId,            // container section id
    mainVideoId,          // main video element id
    hotspotsId,           // wrapper that contains the hotspot buttons
    drawer: {             // drawer/panel elements
        rootId,
        titleId,
        infoId,
        closeBtnId,
        detailVideoId
    },
    startAt = 19.0,
    stopAt = 21.0,         // time to pause main video and show hotspots
    observeThreshold = 0.35,
    reverseMs = 900
}) {
    const section = document.getElementById(sectionId);
    const mainVideo = document.getElementById(mainVideoId);
    const hotspots = document.getElementById(hotspotsId);
    const drawer = document.getElementById(rootId);
    const drawerTitle = document.getElementById(titleId);
    const drawerInfo = document.getElementById(infoId);
    const closeBtn = document.getElementById(closeBtnId);
    const detailVideo = document.getElementById(detailVideoId);

    let reachedStop = false;
    let rafId;

    // Observe section visibility (auto-play main until STOP, like stage flow)
    const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) playMainUntilStop();
            else pauseAll();
        });
    }, { threshold: observeThreshold });
    io.observe(section);

    function playMainUntilStop() {
        if (reachedStop) {
            mainVideo.currentTime = stopAt;
            pause(mainVideo);
            setHotspots(true);
            return;
        }
        setHotspots(false);
        if (Number.isFinite(params.startAt)) {
            mainVideo.currentTime = params.startAt;
        }
        mainVideo.play().catch(() => { });
    }

    mainVideo.addEventListener('timeupdate', () => {
        if (!reachedStop && mainVideo.currentTime >= stopAt) {
            reachedStop = true;
            mainVideo.currentTime = stopAt;
            pause(mainVideo);
            setHotspots(true);
        }
    });

    function setHotspots(on) {
        hotspots.classList.toggle('active', on);
    }

    hotspots.addEventListener('click', (e) => {
        const btn = e.target.closest('.videoSection_spot');
        if (!btn) return;

        // Read data from hotspot (mirrors stage MODULES config)
        const segFrom = parseFloat(btn.dataset.from ?? '0');
        const segTo = parseFloat(btn.dataset.to ?? '0');
        const segSrc = btn.dataset.detailVideo || '';
        const title = btn.dataset.detailTitle || 'Detail';
        const text = btn.dataset.detailText || '';

        // Hide hotspots, play segment, then open info
        setHotspots(false);
        pause(mainVideo);

        drawerTitle.textContent = title;
        drawerInfo.textContent = text;

        if (segSrc) {
            detailVideo.src = segSrc;
        } else {
            // fallback: reuse main video if no detail video provided
            detailVideo.removeAttribute('src');
        }

        const onMeta = async () => {
            try {
                if (Number.isFinite(segFrom)) detailVideo.currentTime = Math.max(0, segFrom);
                await detailVideo.play();
            } catch (_) { }

            if (Number.isFinite(segTo) && segTo > 0) {
                const onTime = () => {
                    if (detailVideo.currentTime >= segTo) {
                        detailVideo.pause();
                        detailVideo.removeEventListener('timeupdate', onTime);
                        openDrawer();
                    }
                };
                detailVideo.addEventListener('timeupdate', onTime);
            } else {
                // Open right away if no end time
                openDrawer();
            }
        };

        if (Number.isFinite(detailVideo.duration) && detailVideo.duration > 0) onMeta();
        else detailVideo.addEventListener('loadedmetadata', onMeta, { once: true });
    });

    function openDrawer() {
        drawer.classList.add('open');
    }

    function closeDrawer() {
        drawer.classList.remove('open');
        pause(detailVideo);
        // clear src so we don't keep decoding in background
        detailVideo.removeAttribute('src');
        detailVideo.load();

        // Smoothly reverse main back to STOP frame (same idea as stage)
        reverseTo(mainVideo, stopAt, reverseMs, () => {
            setHotspots(true);
            pause(mainVideo);
            mainVideo.currentTime = stopAt;
        });
    }

    closeBtn.addEventListener('click', closeDrawer);
    window.addEventListener('keydown', e => { if (e.key === 'Escape' && drawer.classList.contains('open')) closeDrawer(); });

    function reverseTo(video, target, duration, done) {
        cancelAnimationFrame(rafId);
        const start = Number.isFinite(video.currentTime) ? video.currentTime : target;
        const delta = start - target;
        if (delta <= 0.01) { done(); return; }
        const t0 = performance.now();
        (function step(now) {
            const t = Math.min(1, (now - t0) / duration);
            const eased = 1 - Math.pow(1 - t, 3); // ease-out
            const newTime = start - delta * eased;
            try { video.currentTime = Math.max(target, newTime); } catch { }
            if (t < 1 && video.currentTime > target + 0.001) {
                rafId = requestAnimationFrame(step);
            } else {
                video.currentTime = target;
                done();
            }
        })(t0);
    }

    function pause(v) { try { v.pause(); } catch { } }
    function pauseAll() { pause(mainVideo); pause(detailVideo); }

})({
    // Map to your videoSection elements
    sectionId: 'videoSection',
    mainVideoId: 'videoSection_mainVideo',
    hotspotsId: 'videoSection_hotspots',
    drawer: {
        rootId: 'videoSection_drawer',
        titleId: 'videoSection_drawerTitle',
        infoId: 'videoSection_drawerInfo',
        closeBtnId: 'videoSection_closeBtn',
        detailVideoId: 'videoSection_detailVideo'
    },
    stopAt: 5.2,          // match your current STOP_AT for videoSection
    observeThreshold: 0.35,
    reverseMs: 900
});


const cyberVideo        = document.getElementById('cyberVideo_mainVideo');
const cyberVideoSection = document.getElementById('cyberVideo_container');
const cyberVideoText    = document.querySelector('.cyberVideo_textBox');

// Harden autoplay: ensure muted + playsinline at runtime too
cyberVideo.muted = true;
cyberVideo.playsInline = true;

// Wait until metadata is ready so play() promise is more reliable
let metaReady = false;
cyberVideo.addEventListener('loadedmetadata', () => { metaReady = true; });

function tryPlay() {
  if (!metaReady) return; // will be called again by observer
  const p = cyberVideo.play();
  if (p && typeof p.then === 'function') {
    p.then(() => {
      cyberVideoText.style.opacity = '1';
    }).catch((err) => {
      // Fallback: show controls so the user can tap once (counts as gesture)
      cyberVideo.setAttribute('controls', '');
      console.warn('Autoplay blocked, showing controls:', err);
    });
  }
}

const io = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        tryPlay();
      } else {
        cyberVideo.pause();
        cyberVideoText.style.opacity = '0';
      }
    });
  },
  { threshold: 0.5 }
);

io.observe(cyberVideoSection);

// Extra fallback for older browsers (no IO)
if (!('IntersectionObserver' in window)) {
  window.addEventListener('scroll', () => {
    const r = cyberVideoSection.getBoundingClientRect();
    const halfVisible = r.top < window.innerHeight * 0.5 && r.bottom > window.innerHeight * 0.5;
    if (halfVisible) tryPlay(); else cyberVideo.pause();
  });
}
