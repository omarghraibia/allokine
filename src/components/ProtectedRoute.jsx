/**
 * Protected Route Wrapper
 * Empêche l'accès aux pages protégées sans être connecté
 */

import { Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function ProtectedRoute({ children, requiredRole = null }) {
    const { user, isLoading } = useContext(AuthContext);

    if (isLoading) {
        return (
            <div className="flex-center min-h-screen">
                <p>Connexion en cours...</p>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (requiredRole && user.role !== requiredRole) {
        return <Navigate to="/" replace />;
    }

    return children;
}
