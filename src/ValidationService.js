export const ValidationService = {
    isValidEmail: (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email) && email.length <= 100;
    },

    validatePassword: (password) => {
        const errors = [];
        if (password.length < 8) errors.push('Le mot de passe doit contenir au moins 8 caracteres');
        if (!/[A-Z]/.test(password)) errors.push('Le mot de passe doit contenir au moins une majuscule');
        if (!/[0-9]/.test(password)) errors.push('Le mot de passe doit contenir au moins un chiffre');
        if (!/[!@#$%^&*]/.test(password)) errors.push('Le mot de passe doit contenir un caractere special (!@#$%^&*)');

        return {
            isValid: errors.length === 0,
            errors
        };
    },

    isValidName: (name) => {
        return name.trim().length >= 2 && name.length <= 100;
    },

    validateAppointmentDateTime: (date, time) => {
        const errors = [];
        const appointmentDate = new Date(`${date}T${time}`);
        const now = new Date();

        if (Number.isNaN(appointmentDate.getTime())) {
            errors.push('Date ou heure invalide');
        }

        if (appointmentDate < now) {
            errors.push('Impossible de reserver dans le passe');
        }

        const hours = appointmentDate.getHours();
        if (hours < 9 || hours > 18) {
            errors.push('Les rendez-vous sont entre 9h et 18h (7j/7)');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    },

    isValidPainDescription: (douleur) => {
        return douleur.trim().length >= 10 && douleur.length <= 1000;
    },

    validateMedicalFile: (file) => {
        const errors = [];
        const allowedTypes = [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        const maxSize = 10 * 1024 * 1024;

        if (!allowedTypes.includes(file.type)) {
            errors.push('Format de fichier non accepte. Utilisez PDF, JPG, PNG ou DOCX');
        }

        if (file.size > maxSize) {
            errors.push('Le fichier depasse 10MB');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
};
