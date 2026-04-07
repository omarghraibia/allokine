/* eslint-disable react-refresh/only-export-components */
import { createContext, useEffect, useState } from 'react';
import { DataService } from '../DataService';
import { ValidationService } from '../ValidationService';
import { authApi } from '../services/authApi';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('allokine_currentUser')) || null);
    const [errors, setErrors] = useState([]);

    useEffect(() => {
        DataService.initializeDatabase();

        const hydrateFromBackend = async () => {
            if (!authApi.isBackendEnabled) return;
            try {
                const { user: backendUser } = await authApi.getMe();
                setUser(backendUser);
                localStorage.setItem('allokine_currentUser', JSON.stringify(backendUser));
            } catch (error) {
                if (authApi.isStrictBackend) {
                    setUser(null);
                    localStorage.removeItem('allokine_currentUser');
                }
                void error;
            }
        };

        hydrateFromBackend();
    }, []);

    const login = async (email, password) => {
        setErrors([]);

        if (!ValidationService.isValidEmail(email)) {
            const error = 'Adresse email invalide';
            setErrors([error]);
            return { success: false, error };
        }

        if (!password || password.length === 0) {
            const error = 'Mot de passe requis';
            setErrors([error]);
            return { success: false, error };
        }

        if (authApi.isBackendEnabled) {
            try {
                const { user: backendUser } = await authApi.login({ email, password });
                setUser(backendUser);
                localStorage.setItem('allokine_currentUser', JSON.stringify(backendUser));
                return { success: true };
            } catch (error) {
                if (authApi.isStrictBackend) {
                    const backendError = error.message || 'Email ou mot de passe incorrect';
                    setErrors([backendError]);
                    return { success: false, error: backendError };
                }
            }
        }

        const foundUser = DataService.getUserByEmailPassword(email, password);

        if (foundUser) {
            const userToStore = { ...foundUser };
            delete userToStore.passwordHash;
            setUser(userToStore);
            localStorage.setItem('allokine_currentUser', JSON.stringify(userToStore));
            return { success: true };
        }

        const error = 'Email ou mot de passe incorrect';
        setErrors([error]);
        return { success: false, error };
    };

    const register = async (name, email, password, profile = {}) => {
        const registrationErrors = [];

        if (!ValidationService.isValidName(name)) {
            registrationErrors.push('Le nom doit contenir entre 2 et 100 caracteres');
        }

        if (!ValidationService.isValidEmail(email)) {
            registrationErrors.push('Adresse email invalide');
        }

        const passwordValidation = ValidationService.validatePassword(password);
        if (!passwordValidation.isValid) {
            registrationErrors.push(...passwordValidation.errors);
        }

        if (registrationErrors.length > 0) {
            setErrors(registrationErrors);
            return { success: false, errors: registrationErrors };
        }

        if (authApi.isBackendEnabled) {
            try {
                const { user: backendUser } = await authApi.register({
                    name,
                    email,
                    password,
                    phone: profile.phone || '',
                    birthDate: profile.birthDate || '',
                    emergencyContact: profile.emergencyContact || ''
                });
                setUser(backendUser);
                localStorage.setItem('allokine_currentUser', JSON.stringify(backendUser));
                setErrors([]);
                return { success: true };
            } catch (error) {
                if (authApi.isStrictBackend) {
                    const backendErrors = [error.message || "Erreur lors de l'inscription"];
                    setErrors(backendErrors);
                    return { success: false, errors: backendErrors };
                }
            }
        }

        if (DataService.emailExists(email)) {
            const duplicateError = ['Cet email est deja utilise'];
            setErrors(duplicateError);
            return { success: false, errors: duplicateError };
        }

        const newUser = DataService.createUser({
            name,
            email,
            password,
            role: 'client',
            phone: profile.phone || '',
            birthDate: profile.birthDate || '',
            emergencyContact: profile.emergencyContact || ''
        });

        const userToStore = { ...newUser };
        delete userToStore.passwordHash;
        setUser(userToStore);
        localStorage.setItem('allokine_currentUser', JSON.stringify(userToStore));
        setErrors([]);

        return { success: true };
    };

    const forgotPassword = async (email) => {
        if (!ValidationService.isValidEmail(email)) {
            return { success: false, error: 'Adresse email invalide' };
        }

        if (!authApi.isBackendEnabled) {
            return {
                success: false,
                error: 'Mode local actif: activez le backend pour le reset securise.'
            };
        }

        try {
            await authApi.forgotPassword({ email });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message || 'Erreur de reinitialisation' };
        }
    };

    const resetPassword = async (token, newPassword) => {
        if (!authApi.isBackendEnabled) {
            return {
                success: false,
                error: 'Mode local actif: activez le backend pour le reset securise.'
            };
        }

        try {
            await authApi.resetPassword({ token, newPassword });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message || 'Token invalide ou expire' };
        }
    };

    const logout = async () => {
        if (authApi.isBackendEnabled) {
            try {
                await authApi.logout();
            } catch {
                // fallback local only
            }
        }

        setUser(null);
        localStorage.removeItem('allokine_currentUser');
        setErrors([]);
    };

    const getCurrentUser = () => user;
    const isAuthenticated = () => user !== null;
    const hasRole = (role) => user && user.role === role;

    return (
        <AuthContext.Provider
            value={{
                user,
                errors,
                login,
                register,
                forgotPassword,
                resetPassword,
                logout,
                getCurrentUser,
                isAuthenticated,
                hasRole
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}
