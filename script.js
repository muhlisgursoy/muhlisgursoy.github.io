// Discover Denizli - Interactive Features

// Smooth scrolling for navigation links
document.addEventListener('DOMContentLoaded', function() {
    // Smooth scrolling for all anchor links
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const offsetTop = targetSection.offsetTop - 80; // Account for fixed navbar
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });

    // CTA button smooth scroll
    const ctaButton = document.querySelector('.cta-button');
    if (ctaButton) {
        ctaButton.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const offsetTop = targetSection.offsetTop - 80;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    }

    // Navbar scroll effect
    const navbar = document.querySelector('.navbar');
    let lastScroll = 0;
    
    window.addEventListener('scroll', function() {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 100) {
            navbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.15)';
        } else {
            navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
        }
        
        lastScroll = currentScroll;
    });

    // Fade-in animation on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    // Observe all cards for fade-in animation
    const cards = document.querySelectorAll('.attraction-card, .culture-card, .tip-card, .stat-card');
    cards.forEach(card => {
        card.classList.add('fade-in');
        observer.observe(card);
    });

    // Add hover effects to attraction cards
    const attractionCards = document.querySelectorAll('.attraction-card');
    attractionCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.borderTop = '4px solid var(--primary-color)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.borderTop = 'none';
        });
    });

    // Animate stat numbers
    function animateValue(element, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const value = Math.floor(progress * (end - start) + start);
            
            if (element.textContent.includes('+')) {
                element.textContent = value.toLocaleString() + '+';
            } else if (element.textContent.includes('°C')) {
                element.textContent = value + '°C';
            } else {
                element.textContent = value.toLocaleString();
            }
            
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }

    // Trigger stat animation when in viewport
    const statObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.classList.contains('animated')) {
                entry.target.classList.add('animated');
                const statNumber = entry.target.querySelector('.stat-number');
                const text = statNumber.textContent;
                
                // Extract number from text
                let targetValue = 0;
                if (text.includes('2M+')) {
                    targetValue = 2000000;
                    animateValue(statNumber, 0, 2, 1500);
                    statNumber.textContent = '2M+';
                } else if (text.includes('2000+')) {
                    targetValue = 2000;
                    animateValue(statNumber, 0, 2000, 1500);
                } else if (text.includes('36°C')) {
                    targetValue = 36;
                    animateValue(statNumber, 0, 36, 1500);
                }
            }
        });
    }, { threshold: 0.5 });

    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach(card => {
        statObserver.observe(card);
    });

    // Add parallax effect to hero section
    window.addEventListener('scroll', function() {
        const scrollPosition = window.pageYOffset;
        const hero = document.querySelector('.hero');
        
        if (hero && scrollPosition < window.innerHeight) {
            hero.style.backgroundPositionY = scrollPosition * 0.5 + 'px';
        }
    });

    // Add dynamic greeting based on time of day
    const hour = new Date().getHours();
    let greeting = 'Discover';
    
    if (hour >= 5 && hour < 12) {
        greeting = 'Good Morning! Discover';
    } else if (hour >= 12 && hour < 18) {
        greeting = 'Good Afternoon! Discover';
    } else if (hour >= 18 && hour < 22) {
        greeting = 'Good Evening! Explore';
    } else {
        greeting = 'Welcome! Discover';
    }

    // Log welcome message
    console.log('%c' + greeting + ' the wonders of Denizli!', 'color: #2c7fb8; font-size: 16px; font-weight: bold;');
    console.log('%cExplore Pamukkale, Ancient Hierapolis, and Natural Thermal Springs!', 'color: #41b6c4; font-size: 14px;');

    // Add loading animation completion
    document.body.style.opacity = '0';
    setTimeout(function() {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    }, 100);
});

// Easter egg: Konami Code
let konamiCode = [];
const konamiSequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

document.addEventListener('keydown', function(e) {
    konamiCode.push(e.key);
    konamiCode = konamiCode.slice(-10);
    
    if (konamiCode.join('') === konamiSequence.join('')) {
        // Create confetti effect
        createConfetti();
        alert('🎉 You discovered the secret! Denizli welcomes you with extra magic! 🏛️♨️');
    }
});

function createConfetti() {
    const colors = ['#2c7fb8', '#41b6c4', '#7fcdbb', '#FFD700', '#FF69B4'];
    const confettiCount = 100;
    
    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.style.position = 'fixed';
        confetti.style.width = '10px';
        confetti.style.height = '10px';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.top = '-10px';
        confetti.style.borderRadius = '50%';
        confetti.style.zIndex = '9999';
        confetti.style.pointerEvents = 'none';
        
        document.body.appendChild(confetti);
        
        const animation = confetti.animate([
            { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
            { transform: `translateY(${window.innerHeight + 20}px) rotate(${Math.random() * 720}deg)`, opacity: 0 }
        ], {
            duration: Math.random() * 2000 + 3000,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        });
        
        animation.onfinish = () => confetti.remove();
    }
}

// Export for potential future use
window.DenizliApp = {
    createConfetti: createConfetti
};
