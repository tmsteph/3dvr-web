// script.js – Mindful Harmony (refined)

document.addEventListener('DOMContentLoaded', () => {
    // 1. Feather icons (main DOM)
    if (window.feather) {
        feather.replace();
    }

    // 2. Cerrar menú móvil al hacer click fuera del navigation component
    document.addEventListener('click', (event) => {
        const navs = document.querySelectorAll('custom-navigation');

        navs.forEach((nav) => {
            if (!nav.shadowRoot) return;

            const menuButton = nav.shadowRoot.querySelector('.mobile-menu-button');
            const mobileMenu = nav.shadowRoot.querySelector('.mobile-menu');

            const clickedInsideNav = nav.contains(event.target);
            const clickedMenuButton = menuButton && menuButton.contains(event.target);

            if (menuButton && mobileMenu && !clickedInsideNav && !clickedMenuButton) {
                nav.menuOpen = false;
                if (typeof nav.render === 'function') {
                    nav.render();
                    if (window.feather) {
                        window.feather.replace({ elements: nav.shadowRoot });
                    }
                    nav.addEventListeners && nav.addEventListeners();
                }
            }
        });
    });

    // 3. Servicio: “More details” toggle
    const serviceButtons = document.querySelectorAll('.service-more-btn');

    serviceButtons.forEach((button) => {
        button.setAttribute('aria-expanded', 'false');

        button.addEventListener('click', () => {
            const details = button.nextElementSibling;
            const icon = button.querySelector('i');

            if (!details || !icon) return;

            const isHidden = details.classList.contains('hidden');

            // Toggle contenido
            details.classList.toggle('hidden', !isHidden);

            // Actualizar icono
            icon.setAttribute('data-feather', isHidden ? 'chevron-up' : 'chevron-down');

            // Accesibilidad
            button.setAttribute('aria-expanded', isHidden ? 'true' : 'false');

            // Reemplazar íconos
            if (window.feather) feather.replace();
        });
    });

    // 4. Testimonios con dots + auto-advance
    const testimonials = Array.from(document.querySelectorAll('.testimonial'));
    const dots = Array.from(document.querySelectorAll('.testimonial-dot'));
    let currentTestimonial = 0;

    function showTestimonial(index) {
        if (!testimonials.length || !dots.length) return;
        const safeIndex = ((index % testimonials.length) + testimonials.length) % testimonials.length;

        testimonials.forEach((t, i) => {
            t.classList.toggle('hidden', i !== safeIndex);
        });

        dots.forEach((d, i) => {
            d.classList.toggle('active', i === safeIndex);
        });

        currentTestimonial = safeIndex;
    }

    if (testimonials.length && dots.length) {
        // Inicial
        showTestimonial(0);

        // Click en dots
        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                showTestimonial(index);
            });
        });

        // Auto-advance cada 5s
        setInterval(() => {
            showTestimonial(currentTestimonial + 1);
        }, 5000);
    }

    // 5. FAQ accordion
    const faqQuestions = document.querySelectorAll('.faq-question');

    faqQuestions.forEach((question) => {
        const item = question.closest('.faq-item');
        const answer = question.nextElementSibling;
        const icon = question.querySelector('i');

        if (!item || !answer || !icon) return;

        // Estado inicial
        question.setAttribute('aria-expanded', 'false');
        answer.classList.add('hidden');

        question.addEventListener('click', () => {
            const isOpen = !answer.classList.contains('hidden');

            // Cerrar otros items
            document.querySelectorAll('.faq-item').forEach((el) => {
                const otherAnswer = el.querySelector('.faq-answer');
                const otherQuestion = el.querySelector('.faq-question');
                const otherIcon = el.querySelector('.faq-question i');

                if (otherAnswer && otherQuestion && otherIcon && el !== item) {
                    otherAnswer.classList.add('hidden');
                    otherQuestion.setAttribute('aria-expanded', 'false');
                    otherIcon.setAttribute('data-feather', 'plus');
                    el.classList.remove('open');
                }
            });

            // Toggle actual
            answer.classList.toggle('hidden', isOpen);
            question.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
            icon.setAttribute('data-feather', isOpen ? 'plus' : 'minus');
            item.classList.toggle('open', !isOpen);

            if (window.feather) feather.replace();
        });
    });

    // 6. Smooth scrolling para links internos
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', (event) => {
            const targetId = anchor.getAttribute('href');
            if (!targetId || targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (!targetElement) return;

            event.preventDefault();

            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });

            if (history.pushState) {
                history.pushState(null, '', targetId);
            } else {
                window.location.hash = targetId;
            }
        });
    });

    // 7. Formulario de contacto (demo mejorado sin alert)
    const contactForm = document.getElementById('contactForm');
    const formStatus = document.getElementById('formStatus');
    const submitBtn = document.getElementById('contactSubmit');

    if (contactForm) {
        contactForm.addEventListener('submit', (event) => {
            event.preventDefault();

            if (!formStatus || !submitBtn) return;

            // Simular envío
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';

            setTimeout(() => {
                contactForm.reset();
                submitBtn.disabled = false;
                submitBtn.textContent = 'Send request';

                formStatus.classList.remove('hidden');
                formStatus.textContent =
                    'Thank you for reaching out. This is a demo form—replace this text with your real contact flow.';
            }, 800);
        });
    }

    // 8. Animaciones con IntersectionObserver usando data-animate
    const animateElements = document.querySelectorAll('[data-animate]');

    if (animateElements.length && 'IntersectionObserver' in window) {
        const observer = new IntersectionObserver(
            (entries, obs) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('animate-fadeInUp');
                        obs.unobserve(entry.target);
                    }
                });
            },
            {
                threshold: 0.1,
            }
        );

        animateElements.forEach((el) => observer.observe(el));
    } else {
        animateElements.forEach((el) => el.classList.add('animate-fadeInUp'));
    }
});
