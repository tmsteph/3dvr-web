class CustomNavigation extends HTMLElement {
    constructor() {
        super();
        this.menuOpen = false;
    }

    connectedCallback() {
        this.attachShadow({ mode: 'open' });
        this.render();
        this.addEventListeners();
    }

    toggleMenu() {
        this.menuOpen = !this.menuOpen;
        this.render();
        this.addEventListeners();
        if (window.feather) {
            window.feather.replace({ elements: this.shadowRoot });
        }
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    width: 100%;
                    position: fixed;
                    top: 0;
                    left: 0;
                    z-index: 1000;
                    background-color: rgba(250, 250, 249, 0.98);
                    backdrop-filter: blur(10px);
                    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
                }
                
                nav {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 0 1.5rem;
                    height: 80px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .logo {
                    font-family: 'Fraunces', serif;
                    font-weight: 700;
                    font-size: 1.5rem;
                    color: var(--sage-500);
                    text-decoration: none;
                    z-index: 1001;
                }
                
                .nav-container {
                    display: flex;
                    align-items: center;
                    gap: 2rem;
                }
                
                .nav-links {
                    display: flex;
                    gap: 1.5rem;
                }
                
                .nav-link {
                    color: #2D3436;
                    text-decoration: none;
                    font-weight: 500;
                    font-size: 0.95rem;
                    position: relative;
                    transition: color 0.3s ease;
                    padding: 0.5rem 0;
                }
                
                .nav-link:hover {
                    color: var(--sage-500);
                }
                
                .nav-link::after {
                    content: '';
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    width: 0;
                    height: 2px;
                    background-color: var(--sage-500);
                    transition: width 0.3s ease;
                }
                
                .nav-link:hover::after {
                    width: 100%;
                }
                
                .nav-cta {
                    background-color: var(--sage-500);
                    color: white;
                    padding: 0.6rem 1.5rem;
                    border-radius: 9999px;
                    font-weight: 500;
                    font-size: 0.8rem;
                    letter-spacing: 0.18em;
                    text-transform: uppercase;
                    transition: all 0.3s ease;
                    white-space: nowrap;
                }
                
                .nav-cta:hover {
                    background-color: #547151;
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(0,0,0,0.12);
                }
                
                .mobile-menu-button {
                    display: none;
                    background: none;
                    border: none;
                    cursor: pointer;
                    z-index: 1001;
                }
                
                .mobile-menu-button i {
                    width: 24px;
                    height: 24px;
                }
                
                .mobile-menu {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100vh;
                    background-color: rgba(250, 250, 249, 0.98);
                    backdrop-filter: blur(10px);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 2rem;
                    transform: translateY(-100%);
                    transition: transform 0.3s ease;
                    z-index: 1000;
                }
                
                .mobile-menu.open {
                    transform: translateY(0);
                }
                
                .mobile-menu-link {
                    color: #2D3436;
                    text-decoration: none;
                    font-size: 1.3rem;
                    font-weight: 500;
                    transition: color 0.3s ease;
                }
                
                .mobile-menu-link:hover {
                    color: var(--sage-500);
                }
                
                .mobile-menu-cta {
                    background-color: var(--sage-500);
                    color: white;
                    padding: 0.75rem 1.75rem;
                    border-radius: 9999px;
                    font-weight: 500;
                    font-size: 0.95rem;
                    letter-spacing: 0.18em;
                    text-transform: uppercase;
                    transition: all 0.3s ease;
                }

                .mobile-menu-cta:hover {
                    background-color: #547151;
                    transform: translateY(-2px);
                }
                
                @media (max-width: 768px) {
                    .nav-container {
                        display: none;
                    }
                    
                    .mobile-menu-button {
                        display: block;
                    }

                    nav {
                        height: 70px;
                    }
                }
            </style>
            
            <nav>
                <a href="#top" class="logo">Mindful Harmony</a>
                
                <div class="nav-container">
                    <div class="nav-links">
                        <a href="#about" class="nav-link">About</a>
                        <a href="#services" class="nav-link">Services</a>
                        <a href="#process" class="nav-link">Process</a>
                        <a href="#testimonials" class="nav-link">Testimonials</a>
                        <a href="#faq" class="nav-link">FAQ</a>
                    </div>
                    <a href="#contact" class="nav-cta">Book Now</a>
                </div>
                
                <button class="mobile-menu-button" aria-label="Toggle menu">
                    <i data-feather="${this.menuOpen ? 'x' : 'menu'}"></i>
                </button>
                
                <div class="mobile-menu ${this.menuOpen ? 'open' : ''}">
                    <a href="#about" class="mobile-menu-link">About</a>
                    <a href="#services" class="mobile-menu-link">Services</a>
                    <a href="#process" class="mobile-menu-link">Process</a>
                    <a href="#testimonials" class="mobile-menu-link">Testimonials</a>
                    <a href="#faq" class="mobile-menu-link">FAQ</a>
                    <a href="#contact" class="mobile-menu-cta">Book Now</a>
                </div>
            </nav>
        `;

        if (window.feather) {
            window.feather.replace({ elements: this.shadowRoot });
        }
    }

    addEventListeners() {
        const button = this.shadowRoot.querySelector('.mobile-menu-button');
        const mobileLinks = this.shadowRoot.querySelectorAll('.mobile-menu-link, .mobile-menu-cta');

        if (button) {
            button.addEventListener('click', () => this.toggleMenu());
        }

        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                this.menuOpen = false;
                this.render();
                this.addEventListeners();
                if (window.feather) {
                    window.feather.replace({ elements: this.shadowRoot });
                }
            });
        });
    }
}

customElements.define('custom-navigation', CustomNavigation);
