import { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getRoleHomePath } from '../utils/roleRedirect';

export default function Navbar() {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const [isOpen, setIsOpen] = useState(false);
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : '';
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

    const handleLogout = () => {
        logout();
        setIsOpen(false);
        navigate('/');
    };

    const closeMenu = () => setIsOpen(false);

    return (
        <header className="navbar">
            <div className="nav-shell">
                <Link to="/" className="logo" onClick={closeMenu}>
                    <img src="src/assets/logo.jpg" alt="Logo AlloKine" className="nav-logo-img" />
                    <span>
                        ALLO<span className="text-blue">KINE</span>
                    </span>
                </Link>

                <button className="mobile-menu-btn" onClick={() => setIsOpen(!isOpen)} aria-label="Ouvrir le menu">
                    {isOpen ? 'X' : '='}
                </button>

                <nav className={`nav-links ${isOpen ? 'active' : ''}`}>
                    <Link to="/about" onClick={closeMenu}>A propos</Link>
                    <Link to="/services" onClick={closeMenu}>Tarifs & Services</Link>
                    <Link to="/gallery" onClick={closeMenu}>Galerie</Link>
                    <Link to="/contact" onClick={closeMenu}>Contact</Link>
                    <Link to="/avis" onClick={closeMenu}>Avis Clients</Link>

                    {user ? (
                        <>
                            <Link to={getRoleHomePath(user.role)} className="text-blue font-bold" onClick={closeMenu}>
                                Mon Espace
                            </Link>
                            <button onClick={handleLogout} className="btn-text btn-danger">
                                Deconnexion
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="btn-text" onClick={closeMenu}>
                                Connexion
                            </Link>
                            <Link to="/rdv" className="btn btn-primary nav-cta" onClick={closeMenu}>
                                Prendre RDV
                            </Link>
                        </>
                    )}

                    <button onClick={toggleTheme} className="btn-text theme-toggle" aria-label="Changer le theme">
                        {theme === 'dark' ? 'Mode clair' : 'Mode nuit'}
                    </button>
                </nav>
            </div>
        </header>
    );
}
