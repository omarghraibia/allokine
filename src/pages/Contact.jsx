import { Mail, MessageCircle, Phone, Share2 } from 'lucide-react';

export default function Contact() {
    return (
        <div className="container pt-top min-h-screen">
            <div className="card full-width contact-shell">
                <h1 className="text-center title-premium">
                    Contact & <span className="text-blue">Acces</span>
                </h1>

                <div className="grid mt-4 contact-grid">
                    <section className="contact-actions">
                        <h3 className="mb-2">Joindre le cabinet</h3>

                        <a href="tel:+21698561586" className="contact-btn">
                            <span><Phone size={16} /> Telephone</span> +216 98 561 586
                        </a>

                        <a href="https://wa.me/21698561586" target="_blank" rel="noopener noreferrer" className="contact-btn">
                            <span><MessageCircle size={16} /> WhatsApp</span> +216 98 561 586
                        </a>

                        <a href="mailto:omar_oumay@hotmail.com?subject=Demande%20RDV%20Cabinet" className="contact-btn">
                            <span><Mail size={16} /> Email</span> omar_oumay@hotmail.com
                        </a>

                        <a href="https://www.facebook.com/profile.php?id=100089482776345" target="_blank" rel="noopener noreferrer" className="contact-btn">
                            <span><Share2 size={16} /> Facebook</span> Page Facebook
                        </a>
                    </section>

                    <section className="contact-map-wrap">
                        <iframe
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2626.3470783345892!2d10.328697975036945!3d36.87813697222502!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x12e2b568bd77a463%3A0xfb6597c6dfcab424!2sVIP%20Body%20Center%20(Amincissement%20%2F%20X-BODY%20EMS)!5e1!3m2!1sfr!2sfr!4v1775571426357!5m2!1sfr!2sfr"
                            width="100%"
                            height="100%"
                            style={{ border: 0, minHeight: '360px' }}
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="strict-origin-when-cross-origin"
                            title="Carte du cabinet"
                            sandbox="allow-scripts allow-same-origin allow-popups"
                        />
                    </section>
                </div>
            </div>
        </div>
    );
}
