class CustomFooter extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          background-color: #1a1a1a;
          color: rgba(255, 255, 255, 0.76);
          padding: 60px 0 30px;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
        }
        
        .footer-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }
        
        .footer-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 40px;
          margin-bottom: 40px;
        }
        
        .footer-logo {
          margin-bottom: 20px;
        }
        
        .footer-logo img {
          height: 50px;
          filter: brightness(0) invert(1);
        }
        
        .footer-about p {
          margin-bottom: 20px;
          line-height: 1.6;
          font-size: 0.9rem;
        }
        
        .social-icons {
          display: flex;
          gap: 14px;
        }
        
        .social-icon {
          color: white;
          opacity: 0.7;
          transition: opacity 0.25s ease, transform 0.25s ease;
        }
        
        .social-icon:hover {
          opacity: 1;
          transform: translateY(-1px);
        }
        
        .footer-title {
          color: white;
          font-family: 'Montserrat', system-ui, sans-serif;
          font-weight: 600;
          margin-bottom: 18px;
          font-size: 16px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        
        .footer-links {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .footer-link {
          margin-bottom: 10px;
          font-size: 0.9rem;
        }
        
        .footer-link a {
          color: rgba(255, 255, 255, 0.75);
          text-decoration: none;
          transition: color 0.25s ease;
        }
        
        .footer-link a:hover {
          color: #c4603d;
        }
        
        .hours-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.9rem;
        }
        
        .hours-table td {
          padding: 4px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        
        .highlight td {
          color: #c4603d;
          font-weight: 500;
        }
        
        .footer-bottom {
          border-top: 1px solid rgba(255, 255, 255, 0.14);
          padding-top: 18px;
          text-align: center;
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.6);
        }
        
        .footer-bottom a {
          color: #c4603d;
          text-decoration: none;
          margin: 0 10px;
          font-size: 0.8rem;
        }
        
        .footer-bottom a:hover {
          text-decoration: underline;
        }

        .bottom-secondary {
          margin-top: 6px;
          font-size: 0.78rem;
        }
        
        @media (max-width: 768px) {
          :host {
            padding: 40px 0 24px;
          }
          .footer-grid {
            grid-template-columns: 1fr;
            gap: 28px;
          }
        }
      </style>
      
      <div class="footer-container">
        <div class="footer-grid">
          <div class="footer-about">
            <div class="footer-logo">
              <img src="https://via.placeholder.com/160x50?text=PASTA+LA+VISTA" alt="Pasta La Vista Logo">
            </div>
            <p>
              Modern Italian trattoria &mdash; this footer is part of a portfolio demo for Pasta La Vista.
              Replace the text, logo and links with your own branding when using it in production.
            </p>
            <div class="social-icons">
              <a href="#" class="social-icon" aria-label="Instagram (demo)">
                <i data-feather="instagram"></i>
              </a>
              <a href="#" class="social-icon" aria-label="Facebook (demo)">
                <i data-feather="facebook"></i>
              </a>
              <a href="#" class="social-icon" aria-label="Twitter (demo)">
                <i data-feather="twitter"></i>
              </a>
            </div>
          </div>
          
          <div>
            <h3 class="footer-title">Quick Links</h3>
            <ul class="footer-links">
              <li class="footer-link"><a href="#menu">View Menu</a></li>
              <li class="footer-link"><a href="#reservations">Reservations</a></li>
              <li class="footer-link"><a href="#gallery">Gallery</a></li>
              <li class="footer-link"><a href="#story">Our Story</a></li>
              <li class="footer-link"><a href="#location">Location</a></li>
            </ul>
          </div>
          
          <div>
            <h3 class="footer-title">Hours</h3>
            <table class="hours-table">
              <tr>
                <td>Mon &ndash; Thu</td>
                <td>5:30 PM &ndash; 10:00 PM</td>
              </tr>
              <tr class="highlight">
                <td>Fri &amp; Sat</td>
                <td>5:30 PM &ndash; 11:00 PM</td>
              </tr>
              <tr>
                <td>Sunday</td>
                <td>5:00 PM &ndash; 9:30 PM</td>
              </tr>
            </table>
            <p style="margin-top: 10px; font-size: 0.85rem;">
              Demo copy &mdash; adjust hours to match your real restaurant.
            </p>
          </div>
          
          <div>
            <h3 class="footer-title">Contact</h3>
            <ul class="footer-links">
              <li class="footer-link">
                <i data-feather="map-pin" class="inline" width="16" height="16"></i>
                <span style="margin-left: 6px;">123 Sample Street, Demo City</span>
              </li>
              <li class="footer-link">
                <i data-feather="phone" class="inline" width="16" height="16"></i>
                <a style="margin-left: 6px;" href="tel:+00000000000">(000) 000-0000 (demo)</a>
              </li>
              <li class="footer-link">
                <i data-feather="mail" class="inline" width="16" height="16"></i>
                <a style="margin-left: 6px;" href="mailto:hello@pastalavista.demo">hello@pastalavista.demo</a>
              </li>
            </ul>
            <div style="margin-top: 12px; display:flex; align-items:center;">
              <i data-feather="star" class="text-yellow-500" width="16" height="16"></i>
              <span style="margin-left:6px; font-size:0.85rem;">Sample rating · Portfolio only</span>
            </div>
          </div>
        </div>
        
        <div class="footer-bottom">
          <p>&copy; ${new Date().getFullYear()} Pasta La Vista. Demo website for portfolio use only. 
            <a href="#">Terms</a> 
            <a href="#">Privacy</a>
          </p>
          <p class="bottom-secondary">Designed with ♥ by 3DVR.</p>
        </div>
      </div>
    `;

    // Activar feather icons dentro del shadow DOM
    if (window.feather) {
      window.feather.replace({ elements: this.shadowRoot });
    }
  }
}

customElements.define('custom-footer', CustomFooter);
