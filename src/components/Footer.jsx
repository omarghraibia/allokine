import { Link } from 'react-router-dom';

export default function Footer() {
    return (
        <footer className="footer">
            <div className="container footer-grid">
                <section>
                    <h3>AlloKine</h3>
                    <p className="subtitle">Cabinet de kinesitherapie conventionne.</p>
                    <p className="subtitle">Accompagnement fonctionnel, sport et post-operatoire.</p>
                </section>

                <section>
                    <h4>Navigation</h4>
                    <ul>
                        <li><Link to="/">Accueil</Link></li>
                        <li><Link to="/about">A propos</Link></li>
                        <li><Link to="/services">Services</Link></li>
                        <li><Link to="/rdv">Rendez-vous</Link></li>
                        <li><Link to="/contact">Contact</Link></li>
                    </ul>
                </section>

                <section>
                    <h4>Informations</h4>
                    <ul>
                        <li><Link to="/mentions-legales">Mentions legales</Link></li>
                        <li><Link to="/confidentialite">Confidentialite</Link></li>
                        <li><Link to="/conditions-utilisation">Conditions d'utilisation</Link></li>
                    </ul>
                </section>

                <section>
                    <h4>Contact</h4>
                    <p className="subtitle"><a href="tel:+21698561586">Tel: +216 98 561 586</a></p>
                    <p className="subtitle"><a href="https://wa.me/21698561586" target="_blank" rel="noopener noreferrer">WhatsApp: +216 98 561 586</a></p>
                    <p className="subtitle"><a href="mailto:omar_oumay@hotmail.com">Email: omar_oumay@hotmail.com</a></p>
                    <p className="subtitle"><a href="https://www.facebook.com/profile.php?id=100089482776345" target="_blank" rel="noopener noreferrer">Facebook officiel</a></p>
                </section>
            </div>

            <div className="container footer-bottom">
                <p>© 2026 AlloKine. Tous droits reserves.</p>
            </div>
        </footer>
    );
}
