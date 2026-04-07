/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useState, useContext } from 'react';
import { AlertCircle, CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

export const ToastContext = createContext();

/**
 * Toast Provider - Wraps app to provide toast notifications
 */
export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const addToast = useCallback((message, type = 'info', duration = 4000) => {
        const id = Date.now();
        const toast = { id, message, type };
        
        setToasts(prev => [...prev, toast]);

        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }

        return id;
    }, [removeToast]);

    const notify = {
        success: (message, duration) => addToast(message, 'success', duration),
        error: (message, duration) => addToast(message, 'error', duration),
        warning: (message, duration) => addToast(message, 'warning', duration),
        info: (message, duration) => addToast(message, 'info', duration),
    };

    return (
        <ToastContext.Provider value={{ addToast, removeToast, notify }}>
            {children}
            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </ToastContext.Provider>
    );
}

/**
 * Toast Container - Renders all active toasts
 */
function ToastContainer({ toasts, onRemove }) {
    return (
        <div className="toast-container">
            {toasts.map(toast => (
                <Toast 
                    key={toast.id}
                    {...toast}
                    onClose={() => onRemove(toast.id)}
                />
            ))}
        </div>
    );
}

/**
 * Individual Toast Component
 */
function Toast({ message, type, onClose }) {
    const getIcon = () => {
        switch (type) {
            case 'success':
                return <CheckCircle size={20} />;
            case 'error':
                return <AlertCircle size={20} />;
            case 'warning':
                return <AlertTriangle size={20} />;
            default:
                return <Info size={20} />;
        }
    };

    const getStyles = () => {
        const baseStyles = {
            display: 'flex',
            alignItems: 'center',
            gap: '0.8rem',
            padding: '1rem 1.2rem',
            borderRadius: '10px',
            boxShadow: 'var(--shadow)',
            border: '1px solid',
            marginBottom: '0.8rem',
            animation: 'slideIn 0.3s ease-out',
            backgroundColor: 'var(--surface)',
        };

        const typeStyles = {
            success: {
                borderColor: '#10b981',
                color: '#86efac',
            },
            error: {
                borderColor: '#ef4444',
                color: '#fecaca',
            },
            warning: {
                borderColor: '#f59e0b',
                color: '#fde68a',
            },
            info: {
                borderColor: 'var(--primary)',
                color: '#a5f3fc',
            },
        };

        return { ...baseStyles, ...typeStyles[type] };
    };

    return (
        <div style={getStyles()}>
            <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                {getIcon()}
            </span>
            <span style={{ flex: 1, fontSize: '0.95rem', fontWeight: 500 }}>
                {message}
            </span>
            <button
                onClick={onClose}
                style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    color: 'inherit',
                    opacity: 0.7,
                    transition: 'opacity 0.2s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                onMouseLeave={(e) => e.currentTarget.style.opacity = 0.7}
            >
                <X size={18} />
            </button>
        </div>
    );
}

/**
 * Hook to use toast notifications in components
 */
export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
}
