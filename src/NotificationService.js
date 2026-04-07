export const NotificationService = {
    sendAppointmentReminder: async (appointment, patientEmail) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log('[GMAIL-SIM] Reminder sent', {
                    to: patientEmail,
                    subject: `Rappel rendez-vous ${appointment.date} ${appointment.time}`,
                    provider: 'Google Gmail API (simulee)'
                });
                resolve(true);
            }, 500);
        });
    },

    sendAppointmentConfirmation: async (appointment, doctorEmail) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log('[GMAIL-SIM] Appointment confirmation sent', {
                    to: doctorEmail,
                    subject: `Nouveau rendez-vous confirme #${appointment.id || 'N/A'}`,
                    provider: 'Google Gmail API (simulee)'
                });
                resolve(true);
            }, 500);
        });
    },

    sendWelcomeEmailViaGmail: async (recipientEmail, name) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log('[GMAIL-SIM] Welcome email sent', {
                    to: recipientEmail,
                    subject: 'Bienvenue sur AlloKine',
                    htmlTemplate: 'welcome-account-template-v1',
                    patientName: name
                });
                resolve(true);
            }, 450);
        });
    },

    connectGoogleOAuth: async () => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: true,
                    provider: 'google',
                    user: {
                        name: 'Patient Google',
                        email: 'patient.google@allokine.tn'
                    }
                });
            }, 600);
        });
    },

    connectFacebookOAuth: async () => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: true,
                    provider: 'facebook',
                    user: {
                        name: 'Patient Facebook',
                        email: 'patient.facebook@allokine.tn'
                    }
                });
            }, 600);
        });
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
