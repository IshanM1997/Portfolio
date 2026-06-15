document.addEventListener('DOMContentLoaded', () => {
    
    // --- Dynamic Circular Favicon Cropper ---
    const originalImageSrc = 'my-profile.jpg'; // Your base profile image
    const faviconElement = document.getElementById('favicon');
    
    const img = new Image();
    img.src = originalImageSrc;
    img.crossOrigin = 'anonymous'; 
    
    img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 128; // High fidelity target output dimensions
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        // Render crisp circular mathematical clipping mask
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        
        // Rectangular ratio correction logic (Center bounding square)
        let srcX = 0, srcY = 0, srcWidth = img.width, srcHeight = img.height;
        if (img.width > img.height) {
            srcWidth = img.height;
            srcX = (img.width - img.height) / 2;
        } else if (img.height > img.width) {
            srcHeight = img.width;
            srcY = (img.height - img.width) / 2;
        }
        
        // Project onto canvas layout grid and transform target source attribute
        ctx.drawImage(img, srcX, srcY, srcWidth, srcHeight, 0, 0, size, size);
        faviconElement.href = canvas.toDataURL('image/png');
    };

// --- Mobile Navigation Menu Toggle ---
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

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
    }, {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    });

    revealElements.forEach(element => revealObserver.observe(element));


    // --- Highlighting active navigation links based on scroll depth ---
    const sections = document.querySelectorAll('section[id]');

    const activeLinkObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const currentId = entry.target.getAttribute('id');
                
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${currentId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }, {
        rootMargin: "-30% 0px -70% 0px" 
    });

    sections.forEach(section => activeLinkObserver.observe(section));
});
    // --- About Section Tabs (Technical / Creative) ---
    const aboutTabs = document.querySelectorAll('.about-tab');
    const aboutTabContents = document.querySelectorAll('.about-tab-content');

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
        });
    });

    // --- Featured Work Tabs (Projects / Certificates) ---
    const sectionTabs = document.querySelectorAll('.section-tab');
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
