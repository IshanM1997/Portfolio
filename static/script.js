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
    const bgImageElement = document.getElementById('bg-image-element');

    // Default Initialization Image
    if (bgImageElement) {
        bgImageElement.style.backgroundImage = "url('./assets/bg-images/tech-bg.png')"; // Add your tech background image path here later
    }

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('revealed');
        });
    }, { threshold: 0.08 });

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
                
                if (technicalModules) technicalModules.style.display = 'block';
                if (creativeModules) creativeModules.style.display = 'none';
                
                // Dynamic Background Switching For Tech Workspace
                if (bgImageElement) {
                    bgImageElement.style.backgroundImage = "url('./assets/bg-images/tech-bg.png')"; // Change to your desired asset
                }
            } else {
                document.getElementById('tab-technical').classList.remove('active');
                document.getElementById('tab-creative').classList.add('active');
                if (roleBadge) roleBadge.textContent = 'Explorer & Photographer';

                if (technicalModules) technicalModules.style.display = 'none';
                if (creativeModules) creativeModules.style.display = 'block';
                
                // Initialize modern blog feed pipeline cleanly
                loadBlogCarouselFeed();
                
                // Re-track lazy items safely dynamically
                if (creativeModules) {
                    const creativeItems = creativeModules.querySelectorAll('.reveal-up');
                    creativeItems.forEach(el => revealObserver.observe(el));
                }
                
                // Dynamic Background Switching For Creative Workspace
                if (bgImageElement) {
                    bgImageElement.style.backgroundImage = "url('./assets/bg-images/creative-bg.jpg')"; // Change to your desired asset
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

            const shiftStep = 330; // Updated alignment margin to map blog elements cleanly
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

    // --- NEW ENGINE: DYNAMIC BLOG STREAM CAROUSEL DATA AGGREGATION ---
    const loadBlogCarouselFeed = () => {
        const track = document.getElementById('blog-stream-track');
        if (!track || track.querySelector('.blog-carousel-item')) return;

        track.innerHTML = '';

        // Add your target URLs and cover image placements inside this configuration mock dictionary
        const mockBlogFeeds = [
            {
                title: "Architecting Scalable Microservices with Spring Boot",
                description: "Delve deep inside core patterns for scaling message pipelines and distributed transaction layers securely without performance leaks.",
                blogName: "Tech Horizon Blog",
                link: "https://medium.com", 
                coverImage: "./assets/images/blog1.jpg" // You can replace this path later
            },
            {
                title: "The Art of Visual Documentation and Street Framing",
                description: "Capturing urban environments gracefully through geometric lines, high contrast shadows, and dynamic subject integration workflow routines.",
                blogName: "Shutter Explorer",
                link: "https://dev.to",
                coverImage: "./assets/images/blog2.jpg" // You can replace this path later
            },
            {
                title: "Optimizing Enterprise Pipelines for Zero Lag Analytics",
                description: "A look into dimensional schema tuning, localized cache structures, and database query strategy patterns designed for high throughput systems.",
                blogName: "Data Engine Hub",
                link: "https://medium.com",
                coverImage: "./assets/images/blog3.jpg" // You can replace this path later
            }
        ];

        mockBlogFeeds.forEach(feed => {
            const card = document.createElement('a');
            card.href = feed.link;
            card.target = "_blank";
            card.className = "blog-carousel-item";
            card.innerHTML = `
                <div class="blog-cover-img-wrapper">
                    <img src="${feed.coverImage}" alt="${feed.title}" class="blog-cover-img" onerror="this.src='https://images.unsplash.com/photo-1546074177-ffebd9a84d3c?q=80&w=600&auto=format&fit=crop'">
                </div>
                <div class="blog-card-details">
                    <div>
                        <div class="blog-site-badge"><i class="fas fa-bookmark me-1"></i>${feed.blogName}</div>
                        <h5 class="blog-card-title">${feed.title}</h5>
                        <p class="blog-card-desc">${feed.description}</p>
                    </div>
                </div>
            `;
            track.appendChild(card);
        });

        // Trigger dynamic metrics tracking validation
        setTimeout(() => evaluateArrowLimits(track), 300);
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
        
        if (technicalModules && technicalModules.style.display !== 'none') {
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
                <a href="#creative-works" class="nav-link" data-tooltip="My Blogs">
                    <i class="fas fa-newspaper"></i>
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
    revealElements.forEach(el => {
        if (el.closest('#creative-modules-wrapper') === null) {
            revealObserver.observe(el);
        }
    });

    // Run Initializations Safely
    loadGitHubRepositories();
    generateDynamicNavbar();
    setTimeout(resetCarouselTracks, 400);
});