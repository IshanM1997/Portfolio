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

    document.querySelectorAll('.carousel-wrapper').forEach(wrapper => {
        const leftBtn  = wrapper.querySelector('.carousel-arrow--left');
        const rightBtn = wrapper.querySelector('.carousel-arrow--right');
        const track    = document.getElementById(leftBtn.getAttribute('data-target'));

        if (!track) return;

        const scrollAmount = () => {
            const card = track.querySelector('.project-card, .cert-card');
            return card ? card.offsetWidth + 24 : 300;
        };

        leftBtn.addEventListener('click',  () => track.scrollBy({ left: -scrollAmount(), behavior: 'smooth' }));
        rightBtn.addEventListener('click', () => track.scrollBy({ left:  scrollAmount(), behavior: 'smooth' }));
        track.addEventListener('scroll',   () => updateArrowStates(track, leftBtn, rightBtn));
        updateArrowStates(track, leftBtn, rightBtn);

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
            // Snap to nearest card if swipe was significant
            if (Math.abs(delta) > 50) {
                const amount = scrollAmount();
                track.scrollBy({ left: delta > 0 ? amount : -amount, behavior: 'smooth' });
            }
            updateArrowStates(track, leftBtn, rightBtn);
        }, { passive: true });
    });

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
