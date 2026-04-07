import { Component } from 'react';
import { AlertCircle } from 'lucide-react';

const IS_DEV = import.meta.env.DEV;

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { 
            hasError: false, 
            error: null,
            errorInfo: null,
            errorCount: 0
        };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
        this.setState(prevState => ({
            error,
            errorInfo,
            errorCount: prevState.errorCount + 1
        }));
    }

    resetError = () => {
        this.setState({ 
            hasError: false, 
            error: null,
            errorInfo: null
        });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="container flex-center min-h-screen">
                    <div className="card" style={{ maxWidth: '500px', borderLeft: '4px solid #dc2626' }}>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                            <AlertCircle size={32} style={{ color: '#dc2626', flexShrink: 0 }} />
                            <div>
                                <h2 style={{ color: '#dc2626', marginBottom: '0.5rem' }}>
                                    Erreur de l'application
                                </h2>
                                <p style={{ color: 'var(--text-gray)', marginBottom: '1rem' }}>
                                    Une erreur inattendue s'est produite. Nos équipes ont été notifiées.
                                </p>
                                
                                {IS_DEV && this.state.error && (
                                    <details style={{ 
                                        marginBottom: '1rem', 
                                        padding: '0.8rem', 
                                        backgroundColor: 'rgba(220, 38, 38, 0.1)',
                                        borderRadius: '8px',
                                        fontSize: '0.85rem'
                                    }}>
                                        <summary style={{ cursor: 'pointer', fontWeight: 600, marginBottom: '0.5rem' }}>
                                            Détails techniques (dev only)
                                        </summary>
                                        <code style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: '#fecaca' }}>
                                            {this.state.error.toString()}
                                            {'\n\n'}
                                            {this.state.errorInfo?.componentStack}
                                        </code>
                                    </details>
                                )}

                                <div style={{ display: 'flex', gap: '0.8rem' }}>
                                    <button 
                                        onClick={this.resetError}
                                        className="btn btn-primary"
                                    >
                                        Réessayer
                                    </button>
                                    <a href="/" className="btn btn-outline">
                                        Accueil
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
