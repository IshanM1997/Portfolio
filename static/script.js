document.addEventListener('DOMContentLoaded', () => {

    // --- Dynamic Favicon Processing Node ---
    const originalImageSrc = './assets/images/DP.png';
    const faviconElement = document.getElementById('favicon');
    const img = new Image();
    img.src = originalImageSrc;
    img.crossOrigin = 'anonymous';
    img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 128;
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.beginPath(); ctx.arc(size/2, size/2, size/2, 0, Math.PI*2); ctx.clip();
        let srcX = 0, srcY = 0, srcW = img.width, srcH = img.height;
        if (img.width > img.height) { srcW = img.height; srcX = (img.width - img.height) / 2; } 
        else if (img.height > img.width) { srcH = img.width; srcY = (img.height - img.width) / 2; }
        ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, size, size);
        if (faviconElement) faviconElement.href = canvas.toDataURL('image/png');
    };

    // --- WORKSPACE OVERSEER MATRIX & DYNAMIC BACKGROUNDS ---
    const masterTabs = document.querySelectorAll('.master-nav-tab');
    const roleBadge = document.getElementById('about-role-badge');
    const technicalModules = document.getElementById('technical-modules-wrapper');
    const creativeModules = document.getElementById('creative-modules-wrapper');
    const bgVideoElement = document.getElementById('bg-video-element');

    masterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            masterTabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');

            const selectedWorkspace = tab.getAttribute('data-workspace');

            if (selectedWorkspace === 'technical-workspace') {
                document.getElementById('tab-technical').classList.add('active');
                document.getElementById('tab-creative').classList.remove('active');
                if (roleBadge) roleBadge.textContent = 'Software Engineer';
                
                technicalModules.style.display = 'block';
                creativeModules.style.display = 'none';
                
                if (bgVideoElement) {
                    bgVideoElement.src = './assets/videos/tech.mp4';
                    bgVideoElement.play().catch(() => {});
                }
            } else {
                document.getElementById('tab-technical').classList.remove('active');
                document.getElementById('tab-creative').classList.add('active');
                if (roleBadge) roleBadge.textContent = 'Explorer & Photographer';

                technicalModules.style.display = 'none';
                creativeModules.style.display = 'block';
                
                // 1. Generate the grid layout elements dynamically
                loadInstagramMockStream();
                
                // 2. Re-track the scroll visibility engine for newly loaded components
                const creativeItems = creativeModules.querySelectorAll('.reveal-up');
                creativeItems.forEach(el => revealObserver.observe(el));
                
                if (bgVideoElement) {
                    bgVideoElement.src = './assets/videos/creative.mp4';
                    bgVideoElement.play().catch(() => {});
                }
            }
            generateDynamicNavbar();
            resetCarouselTracks();
        });
    });

    // --- INTERACTIVE NESTED TAB DISPATCHER ---
    const setupTabSwitching = (tabClass, panelClass, attributeData) => {
        document.body.addEventListener('click', (e) => {
            const clickedTab = e.target.closest(`.${tabClass}`);
            if (!clickedTab) return;

            const tabContainer = clickedTab.parentElement;
            const targetId = clickedTab.getAttribute(attributeData);
            const parentSection = tabContainer.parentElement;

            tabContainer.querySelectorAll(`.${tabClass}`).forEach(t => {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
            });
            parentSection.querySelectorAll(`.${panelClass}`).forEach(p => p.classList.remove('active'));

            clickedTab.classList.add('active');
            clickedTab.setAttribute('aria-selected', 'true');
            const targetPanel = document.getElementById(targetId);
            if (targetPanel) {
                targetPanel.classList.add('active');
                const innerTrack = targetPanel.querySelector('.carousel-track');
                if (innerTrack) evaluateArrowLimits(innerTrack);
            }
        });
    };

    setupTabSwitching('nested-tab', 'nested-panel', 'data-sub-target');
    setupTabSwitching('logo-tab', 'brand-panel', 'data-brand-target');

    // --- CAROUSEL LOCOMOTION ROUTINES ---
    const evaluateArrowLimits = (track) => {
        if (!track) return;
        const wrapper = track.closest('.carousel-wrapper');
        if (!wrapper) return;
        const leftBtn = wrapper.querySelector('.carousel-arrow--left');
        const rightBtn = wrapper.querySelector('.carousel-arrow--right');
        const container = wrapper.querySelector('.carousel-container');
        if (!leftBtn || !rightBtn || !container) return;

        const maxScroll = track.scrollWidth - container.clientWidth;
        const transformMatrix = window.getComputedStyle(track).transform;
        let currentX = 0;
        if (transformMatrix !== 'none') {
            currentX = Math.abs(parseInt(transformMatrix.split(',')[4]));
        }

        leftBtn.disabled = currentX <= 5;
        rightBtn.disabled = currentX >= maxScroll - 5 || maxScroll <= 0;
    };

    document.querySelectorAll('.carousel-arrow').forEach(arrow => {
        arrow.addEventListener('click', () => {
            const trackId = arrow.getAttribute('data-track-id');
            const track = document.getElementById(trackId);
            if (!track) return;
            const container = track.parentElement;
            
            const transformMatrix = window.getComputedStyle(track).transform;
            let currentX = 0;
            if (transformMatrix !== 'none') currentX = parseInt(transformMatrix.split(',')[4]);

            const shiftStep = 310;
            if (arrow.classList.contains('carousel-arrow--left')) {
                currentX = Math.min(currentX + shiftStep, 0);
            } else {
                const maxScroll = -(track.scrollWidth - container.clientWidth);
                currentX = Math.max(currentX - shiftStep, maxScroll);
            }

            track.style.transform = `translateX(${currentX}px)`;
            setTimeout(() => evaluateArrowLimits(track), 450);
        });
    });

    const resetCarouselTracks = () => {
        document.querySelectorAll('.carousel-track').forEach(track => {
            track.style.transform = 'translateX(0px)';
            setTimeout(() => evaluateArrowLimits(track), 200);
        });
    };

    window.addEventListener('resize', resetCarouselTracks);

    // --- DYNAMIC REPOSITORIES STREAM ENGINE (GITHUB) ---
    const loadGitHubRepositories = async () => {
        const track = document.getElementById('github-track');
        if (!track) return;
        try {
            const response = await fetch('https://api.github.com/users/IshanM1997/repos?sort=updated&per_page=6');
            if (!response.ok) throw new Error();
            const data = await response.json();
            track.innerHTML = '';
            data.forEach(repo => {
                const node = document.createElement('a');
                node.href = repo.html_url;
                node.target = '_blank';
                node.className = 'carousel-item-card';
                node.innerHTML = `
                    <div>
                        <h5 class="project-title">${repo.name}</h5>
                        <p class="project-desc">${repo.description || 'Production software components and architectural logic configurations.'}</p>
                    </div>
                    <div class="project-stats">
                        <span><i class="fas fa-star me-1"></i>${repo.stargazers_count}</span>
                        <span><i class="fas fa-code-branch me-1"></i>${repo.forks_count}</span>
                    </div>
                `;
                track.appendChild(node);
            });
            evaluateArrowLimits(track);
        } catch {
            track.innerHTML = '<div class="p-3 text-danger">Integration connection dropped. Checkout profile directly.</div>';
        }
    };

    // --- DYNAMIC INSTAGRAM DATA STREAM ---
    const loadInstagramMockStream = () => {
        const container = document.getElementById('instagram-stream-target');
        if (!container || container.querySelector('.instagram-post-wrapper')) return;

        container.innerHTML = '';
        const captureCategories = [
            { name: 'Street', id: 'CtA98bOx1aA' },
            { name: 'Documentary', id: 'CrM71xLz4bB' },
            { name: 'Travel', id: 'CgP25pKy8cC' },
            { name: 'Architecture', id: 'CfO12qWw9dD' },
            { name: 'Portrait', id: 'CdK34eRm2eE' },
            { name: 'Landscape', id: 'CcJ89tVp3fF' }
        ];
        
        captureCategories.forEach((cat) => {
            const post = document.createElement('a');
            post.href = `https://www.instagram.com/ishan_mukherjee_1997`;
            post.target = "_blank";
            post.className = "instagram-post-wrapper reveal-up";
            post.innerHTML = `
                <div class="instagram-image-skeleton">
                    <i class="fas fa-camera visual-fallback-icon"></i>
                    <span class="instagram-tag-overlay">#${cat.name}</span>
                </div>
                <div class="instagram-hover-stats">
                    <span><i class="fab fa-instagram me-2"></i>View Post</span>
                </div>
            `;
            container.appendChild(post);
        });
    };

    // --- DYNAMIC NAVIGATION DEPLOYMENT REGIME (ICONIZED) ---
    const generateDynamicNavbar = () => {
        const menu = document.getElementById('nav-menu');
        if (!menu) return;
        
        menu.innerHTML = `
            <a href="#about" class="nav-link active" data-tooltip="About">
                <i class="fas fa-user"></i>
            </a>
        `;
        
        if (technicalModules.style.display !== 'none') {
            menu.innerHTML += `
                <a href="#tech-works" class="nav-link" data-tooltip="Works">
                    <i class="fas fa-laptop-code"></i>
                </a>
                <a href="#tech-experience" class="nav-link" data-tooltip="Experience">
                    <i class="fas fa-briefcase"></i>
                </a>
                <a href="#tech-education" class="nav-link" data-tooltip="Education">
                    <i class="fas fa-graduation-cap"></i>
                </a>
            `;
        } else {
            menu.innerHTML += `
                <a href="#creative-works" class="nav-link" data-tooltip="My Works">
                    <i class="fas fa-camera"></i>
                </a>
                <a href="#creative-achievements" class="nav-link" data-tooltip="Achievements">
                    <i class="fas fa-award"></i>
                </a>
            `;
        }
        
        menu.innerHTML += `
            <a href="#contact" class="nav-link" data-tooltip="Contact">
                <i class="fas fa-paper-plane"></i>
            </a>
        `;
    };

    // --- SOCIAL APPRECIATION TRANSACTION LAYER ---
    const likeBtn = document.getElementById('like-btn');
    const likeCount = document.getElementById('like-count');
    const likeThanks = document.getElementById('like-thanks');
    let countVal = parseInt(localStorage.getItem('p_likes') || '0');
    let stateActive = localStorage.getItem('p_state') === 'true';

    if (likeCount) likeCount.textContent = countVal;
    if (stateActive && likeBtn) likeBtn.classList.add('liked');

    if (likeBtn) {
        likeBtn.addEventListener('click', () => {
            if (!stateActive) {
                countVal++; stateActive = true;
                localStorage.setItem('p_likes', countVal);
                localStorage.setItem('p_state', 'true');
                if (likeCount) likeCount.textContent = countVal;
                likeBtn.classList.add('liked');
                if (likeThanks) { likeThanks.textContent = '🎉 Thank you!'; setTimeout(() => likeThanks.textContent='', 2000); }
            }
        });
    }

    // --- Hamburger Mobile Execution System ---
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            hamburger.querySelector('i').classList.toggle('fa-bars');
            hamburger.querySelector('i').classList.toggle('fa-times');
        });
    }

    // --- Scroll-Driven Component Reveal System ---
    const revealElements = document.querySelectorAll('.reveal-up');
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('revealed');
        });
    }, { threshold: 0.08 });
    revealElements.forEach(el => revealObserver.observe(el));

    // Run Initializations
    loadGitHubRepositories();
    generateDynamicNavbar();
    setTimeout(resetCarouselTracks, 400);
});
