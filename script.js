document.addEventListener('DOMContentLoaded', () => {

    // --- Dynamic Circular Favicon Cropper ---
    const originalImageSrc = 'my-profile.png';
    const faviconElement = document.getElementById('favicon');

    const img = new Image();
    img.src = originalImageSrc;
    img.crossOrigin = 'anonymous';

    img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 128;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        let srcX = 0, srcY = 0, srcWidth = img.width, srcHeight = img.height;
        if (img.width > img.height) {
            srcWidth = img.height;
            srcX = (img.width - img.height) / 2;
        } else if (img.height > img.width) {
            srcHeight = img.width;
            srcY = (img.height - img.width) / 2;
        }

        ctx.drawImage(img, srcX, srcY, srcWidth, srcHeight, 0, 0, size, size);
        if (faviconElement) faviconElement.href = canvas.toDataURL('image/png');
    };

    // --- Mobile Navigation Menu Toggle ---
    const hamburger = document.getElementById('hamburger');
    const navMenu   = document.getElementById('nav-menu');
    const navLinks  = document.querySelectorAll('.nav-link');

    const toggleMenu = () => {
        navMenu.classList.toggle('active');
        const icon = hamburger.querySelector('i');
        icon.classList.toggle('fa-bars');
        icon.classList.toggle('fa-times');
    };

    hamburger.addEventListener('click', toggleMenu);
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (navMenu.classList.contains('active')) toggleMenu();
        });
    });

    // --- Scroll-Driven Component Reveal System ---
    const revealElements = document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right');

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('reveal-active');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15, rootMargin: "0px 0px -50px 0px" });

    revealElements.forEach(el => revealObserver.observe(el));

    // --- Active Navigation Link Highlighter ---
    const sections = document.querySelectorAll('section[id]');

    const activeLinkObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${id}`) link.classList.add('active');
                });
            }
        });
    }, { rootMargin: "-30% 0px -70% 0px" });

    sections.forEach(s => activeLinkObserver.observe(s));

    // --- About Section Tabs (Technical / Creative) ---
    const aboutTabs        = document.querySelectorAll('.about-tab');
    const aboutTabContents = document.querySelectorAll('.about-tab-content');
    const roleBadge        = document.getElementById('about-role-badge');

    const roleLabels = {
        technical: 'Software Engineer',
        creative:  'Photographer & Explorer'
    };

    aboutTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.getAttribute('data-tab');

            aboutTabs.forEach(t => {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
            });
            aboutTabContents.forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');
            document.getElementById(`tab-${target}`).classList.add('active');

            if (roleBadge) roleBadge.textContent = roleLabels[target] || '';
        });
    });

    // --- Featured Work Tabs (Projects / Certificates) ---
    const sectionTabs   = document.querySelectorAll('.section-tab');
    const sectionPanels = document.querySelectorAll('.section-panel');

    sectionTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetId = tab.getAttribute('data-section');

            sectionTabs.forEach(t => {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
            });
            sectionPanels.forEach(p => p.classList.remove('active'));

            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');
            document.getElementById(targetId).classList.add('active');
        });
    });

    // --- Horizontal Carousel — Arrow Scroll + Touch Swipe ---
    const updateArrowStates = (track, leftBtn, rightBtn) => {
        leftBtn.disabled  = track.scrollLeft <= 4;
        rightBtn.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
    };

    const initializeCarouselEvents = (wrapper) => {
        const leftBtn  = wrapper.querySelector('.carousel-arrow--left');
        const rightBtn = wrapper.querySelector('.carousel-arrow--right');
        const track    = document.getElementById(leftBtn.getAttribute('data-target'));

        if (!track) return;

        const scrollAmount = () => {
            const card = track.querySelector('.project-card, .cert-card');
            return card ? card.offsetWidth + 24 : 300;
        };

        // Clear previous listeners if any to protect against duplicate hooks
        leftBtn.replaceWith(leftBtn.cloneNode(true));
        rightBtn.replaceWith(rightBtn.cloneNode(true));

        const newLeftBtn  = wrapper.querySelector('.carousel-arrow--left');
        const newRightBtn = wrapper.querySelector('.carousel-arrow--right');

        newLeftBtn.addEventListener('click',  () => track.scrollBy({ left: -scrollAmount(), behavior: 'smooth' }));
        newRightBtn.addEventListener('click', () => track.scrollBy({ left:  scrollAmount(), behavior: 'smooth' }));
        track.addEventListener('scroll',   () => updateArrowStates(track, newLeftBtn, newRightBtn));
        updateArrowStates(track, newLeftBtn, newRightBtn);

        // Touch swipe support for mobile
        let touchStartX = 0;
        let touchStartScroll = 0;

        track.addEventListener('touchstart', (e) => {
            touchStartX      = e.touches[0].clientX;
            touchStartScroll = track.scrollLeft;
        }, { passive: true });

        track.addEventListener('touchmove', (e) => {
            const delta = touchStartX - e.touches[0].clientX;
            track.scrollLeft = touchStartScroll + delta;
        }, { passive: true });

        track.addEventListener('touchend', (e) => {
            const delta = touchStartX - e.changedTouches[0].clientX;
            if (Math.abs(delta) > 50) {
                const amount = scrollAmount();
                track.scrollBy({ left: delta > 0 ? amount : -amount, behavior: 'smooth' });
            }
            updateArrowStates(track, newLeftBtn, newRightBtn);
        }, { passive: true });
    };

    // Run layout event listeners initial hookup for static carousels (Certificates)
    document.querySelectorAll('.carousel-wrapper').forEach(wrapper => {
        const leftBtn = wrapper.querySelector('.carousel-arrow--left');
        if (leftBtn && leftBtn.getAttribute('data-target') !== 'projects-track') {
            initializeCarouselEvents(wrapper);
        }
    });

    // --- Dynamic GitHub Repository Automation ---
    const loadGitHubRepositories = async () => {
        const GITHUB_USERNAME = 'IshanM1997';
        const track = document.getElementById('projects-track');
        const wrapper = track?.closest('.carousel-wrapper');

        if (!track) return;

        try {
            // Fetch modern dynamic list from API sorted by update timestamp
            const response = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=50`);
            if (!response.ok) throw new Error('Network payload resolution error.');

            const repos = await response.json();

            // Clear loading placeholder text
            track.innerHTML = '';

            // Filter out fork repositories and profile metadata root structures
            const personalProjects = repos.filter(repo => !repo.fork && repo.name !== GITHUB_USERNAME && repo.name !== '.github');

            if (personalProjects.length === 0) {
                track.innerHTML = '<div class="p-3 text-muted">No public code repositories found.</div>';
                return;
            }

            personalProjects.forEach(repo => {
                const card = document.createElement('div');
                card.className = 'project-card';

                // Format hyphenated repository naming schemes into readable string spaces
                const structuralTitle = repo.name.replace(/-/g, ' ').replace(/_/g, ' ');
                const fallbackDescription = repo.description || 'Production architecture codebase built with engineering precision. Explore code layouts via GitHub interface.';

                // Build modern tags dynamically out of primary language configurations and topics if assigned
                let contextualTags = [];
                if (repo.language) contextualTags.push(repo.language);
                if (repo.topics && Array.isArray(repo.topics)) {
                    contextualTags = [...contextualTags, ...repo.topics.slice(0, 3)];
                }
                // Fallback tag defaults
                if (contextualTags.length === 0) contextualTags = ['Software', 'Architecture'];

                const dynamicTagElements = contextualTags
                    .map(tag => `<span>${tag.charAt(0).toUpperCase() + tag.slice(1)}</span>`)
                    .join('');

                card.innerHTML = `
                    <div class="project-info">
                        <h3>${structuralTitle}</h3>
                        <p>${fallbackDescription}</p>
                        <div class="project-tags">
                            ${dynamicTagElements}
                        </div>
                        <div class="project-actions">
                            <a href="${repo.html_url}" target="_blank" rel="noopener noreferrer" class="btn btn-github">
                                <i class="fab fa-github me-2"></i>View on GitHub
                            </a>
                        </div>
                    </div>
                `;

                track.appendChild(card);
            });

            // Re-bind scroll listener dimensions now that the dynamic cards exist
            if (wrapper) {
                initializeCarouselEvents(wrapper);
            }

        } catch (err) {
            console.error('Failure initializing custom dynamic components:', err);
            track.innerHTML = '<div class="p-3 text-danger"><i class="fas fa-exclamation-triangle me-2"></i>Unable to automatically sync projects right now.</div>';
        }
    };

    // Initialize fetching pipelines
    loadGitHubRepositories();

    // --- Like Button ---
    const likeBtn    = document.getElementById('like-btn');
    const likeCount  = document.getElementById('like-count');
    const likeThanks = document.getElementById('like-thanks');

    let likes    = parseInt(localStorage.getItem('ishan_portfolio_likes') || '0');
    let hasLiked = localStorage.getItem('ishan_portfolio_liked') === 'true';

    if (likeCount) likeCount.textContent = likes;
    if (hasLiked && likeBtn) likeBtn.classList.add('liked');

    if (likeBtn) {
        likeBtn.addEventListener('click', () => {
            if (!hasLiked) {
                likes++;
                hasLiked = true;
                localStorage.setItem('ishan_portfolio_likes', likes);
                localStorage.setItem('ishan_portfolio_liked', 'true');

                if (likeCount) likeCount.textContent = likes;
                likeBtn.classList.add('liked');

                if (likeThanks) {
                    likeThanks.textContent = '🎉 Thanks for the like!';
                    likeThanks.classList.add('visible');
                    setTimeout(() => likeThanks.classList.remove('visible'), 3000);
                }

                // Open mail client to notify Ishan
                window.location.href =
                    'mailto:ishanmukherjee66@gmail.com' +
                    '?subject=New%20Portfolio%20Like%20%F0%9F%92%96' +
                    '&body=Hey%20Ishan!%0A%0ASomeone%20just%20liked%20your%20portfolio.%20%F0%9F%8E%89%0ATotal%20likes%3A%20' + likes;

            } else {
                // Already liked — replay the pop animation as feedback
                likeBtn.classList.remove('liked');
                void likeBtn.offsetWidth; // force reflow to restart animation
                likeBtn.classList.add('liked');

                if (likeThanks) {
                    likeThanks.textContent = 'You already liked this 😊';
                    likeThanks.classList.add('visible');
                    setTimeout(() => likeThanks.classList.remove('visible'), 2500);
                }
            }
        });
    }

}); // End DOMContentLoaded
