class CustomHeader extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' });

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          background-color: #ffffff;
          box-shadow: 0 2px 10px rgba(0,0,0,0.08);
          transition: box-shadow 0.3s ease, background-color 0.3s ease, transform 0.3s ease;
        }
        
        :host(.scrolled) {
          box-shadow: 0 4px 18px rgba(0,0,0,0.14);
          background-color: rgba(255, 255, 255, 0.96);
          backdrop-filter: blur(8px);
        }
        
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
          height: 80px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .logo {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .logo-mark {
          width: 40px;
          height: 40px;
          border-radius: 9999px;
          border: 1px solid rgba(200, 160, 99, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          background: #faf6ed;
        }

        .logo-mark span {
          font-family: 'Playfair Display', serif;
          font-size: 20px;
          color: #c4603d;
        }
        
        .logo-text {
          font-family: 'Playfair Display', serif;
          font-weight: 700;
          font-size: 22px;
          color: #3a2c28;
        }
        
        .logo-subtitle {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.22em;
          color: #9ca3af;
          margin-top: 2px;
        }
        
        .nav-links {
          display: flex;
          gap: 26px;
          align-items: center;
        }
        
        .nav-link {
          font-family: 'Montserrat', system-ui, sans-serif;
          font-weight: 500;
          color: #374151;
          text-decoration: none;
          font-size: 0.9rem;
          transition: color 0.25s ease;
          position: relative;
        }
        
        .nav-link:hover {
          color: #c4603d;
        }
        
        .nav-link::after {
          content: '';
          position: absolute;
          bottom: -5px;
          left: 0;
          width: 0;
          height: 2px;
          background-color: #c4603d;
          transition: width 0.25s ease;
        }
        
        .nav-link:hover::after {
          width: 100%;
        }
        
        .order-btn {
          background-color: #c4603d;
          color: #ffffff;
          padding: 10px 22px;
          border-radius: 9999px;
          font-family: 'Montserrat', system-ui, sans-serif;
          font-weight: 600;
          text-decoration: none;
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          transition: all 0.25s ease;
          box-shadow: 0 4px 14px rgba(196, 96, 61, 0.4);
          border: none;
          cursor: pointer;
          white-space: nowrap;
        }
        
        .order-btn:hover {
          background-color: #a64f32;
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(196, 96, 61, 0.5);
        }
        
        .hamburger {
          display: none;
          cursor: pointer;
        }

        .hamburger button {
          border: 1px solid rgba(156, 163, 175, 0.7);
          border-radius: 9999px;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #ffffff;
        }

        .mobile-nav {
          display: none;
          position: fixed;
          top: 80px;
          left: 0;
          right: 0;
          background-color: #ffffff;
          box-shadow: 0 14px 24px rgba(0,0,0,0.12);
          padding: 14px 20px 18px;
        }

        .mobile-nav.open {
          display: block;
        }

        .mobile-links {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .mobile-link {
          font-family: 'Montserrat', system-ui, sans-serif;
          font-size: 0.95rem;
          color: #374151;
          text-decoration: none;
          padding: 6px 0;
          border-bottom: 1px solid rgba(229, 231, 235, 0.9);
        }

        .mobile-link:last-child {
          border-bottom: none;
        }

        .mobile-order {
          margin-top: 10px;
        }
        
        @media (max-width: 1024px) {
          .nav-links,
          .order-btn.desktop {
            display: none;
          }
          
          .hamburger {
            display: block;
          }

          .container {
            height: 70px;
          }
        }
      </style>
      
      <div class="container">
        <div class="logo">
          <div class="logo-mark"><span>P</span></div>
          <div>
            <div class="logo-text">Pasta La Vista</div>
            <div class="logo-subtitle">Modern Trattoria</div>
          </div>
        </div>
        
        <nav class="nav-links" aria-label="Main">
          <a href="#menu" class="nav-link">Menu</a>
          <a href="#story" class="nav-link">Our Story</a>
          <a href="#specials" class="nav-link">Chef’s Specials</a>
          <a href="#gallery" class="nav-link">Gallery</a>
          <a href="#location" class="nav-link">Location</a>
        </nav>
        
        <a href="#delivery" class="order-btn desktop">Order Online</a>
        
        <div class="hamburger">
          <button type="button" aria-label="Toggle navigation">
            <i data-feather="menu"></i>
          </button>
        </div>
      </div>

      <div class="mobile-nav" id="mobileNav">
        <div class="mobile-links">
          <a href="#menu" class="mobile-link">Menu</a>
          <a href="#story" class="mobile-link">Our Story</a>
          <a href="#specials" class="mobile-link">Chef’s Specials</a>
          <a href="#gallery" class="mobile-link">Gallery</a>
          <a href="#location" class="mobile-link">Location</a>
        </div>
        <div class="mobile-order">
          <a href="#delivery" class="order-btn" style="width:100%; display:inline-flex; justify-content:center;">Order Online</a>
        </div>
      </div>
    `;

    // Scroll effect: togglear clase en el host
    const onScroll = () => {
      if (window.scrollY > 50) {
        this.classList.add('scrolled');
      } else {
        this.classList.remove('scrolled');
      }
    };
    window.addEventListener('scroll', onScroll);

    // Mobile nav toggle
    const hb = this.shadowRoot.querySelector('.hamburger button');
    const mobileNav = this.shadowRoot.getElementById('mobileNav');

    if (hb && mobileNav) {
      hb.addEventListener('click', () => {
        const isOpen = mobileNav.classList.contains('open');
        mobileNav.classList.toggle('open', !isOpen);
        hb.innerHTML = isOpen
          ? '<i data-feather="menu"></i>'
          : '<i data-feather="x"></i>';
        if (window.feather) window.feather.replace({ elements: this.shadowRoot });
      });

      // Cerrar menú al hacer click en cualquier link móvil
      this.shadowRoot.querySelectorAll('.mobile-link').forEach((link) => {
        link.addEventListener('click', () => {
          mobileNav.classList.remove('open');
          hb.innerHTML = '<i data-feather="menu"></i>';
          if (window.feather) window.feather.replace({ elements: this.shadowRoot });
        });
      });
    }

    // Activar Feather icons dentro del shadow DOM
    if (window.feather) {
      window.feather.replace({ elements: this.shadowRoot });
    }
  }
}

customElements.define('custom-header', CustomHeader);
