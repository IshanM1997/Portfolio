document.addEventListener('DOMContentLoaded', () => {

    // =====================================================
    // DYNAMIC FAVICON (circular crop from DP.png)
    // =====================================================
    const faviconElement = document.getElementById('favicon');
    const dpImg = new Image();
    dpImg.src = './assets/images/DP.png';
    dpImg.crossOrigin = 'anonymous';
    dpImg.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 128;
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.beginPath(); ctx.arc(size/2, size/2, size/2, 0, Math.PI*2); ctx.clip();
        let srcX=0,srcY=0,srcW=dpImg.width,srcH=dpImg.height;
        if(dpImg.width>dpImg.height){srcW=dpImg.height;srcX=(dpImg.width-dpImg.height)/2;}
        else if(dpImg.height>dpImg.width){srcH=dpImg.width;srcY=(dpImg.height-dpImg.width)/2;}
        ctx.drawImage(dpImg,srcX,srcY,srcW,srcH,0,0,size,size);
        if(faviconElement) faviconElement.href=canvas.toDataURL('image/png');
    };

    // =====================================================
    // DYNAMIC EXPERIENCE COUNTER
    //
    // Edit EXP_START to your actual first working day.
    // Month is 0-indexed: Jan=0, Feb=1 … Sep=8, Dec=11
    // =====================================================
    const EXP_START = new Date(2022, 10, 6); // 1 September 2021

    function updateExperienceCounter() {
        const now  = new Date();
        let years  = now.getFullYear() - EXP_START.getFullYear();
        let months = now.getMonth()    - EXP_START.getMonth();
        if (months < 0) { years--; months += 12; }

        // e.g. "4.9+" = 4 yrs 9 months; "4+" = exact year boundary
        const display = years + (months > 0 ? '.' + months : '') + '+';

        // Every element with data-stat="exp-years" gets updated
        document.querySelectorAll('[data-stat="exp-years"]').forEach(el => {
            el.textContent = display;
        });
    }

    updateExperienceCounter();
    // Refresh every hour — stays live without a page reload
    setInterval(updateExperienceCounter, 3600000);

    // =====================================================
    // INTERSECTION OBSERVER (scroll reveals)
    // =====================================================
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                revealObserver.unobserve(entry.target); // one-shot
            }
        });
    }, { threshold: 0.08 });

    // Helper: start observing unobserved .reveal-up inside a root
    function observeRevealElements(root) {
        (root || document).querySelectorAll('.reveal-up:not(.revealed)').forEach(el => {
            revealObserver.observe(el);
        });
    }

    // On init: skip hidden creative sections
    document.querySelectorAll('.reveal-up').forEach(el => {
        if (!el.closest('#creative-modules-wrapper') && !el.closest('#creative-hero-layout')) {
            revealObserver.observe(el);
        }
    });

    // =====================================================
    // WORKSPACE SWITCHER
    // =====================================================
    const masterTabs         = document.querySelectorAll('.ws-toggle-btn');
    const technicalModules   = document.getElementById('technical-modules-wrapper');
    const creativeModules    = document.getElementById('creative-modules-wrapper');
    const bgImageElement     = document.getElementById('bg-image-element');
    const techHeroLayout     = document.getElementById('tech-hero-layout');
    const creativeHeroLayout = document.getElementById('creative-hero-layout');

    if (bgImageElement) {
        bgImageElement.style.backgroundImage = "url('./assets/bg-images/tech-bg.png')";
    }

    function switchWorkspace(workspace) {
        const isTech = workspace === 'technical-workspace';

        // Body class drives all CSS token variables (accent, surface, borders)
        document.body.classList.toggle('workspace-technical', isTech);
        document.body.classList.toggle('workspace-creative',  !isTech);

        // Toggle hero layouts — empty string restores CSS-defined display value
        if (techHeroLayout)     techHeroLayout.style.display     = isTech ? '' : 'none';
        if (creativeHeroLayout) creativeHeroLayout.style.display = isTech ? 'none' : 'grid';

        // Toggle module wrappers
        if (technicalModules) technicalModules.style.display = isTech ? 'block' : 'none';
        if (creativeModules)  creativeModules.style.display  = isTech ? 'none'  : 'block';

        // Background image
        if (bgImageElement) {
            bgImageElement.style.backgroundImage = isTech
                ? "url('./assets/bg-images/tech-bg.png')"
                : "url('./assets/bg-images/creative-bg.png')";
        }

        // After display change, observe newly visible reveal-up elements
        if (!isTech) {
            requestAnimationFrame(() => {
                if (creativeHeroLayout) observeRevealElements(creativeHeroLayout);
                if (creativeModules)    observeRevealElements(creativeModules);
                loadPhotoGallery(); // lazy-load gallery on first creative open
            });
        }

        generateDynamicNavbar();
        resetCarouselTracks();
    }

    masterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            masterTabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected','false'); });
            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');
            switchWorkspace(tab.getAttribute('data-workspace'));
        });
    });

    // =====================================================
    // NESTED TAB DISPATCHER (Projects/Certs, Edu, Brand panels)
    // =====================================================
    function setupTabSwitching(tabClass, panelClass, attr) {
        document.body.addEventListener('click', (e) => {
            const clicked = e.target.closest('.' + tabClass);
            if (!clicked) return;
            const container = clicked.parentElement;
            const parent    = container.parentElement;
            const targetId  = clicked.getAttribute(attr);

            container.querySelectorAll('.' + tabClass).forEach(t => {
                t.classList.remove('active'); t.setAttribute('aria-selected','false');
            });
            parent.querySelectorAll('.' + panelClass).forEach(p => p.classList.remove('active'));

            clicked.classList.add('active');
            clicked.setAttribute('aria-selected', 'true');

            const panel = document.getElementById(targetId);
            if (panel) {
                panel.classList.add('active');
                const innerTrack = panel.querySelector('.carousel-track');
                if (innerTrack) evaluateArrowLimits(innerTrack);
            }
        });
    }

    setupTabSwitching('nested-tab', 'nested-panel', 'data-sub-target');
    setupTabSwitching('logo-tab',   'brand-panel',  'data-brand-target');

    // =====================================================
    // CAROUSEL ENGINE (JS offset var — no fragile matrix parsing)
    // =====================================================
    const carouselOffsets = {};
    const getOffset = id    => carouselOffsets[id] || 0;
    const setOffset = (id,v) => { carouselOffsets[id] = v; };

    function evaluateArrowLimits(track) {
        if (!track) return;
        const wrapper   = track.closest('.carousel-wrapper');
        if (!wrapper) return;
        const leftBtn   = wrapper.querySelector('.carousel-arrow--left');
        const rightBtn  = wrapper.querySelector('.carousel-arrow--right');
        const container = wrapper.querySelector('.carousel-container');
        if (!leftBtn || !rightBtn || !container) return;
        const maxScroll = track.scrollWidth - container.clientWidth;
        const currentX  = Math.abs(getOffset(track.id));
        leftBtn.disabled  = currentX <= 2;
        rightBtn.disabled = currentX >= maxScroll - 2 || maxScroll <= 0;
    }

    document.querySelectorAll('.carousel-arrow').forEach(arrow => {
        arrow.addEventListener('click', () => {
            const trackId   = arrow.getAttribute('data-track-id');
            const track     = document.getElementById(trackId);
            if (!track) return;
            const container = track.parentElement;
            const STEP      = 320;
            const maxScroll = track.scrollWidth - container.clientWidth;
            let cur         = getOffset(trackId);

            if (arrow.classList.contains('carousel-arrow--left')) {
                cur = Math.min(cur + STEP, 0);
            } else {
                cur = Math.max(cur - STEP, -maxScroll);
            }
            setOffset(trackId, cur);
            track.style.transform = `translateX(${cur}px)`;
            setTimeout(() => evaluateArrowLimits(track), 420);
        });
    });

    function resetCarouselTracks() {
        document.querySelectorAll('.carousel-track').forEach(track => {
            if (!track.id) return;
            setOffset(track.id, 0);
            track.style.transform = 'translateX(0px)';
            setTimeout(() => evaluateArrowLimits(track), 250);
        });
    }

    window.addEventListener('resize', resetCarouselTracks);

    // =====================================================
    // GITHUB REPOSITORIES + DYNAMIC PROJECT COUNT STAT
    // =====================================================
    // GITHUB REPOSITORIES + README DESCRIPTIONS
    // =====================================================

    // =====================================================
    // GITHUB — single API call does both count + carousel
    // =====================================================

    const GH_CACHE = {
        get: (k)    => { try { const v = sessionStorage.getItem(k); return v ? JSON.parse(v) : null; } catch { return null; } },
        set: (k, v) => { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch {} },
        clear: (k)  => { try { sessionStorage.removeItem(k); } catch {} }
    };

    // Clear any stale/broken cached data from previous failed loads
    ['gh_repos', 'gh_user', 'gh_rate'].forEach(k => {
        const v = GH_CACHE.get(k);
        // If cached value is null or not an array/object with real data, discard it
        if (v !== null && (Array.isArray(v) ? v.length === 0 : typeof v !== 'object')) {
            GH_CACHE.clear(k);
        }
    });

    function extractReadmeSummary(raw) {
        const lines = raw.split('\n');
        for (const line of lines) {
            const clean = line
                .replace(/<!--[\s\S]*?-->/g, '')
                .replace(/!\[.*?\]\(.*?\)/g, '')
                .replace(/\[([^\]]+)\]\(.*?\)/g, '$1')
                .replace(/[`*_>#~\-=|]/g, '')
                .replace(/\s+/g, ' ')
                .trim();

            if (
                clean.length < 30 ||
                /^#+/.test(line) ||
                /shields\.io|badge|travis|coverage|npm|build|status/i.test(clean) ||
                /^\s*[-*+]\s/.test(line)
            ) continue;

            return clean.slice(0, 140) + (clean.length > 140 ? '…' : '');
        }
        return null;
    }

    // Stat counter — completely isolated, no shared state with carousel
    async function loadGitHubRepoCount() {
        const projEl = document.getElementById('stat-projects');
        if (!projEl) return;

        // Use cached repos list length if available (set by loadGitHubRepositories)
        const cached = GH_CACHE.get('gh_repos');
        if (Array.isArray(cached) && cached.length > 0) {
            projEl.textContent = cached.length + '+';
            return;
        }

        // Otherwise fire a direct lightweight fetch
        try {
            const res = await fetch('https://api.github.com/users/IshanM1997', {
                headers: { Accept: 'application/vnd.github.v3+json' }
            });
            if (!res.ok) return; // leave as "—" rather than show wrong number
            const user = await res.json();
            if (user.public_repos != null) {
                projEl.textContent = user.public_repos + '+';
            }
        } catch { /* silent — leave stat as "—" */ }
    }

    async function loadGitHubRepositories() {
        const track  = document.getElementById('github-track');
        const projEl = document.getElementById('stat-projects');
        if (!track) return;

        track.innerHTML = '<div style="padding:1rem;color:var(--text-muted);font-size:0.85rem">'
            + '<i class="fas fa-spinner fa-spin" style="margin-right:0.5rem"></i>Fetching repositories…</div>';

        try {
            // ── Single call: per_page=100 gives us accurate total count AND full list ──
            let data = GH_CACHE.get('gh_repos');

            if (!Array.isArray(data) || data.length === 0) {
                const res = await fetch(
                    'https://api.github.com/users/IshanM1997/repos?sort=updated&per_page=100',
                    { headers: { Accept: 'application/vnd.github.v3+json' } }
                );

                if (!res.ok) {
                    const status = res.status;
                    console.warn('GitHub repos fetch failed:', status);
                    track.innerHTML = `<div style="padding:1rem;color:var(--text-muted);font-size:0.85rem">
                        <i class="fas fa-exclamation-circle" style="color:var(--accent);margin-right:0.5rem"></i>
                        Could not load repositories (HTTP ${status}) —
                        <a href="https://github.com/IshanM1997" target="_blank"
                           rel="noopener noreferrer" style="color:var(--accent)">view on GitHub ↗</a>
                    </div>`;
                    return;
                }

                data = await res.json();
                GH_CACHE.set('gh_repos', data);
            }

            // ── Update the stat counter with the real total count ──
            if (projEl) projEl.textContent = data.length + '+';

            // ── Filter for carousel display (no forks, no profile-readme, max 10) ──
            const filtered = data
                .filter(r => !r.fork && r.name.toLowerCase() !== 'ishanm1997')
                .slice(0, 10);

            if (filtered.length === 0) {
                track.innerHTML = '<div style="padding:1rem;color:var(--text-muted)">No public repositories found.</div>';
                return;
            }

            // ── Pass 1: render cards immediately from repos list ──
            track.innerHTML = '';
            filtered.forEach(repo => {
                const card = document.createElement('a');
                card.href      = repo.html_url;
                card.target    = '_blank';
                card.rel       = 'noopener noreferrer';
                card.className = 'carousel-item-card';

                card.innerHTML = `
                    <div>
                        <h5 class="project-title">${repo.name.replace(/[-_]/g, ' ')}</h5>
                        <p class="project-desc" id="rdesc-${repo.name}">${
                            repo.description ||
                            '<span class="desc-loading">Loading description…</span>'
                        }</p>
                    </div>
                    <div class="project-stats">
                        <span><i class="fas fa-star" style="margin-right:0.25rem"></i>${repo.stargazers_count}</span>
                        <span><i class="fas fa-code-branch" style="margin-right:0.25rem"></i>${repo.forks_count}</span>
                        ${repo.language
                            ? `<span><i class="fas fa-circle" style="font-size:.5rem;vertical-align:middle;margin-right:0.25rem"></i>${repo.language}</span>`
                            : ''}
                    </div>`;
                track.appendChild(card);
            });

            setTimeout(() => evaluateArrowLimits(track), 150);

            // ── Pass 2: try README descriptions (best-effort, won't block UI) ──
            // Each README is a separate API call — only run if we have quota headroom.
            // We start fetching immediately; if a single one 403s we stop the rest.
            let rateLimitExhausted = false;

            await Promise.allSettled(
                filtered.map(async repo => {
                    if (rateLimitExhausted) return;

                    const cacheKey = `rdme_${repo.name}`;
                    let summary = GH_CACHE.get(cacheKey); // may be a string or null

                    if (summary === null || summary === undefined) {
                        try {
                            const r = await fetch(
                                `https://api.github.com/repos/IshanM1997/${repo.name}/readme`,
                                { headers: { Accept: 'application/vnd.github.v3+json' } }
                            );
                            if (r.status === 403 || r.status === 429) {
                                rateLimitExhausted = true;
                                GH_CACHE.set(cacheKey, ''); // cache empty to skip next time
                                return;
                            }
                            if (r.ok) {
                                const json = await r.json();
                                const raw  = atob(json.content.replace(/\n/g, ''));
                                summary    = extractReadmeSummary(raw) || '';
                                GH_CACHE.set(cacheKey, summary);
                            } else {
                                GH_CACHE.set(cacheKey, '');
                                return;
                            }
                        } catch {
                            GH_CACHE.set(cacheKey, '');
                            return;
                        }
                    }

                    const descEl = document.getElementById(`rdesc-${repo.name}`);
                    if (!descEl) return;

                    if (summary) {
                        descEl.textContent = summary;
                    } else if (!repo.description) {
                        descEl.textContent = 'A software project by Ishan Mukhopadhyay.';
                    }
                })
            );

            // Clean up any remaining "Loading description…" shimmer spans
            filtered.forEach(repo => {
                const el = document.getElementById(`rdesc-${repo.name}`);
                if (el && el.querySelector('.desc-loading')) {
                    el.textContent = repo.description || 'A software project by Ishan Mukhopadhyay.';
                }
            });

        } catch (err) {
            console.error('loadGitHubRepositories error:', err);
            track.innerHTML = `<div style="padding:1rem;color:var(--text-muted);font-size:0.85rem">
                <i class="fas fa-exclamation-circle" style="color:var(--accent);margin-right:0.5rem"></i>
                Could not load repositories —
                <a href="https://github.com/IshanM1997" target="_blank"
                   rel="noopener noreferrer" style="color:var(--accent)">view on GitHub ↗</a>
            </div>`;
        }
    }

    // =====================================================
    // CREATIVE PHOTO GALLERY (replaces Blog section)
    //
    // =====================================================
    // CREATIVE PHOTO GALLERY
    //
    // HOW TO ADD YOUR PHOTOS:
    //   1. Create folder: assets/gallery/
    //   2. Add your photos named: photo1.jpg, photo2.jpg ... photo9.jpg
    //   3. Update the PHOTOS array below with your real captions & tags
    //   4. Reload — gallery appears automatically
    // =====================================================
    let galleryLoaded = false;

    // ── Edit this array with your actual photo details ──
    const PHOTOS = [
        { file: 'photo1.jpg',  caption: 'Streets of Kolkata',     tag: 'Street'       },
        { file: 'photo2.jpg',  caption: 'Golden Hour, Rajasthan',  tag: 'Travel'       },
        { file: 'photo3.jpg',  caption: 'Festival of Colours',     tag: 'Documentary'  },
        { file: 'photo4.jpg',  caption: 'Monsoon Reflections',     tag: 'Nature'       },
        { file: 'photo5.jpg',  caption: 'Temple Silhouette',       tag: 'Architecture' },
        { file: 'photo6.jpg',  caption: 'Market at Dawn',          tag: 'Street'       },
        { file: 'photo7.jpg',  caption: 'Riverside at Dusk',       tag: 'Travel'       },
        { file: 'photo8.jpg',  caption: 'Village Life',            tag: 'Documentary'  },
        { file: 'photo9.jpg',  caption: 'Old City Lanes',          tag: 'Street'       },
    ];

    const GALLERY_BASE = './assets/gallery/';

    // Check if an image URL actually loads (returns a promise)
    function imageExists(url) {
        return new Promise(resolve => {
            const img = new Image();
            img.onload  = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = url;
        });
    }

    async function loadPhotoGallery() {
        if (galleryLoaded) return;
        galleryLoaded = true;

        const grid = document.getElementById('photo-gallery-grid');
        if (!grid) return;

        // Show loading state
        grid.innerHTML = `<div class="gallery-placeholder">
            <i class="fas fa-circle-notch fa-spin"></i>
            <p>Loading gallery…</p>
        </div>`;

        // Probe each photo — only include ones that actually load
        const checks = await Promise.all(
            PHOTOS.map(async photo => {
                const url = GALLERY_BASE + photo.file;
                const ok  = await imageExists(url);
                return ok ? { ...photo, url } : null;
            })
        );

        const available = checks.filter(Boolean);

        grid.innerHTML = '';

        if (available.length === 0) {
            // No photos found — show a friendly setup guide instead of broken images
            grid.innerHTML = `
                <div class="gallery-setup-guide">
                    <div class="setup-icon"><i class="fas fa-camera-retro"></i></div>
                    <h4>Add Your Photos</h4>
                    <p>Create the folder <code>assets/gallery/</code> in your project and drop your photos in — named <code>photo1.jpg</code> through <code>photo9.jpg</code>. Then update the captions in the <code>PHOTOS</code> array inside <code>script.js</code>.</p>
                    <div class="setup-steps">
                        <div class="setup-step"><span class="step-num">1</span><span>Create <code>assets/gallery/</code> folder</span></div>
                        <div class="setup-step"><span class="step-num">2</span><span>Add <code>photo1.jpg</code> … <code>photo9.jpg</code></span></div>
                        <div class="setup-step"><span class="step-num">3</span><span>Edit captions in <code>script.js → PHOTOS</code></span></div>
                        <div class="setup-step"><span class="step-num">4</span><span>Reload — gallery appears automatically</span></div>
                    </div>
                    <a href="https://www.instagram.com/ishan_mukherjee_1997" target="_blank" rel="noopener noreferrer" class="btn-primary-creative" style="display:inline-flex;align-items:center;gap:0.5rem;margin-top:1.5rem">
                        <i class="fab fa-instagram"></i> View on Instagram
                    </a>
                </div>`;
            return;
        }

        // Render available photos
        available.forEach(photo => {
            const card = document.createElement('div');
            card.className = 'photo-card reveal-up';
            card.setAttribute('role', 'button');
            card.setAttribute('tabindex', '0');
            card.setAttribute('aria-label', 'View: ' + photo.caption);
            card.innerHTML = `
                <div class="photo-card-img-wrap">
                    <img src="${photo.url}"
                         alt="${photo.caption}"
                         class="photo-card-img"
                         loading="lazy">
                    <div class="photo-card-overlay">
                        <span class="photo-tag">${photo.tag}</span>
                        <p class="photo-caption">${photo.caption}</p>
                    </div>
                </div>`;
            grid.appendChild(card);
        });

        requestAnimationFrame(() => observeRevealElements(grid));
    }

    // =====================================================
    // LIGHTBOX (click gallery photo to expand)
    // =====================================================
    const lightbox      = document.getElementById('photo-lightbox');
    const lightboxImg   = document.getElementById('lightbox-img');
    const lightboxCap   = document.getElementById('lightbox-caption');
    const lightboxClose = document.getElementById('lightbox-close');

    if (lightbox && lightboxImg && lightboxClose) {
        document.body.addEventListener('click', (e) => {
            const card = e.target.closest('.photo-card');
            if (!card) return;
            const img = card.querySelector('.photo-card-img');
            const cap = card.querySelector('.photo-caption');
            if (!img) return;
            lightboxImg.src = img.src;
            if (lightboxCap && cap) lightboxCap.textContent = cap.textContent;
            lightbox.classList.add('active');
            document.body.style.overflow = 'hidden';
        });

        function closeLightbox() {
            lightbox.classList.remove('active');
            document.body.style.overflow = '';
        }

        lightboxClose.addEventListener('click', closeLightbox);
        lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });
    }

    // =====================================================
    // DYNAMIC NAVBAR
    // =====================================================
    function generateDynamicNavbar() {
        const menu = document.getElementById('nav-menu');
        if (!menu) return;
        const isTech = document.body.classList.contains('workspace-technical');

        let html = `<a href="#about" class="nav-link active" data-tooltip="About" data-section="about"><i class="fas fa-user"></i></a>`;

        if (isTech) {
            html += `
                <a href="#tech-works"      class="nav-link" data-tooltip="Works"      data-section="tech-works"><i class="fas fa-laptop-code"></i></a>
                <a href="#tech-experience" class="nav-link" data-tooltip="Experience" data-section="tech-experience"><i class="fas fa-briefcase"></i></a>
                <a href="#tech-education"  class="nav-link" data-tooltip="Education"  data-section="tech-education"><i class="fas fa-graduation-cap"></i></a>`;
        } else {
            html += `
                <a href="#creative-achievements" class="nav-link" data-tooltip="Awards"  data-section="creative-achievements"><i class="fas fa-award"></i></a>
                <a href="#creative-gallery"       class="nav-link" data-tooltip="Gallery" data-section="creative-gallery"><i class="fas fa-images"></i></a>`;
        }

        html += `<a href="#contact" class="nav-link" data-tooltip="Contact" data-section="contact"><i class="fas fa-paper-plane"></i></a>`;
        menu.innerHTML = html;

        // Re-attach scroll spy after navbar is rebuilt
        attachScrollSpy();
    }

    // =====================================================
    // SCROLL SPY — highlights active nav icon on scroll
    // =====================================================
    let scrollSpyObserver = null;

    function attachScrollSpy() {
        // Disconnect previous observer if workspace switched
        if (scrollSpyObserver) scrollSpyObserver.disconnect();

        const navLinks = document.querySelectorAll('.nav-menu .nav-link[data-section]');
        if (!navLinks.length) return;

        // Collect all section IDs referenced by the current navbar
        const sectionIds = Array.from(navLinks).map(l => l.getAttribute('data-section'));
        const sections   = sectionIds.map(id => document.getElementById(id)).filter(Boolean);

        // Which section is most visible — track visible entry with highest intersection ratio
        const visibilityMap = {};

        scrollSpyObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                visibilityMap[entry.target.id] = entry.intersectionRatio;
            });

            // Find the section with the highest visibility ratio
            let bestId   = null;
            let bestRatio = 0;
            for (const [id, ratio] of Object.entries(visibilityMap)) {
                if (ratio > bestRatio) { bestRatio = ratio; bestId = id; }
            }

            if (!bestId) return;

            // Update active class on all nav links
            navLinks.forEach(link => {
                const matches = link.getAttribute('data-section') === bestId;
                link.classList.toggle('active', matches);
            });
        }, {
            // rootMargin pulls the trigger zone to the upper third of the viewport
            rootMargin: '-10% 0px -60% 0px',
            threshold: [0, 0.1, 0.25, 0.5, 0.75, 1.0]
        });

        sections.forEach(sec => scrollSpyObserver.observe(sec));
    }

    // =====================================================
    // HAMBURGER MENU
    // =====================================================
    const hamburger = document.getElementById('hamburger');
    const navMenu   = document.getElementById('nav-menu');
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            const icon = hamburger.querySelector('i');
            icon.classList.toggle('fa-bars');
            icon.classList.toggle('fa-times');
        });
        navMenu.addEventListener('click', (e) => {
            if (e.target.closest('.nav-link')) {
                navMenu.classList.remove('active');
                const icon = hamburger.querySelector('i');
                icon.classList.add('fa-bars');
                icon.classList.remove('fa-times');
            }
        });
    }

    // =====================================================
    // INITIALISATION
    // =====================================================
    // Fire count and carousel in parallel — neither blocks the other
    loadGitHubRepoCount();
    loadGitHubRepositories();
    generateDynamicNavbar();
    setTimeout(resetCarouselTracks, 400);

});
