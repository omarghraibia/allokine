import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext, AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ErrorBoundary from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Rdv from './pages/Rdv';
import About from './pages/About';
import Services from './pages/Services';
import Contact from './pages/Contact';
import Gallery from './pages/Gallery';
import AvisEnLigne from './pages/AvisEnLigne';
import MentionsLegales from './pages/MentionsLegales';
import Confidentialite from './pages/Confidentialite';
import ConditionsUtilisation from './pages/ConditionsUtilisation';
import { getRoleHomePath } from './utils/roleRedirect';
import { Analytics } from '@vercel/analytics/react';

function RoleDashboardRedirect() {
    const { user, isLoading } = useContext(AuthContext);

    if (isLoading) {
        return null;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return <Navigate to={getRoleHomePath(user.role)} replace />;
}

function App() {
    return (
        <ErrorBoundary>
            <AuthProvider>
                <ToastProvider>
                    <Router>
                        <Navbar />
                        <main className="app-main">
                            <Routes>
                                <Route path="/" element={<Home />} />
                                <Route path="/login" element={<Login />} />

                                <Route
                                    path="/dashboard"
                                    element={
                                        <ProtectedRoute>
                                            <RoleDashboardRedirect />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/espace-client"
                                    element={
                                        <ProtectedRoute requiredRole="client">
                                            <Dashboard />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/espace-docteur"
                                    element={
                                        <ProtectedRoute requiredRole="docteur">
                                            <Dashboard />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/rdv"
                                    element={
                                        <ProtectedRoute>
                                            <Rdv />
                                        </ProtectedRoute>
                                    }
                                />

                                <Route path="/about" element={<About />} />
                                <Route path="/services" element={<Services />} />
                                <Route path="/contact" element={<Contact />} />
                                <Route path="/gallery" element={<Gallery />} />
                                <Route path="/avis" element={<AvisEnLigne />} />
                                <Route path="/mentions-legales" element={<MentionsLegales />} />
                                <Route path="/confidentialite" element={<Confidentialite />} />
                                <Route path="/conditions-utilisation" element={<ConditionsUtilisation />} />

                                <Route path="*" element={<Navigate to="/" replace />} />
                            </Routes>
                        </main>
                        <Footer />
                        <Analytics />
                    </Router>
                </ToastProvider>
            </AuthProvider>
        </ErrorBoundary>
    );
}

export default App;
