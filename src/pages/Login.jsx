import { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Globe, Lock, Mail, Share2, UserRound } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { ValidationService } from '../ValidationService';
import { NotificationService } from '../NotificationService';
import { useToast } from '../context/ToastContext';
import { hasSupabaseBrowserConfig, supabase } from '../services/supabaseBrowser';

export default function Login() {
    const [isRegisterMode, setIsRegisterMode] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [emergencyContact, setEmergencyContact] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [resetToken, setResetToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [errors, setErrors] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const { login, register, forgotPassword, resetPassword } = useContext(AuthContext);
    const navigate = useNavigate();
    const { notify } = useToast();
    const [searchParams] = useSearchParams();

    const urlResetToken = searchParams.get('resetToken') || '';
    const effectiveResetToken = useMemo(() => resetToken || urlResetToken, [resetToken, urlResetToken]);

    useEffect(() => {
        if (urlResetToken) {
            setShowForgotPassword(true);
        }
    }, [urlResetToken]);

    const resetForm = () => {
        setName('');
        setPhone('');
        setBirthDate('');
        setEmergencyContact('');
        setEmail('');
        setPassword('');
        setForgotEmail('');
        setResetToken('');
        setNewPassword('');
        setErrors([]);
    };

    const handleGoogleLogin = async () => {
        setErrors([]);
        setIsLoading(true);
        try {
            if (!supabase || !hasSupabaseBrowserConfig) {
                setErrors(['Configuration Supabase OAuth manquante']);
                return;
            }

            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/dashboard`
                }
            });

            if (error) {
                console.error('Erreur de connexion :', error.message);
                setErrors([error.message || 'Connexion google indisponible']);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleFacebookLogin = async () => {
        setErrors([]);
        setIsLoading(true);
        try {
            if (!supabase || !hasSupabaseBrowserConfig) {
                setErrors(['Configuration Supabase OAuth manquante']);
                return;
            }

            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'facebook',
                options: {
                    redirectTo: `${window.location.origin}/dashboard`
                }
            });

            if (error) {
                console.error('Erreur de connexion :', error.message);
                setErrors([error.message || 'Connexion facebook indisponible']);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors([]);
        setIsLoading(true);

        try {
            if (isRegisterMode) {
                const validationErrors = [];

                if (!ValidationService.isValidName(name)) {
                    validationErrors.push('Le nom doit contenir entre 2 et 100 caracteres.');
                }

                if (!ValidationService.isValidEmail(email)) {
                    validationErrors.push('Adresse email invalide.');
                }

                const passwordValidation = ValidationService.validatePassword(password);
                if (!passwordValidation.isValid) {
                    validationErrors.push(...passwordValidation.errors);
                }

                if (validationErrors.length > 0) {
                    setErrors(validationErrors);
                    return;
                }

                const result = await register(name, email, password, {
                    phone,
                    birthDate,
                    emergencyContact
                });

                if (result.success) {
                    if (hasSupabaseBrowserConfig) {
                        try {
                            await NotificationService.sendWelcomeEmailViaGmail(email, name);
                        } catch {
                            // welcome email is non-blocking
                        }
                    }
                    notify.success(`✓ Bienvenue ${name}! 🎉`);
                    navigate('/dashboard');
                } else {
                    result.errors?.forEach(err => notify.error(err));
                }
            } else {
                if (!ValidationService.isValidEmail(email)) {
                    notify.error('Adresse email invalide.');
                    return;
                }

                if (!password) {
                    notify.error('Mot de passe requis.');
                    return;
                }

                const result = await login(email, password);
                if (result.success) {
                    notify.success('✓ Connexion réussie! 🎊');
                    navigate('/dashboard');
                } else {
                    notify.error(result.error || 'Identifiants incorrects');
                }
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        setErrors([]);
        setIsLoading(true);
        try {
            const result = await forgotPassword(forgotEmail);
            if (result.success) {
                NotificationService.notify('success', 'Reset envoye', 'Verifiez votre email pour le token.');
            } else {
                setErrors([result.error || 'Erreur reset mot de passe']);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async () => {
        setErrors([]);
        setIsLoading(true);
        try {
            const passwordValidation = ValidationService.validatePassword(newPassword);
            if (!passwordValidation.isValid) {
                setErrors(passwordValidation.errors);
                return;
            }

            const result = await resetPassword(effectiveResetToken, newPassword);
            if (result.success) {
                NotificationService.notify('success', 'Mot de passe modifie', 'Vous pouvez vous reconnecter.');
                setShowForgotPassword(false);
                setResetToken('');
                setNewPassword('');
            } else {
                setErrors([result.error || 'Token invalide']);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container flex-center min-h-screen">
            <div className="card auth-card login-card">
                <h2 className="text-center">{isRegisterMode ? 'Creer un compte patient' : 'Connexion securisee'}</h2>

                {!isRegisterMode && (
                    <div className="social-auth mt-2">
                        <button className="btn btn-social" onClick={handleGoogleLogin} type="button" disabled={isLoading}>
                            <Globe size={18} /> Continuer avec Google
                        </button>
                        <button className="btn btn-social" onClick={handleFacebookLogin} type="button" disabled={isLoading}>
                            <Share2 size={18} /> Continuer avec Facebook
                        </button>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="mt-4">
                    {errors.length > 0 && (
                        <div className="alert-box">
                            <strong>Verification requise</strong>
                            <ul>
                                {errors.map((err, idx) => (
                                    <li key={idx}>{err}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {isRegisterMode && (
                        <div className="form-group">
                            <label>Nom complet *</label>
                            <div className="input-icon-wrap"><UserRound size={16} /><input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Votre nom" required disabled={isLoading} /></div>
                        </div>
                    )}

                    {isRegisterMode && (
                        <div className="form-group"><label>Telephone</label><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+216 XX XXX XXX" disabled={isLoading} /></div>
                    )}

                    {isRegisterMode && (
                        <div className="grid" style={{ gap: '0.8rem' }}>
                            <div className="form-group"><label>Date de naissance</label><input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} disabled={isLoading} /></div>
                            <div className="form-group"><label>Contact d'urgence</label><input type="text" value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value)} placeholder="Nom + numero" disabled={isLoading} /></div>
                        </div>
                    )}

                    <div className="form-group">
                        <label>Email *</label>
                        <div className="input-icon-wrap"><Mail size={16} /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="exemple@email.com" required disabled={isLoading} autoComplete="email" /></div>
                    </div>

                    <div className="form-group">
                        <label>Mot de passe *</label>
                        <div className="input-icon-wrap">
                            <Lock size={16} />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="........"
                                required
                                disabled={isLoading}
                                autoComplete={isRegisterMode ? 'new-password' : 'current-password'}
                            />
                            <button type="button" className="btn-text" onClick={() => setShowPassword((v) => !v)}>
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        {isRegisterMode && (
                            <small style={{ color: '#94a3b8' }}>Min. 8 caracteres, 1 majuscule, 1 chiffre, 1 special (!@#$%^&*)</small>
                        )}
                    </div>

                    <button type="submit" className="btn btn-primary full-width mt-2" disabled={isLoading}>
                        {isLoading ? 'Chargement...' : isRegisterMode ? "S'inscrire" : 'Se connecter'}
                    </button>
                </form>

                {!isRegisterMode && (
                    <button className="btn-text mt-2" onClick={() => setShowForgotPassword((v) => !v)}>
                        Mot de passe oublie ?
                    </button>
                )}

                {showForgotPassword && !isRegisterMode && (
                    <div className="card mt-2">
                        <h4>Reinitialisation securisee</h4>
                        <div className="form-group mt-2">
                            <label>Email</label>
                            <input value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} placeholder="votre@email.com" />
                        </div>
                        <button type="button" className="btn btn-outline" onClick={handleForgotPassword} disabled={isLoading}>
                            Envoyer le token
                        </button>

                        <div className="form-group mt-2">
                            <label>Token</label>
                            <input value={effectiveResetToken} onChange={(e) => setResetToken(e.target.value)} placeholder="Token recu par email" />
                        </div>
                        <div className="form-group">
                            <label>Nouveau mot de passe</label>
                            <div className="input-icon-wrap">
                                <Lock size={16} />
                                <input
                                    type={showNewPassword ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Nouveau mot de passe"
                                />
                                <button type="button" className="btn-text" onClick={() => setShowNewPassword((v) => !v)}>
                                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                        <button type="button" className="btn btn-primary" onClick={handleResetPassword} disabled={isLoading || !effectiveResetToken}>
                            Reinitialiser
                        </button>
                    </div>
                )}

                <p className="text-center mt-2" style={{ cursor: 'pointer', color: 'var(--primary)', fontWeight: 700 }} onClick={() => {
                    setIsRegisterMode(!isRegisterMode);
                    setShowForgotPassword(false);
                    resetForm();
                }}>
                    {isRegisterMode ? 'Deja un compte ? Se connecter' : 'Nouveau patient ? Creer un compte'}
                </p>
            </div>
        </div>
    );
}
