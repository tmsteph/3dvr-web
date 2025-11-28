class CustomFooter extends HTMLElement {
    connectedCallback() {
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    width: 100%;
                    background-color: #2D3436;
                    color: #FAFAF9;
                }
                
                .footer-container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 4rem 1.5rem 3rem;
                }
                
                .footer-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 3rem;
                }
                
                .footer-column h3 {
                    font-family: 'Fraunces', serif;
                    font-size: 1.25rem;
                    font-weight: 600;
                    margin-bottom: 1.5rem;
                    color: #F5F1E8;
                }
                
                .footer-column p,
                .footer-column a {
                    color: rgba(250, 250, 249, 0.7);
                    line-height: 1.7;
                    margin-bottom: 0.75rem;
                    display: block;
                    font-size: 0.9rem;
                }
                
                .footer-column a:hover {
                    color: #F5F1E8;
                }
                
                .footer-social {
                    display: flex;
                    gap: 1rem;
                    margin-top: 1.5rem;
                }
                
                .footer-social a {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background-color: rgba(250, 250, 249, 0.1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s ease;
                }
                
                .footer-social a:hover {
                    background-color: var(--teal-500);
                    transform: translateY(-3px);
                }
                
                .footer-bottom {
                    border-top: 1px solid rgba(250, 250, 249, 0.1);
                    padding-top: 1.75rem;
                    margin-top: 3rem;
                    text-align: center;
                    color: rgba(250, 250, 249, 0.5);
                    font-size: 0.85rem;
                }

                .footer-bottom a {
                    color: rgba(250, 250, 249, 0.7);
                    text-decoration: underline;
                }

                .footer-bottom a:hover {
                    color: #F5F1E8;
                }

                .footer-credit {
                    margin-top: 0.5rem;
                    font-size: 0.8rem;
                    color: rgba(250, 250, 249, 0.55);
                }
                
                @media (max-width: 768px) {
                    .footer-grid {
                        grid-template-columns: 1fr;
                        gap: 2rem;
                    }
                    
                    .footer-column {
                        margin-bottom: 0.5rem;
                    }
                }
            </style>
            
            <div class="footer-container">
                <div class="footer-grid">
                    <div class="footer-column">
                        <h3>Contact</h3>
                        <p><i data-feather="mail" class="inline mr-2"></i> contact@mindfulharmony.com</p>
                        <p><i data-feather="phone" class="inline mr-2"></i> (555) 123-4567</p>
                        <p>
                            <i data-feather="map-pin" class="inline mr-2"></i>
                            123 Wellness Lane, Suite 200<br>San Francisco, CA 94110
                        </p>
                    </div>
                    
                    <div class="footer-column">
                        <h3>Quick links</h3>
                        <a href="#about">About</a>
                        <a href="#services">Services & Fees</a>
                        <a href="#process">How It Works</a>
                        <a href="#testimonials">Client Experiences</a>
                        <a href="#faq">FAQ</a>
                        <a href="#contact">Contact & Scheduling</a>
                    </div>
                    
                    <div class="footer-column">
                        <h3>Connect</h3>
                        <p>Follow for gentle reminders and mental health resources.</p>
                        <div class="footer-social">
                            <a href="#" aria-label="Instagram (demo)"><i data-feather="instagram"></i></a>
                            <a href="#" aria-label="LinkedIn (demo)"><i data-feather="linkedin"></i></a>
                            <a href="#" aria-label="Twitter (demo)"><i data-feather="twitter"></i></a>
                        </div>
                    </div>
                </div>
                
                <div class="footer-bottom">
                    <p>© ${new Date().getFullYear()} Mindful Harmony Therapy Haven. This is a demo website for portfolio use.</p>
                    <p class="footer-credit">Designed with ♥ by 3DVR Studio.</p>
                </div>
            </div>
        `;

        if (window.feather) {
            window.feather.replace({ elements: this.shadowRoot });
        }
    }
}

customElements.define('custom-footer', CustomFooter);
