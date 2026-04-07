import { authApi } from './services/authApi';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const NotificationService = {
    sendAppointmentReminder: async (appointment, patientEmail, patientName = '') => {
        await authApi.fetchJson(`${API_BASE_URL}/notifications/appointment-reminder`, {
            method: 'POST',
            body: JSON.stringify({
                to: patientEmail,
                patientName,
                appointment: {
                    date: appointment.date,
                    time: appointment.time
                }
            })
        });

        return true;
    },

    sendWelcomeEmailViaGmail: async () => {
        await authApi.fetchJson(`${API_BASE_URL}/notifications/welcome`, {
            method: 'POST'
        });

        return true;
    },

    notify: (type, title, message) => {
        const colors = {
            success: '\x1b[32m',
            error: '\x1b[31m',
            warning: '\x1b[33m',
            info: '\x1b[36m'
        };

        const icons = {
            success: 'OK',
            error: 'ERR',
            warning: 'WARN',
            info: 'INFO'
        };

        const reset = '\x1b[0m';
        const color = colors[type] || colors.info;
        const icon = icons[type] || 'LOG';

        console.log(`${color}[${icon}] ${title}${reset}`);
        if (message) console.log(`   ${message}`);
    }
};
