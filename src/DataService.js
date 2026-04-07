const STORAGE_KEYS = {
    USERS: 'allokine_users',
    APPOINTMENTS: 'allokine_appointments',
    MEDICAL_RECORDS: 'allokine_medical_records',
    REVIEWS: 'allokine_reviews'
};

const STATUS = {
    pending: 'en_attente',
    confirmed: 'confirme',
    completed: 'effectue',
    cancelled: 'annule'
};

const safeRead = (key, fallback) => {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch {
        return fallback;
    }
};

const save = (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
};

const normalizeStatus = (status) => {
    const map = {
        en_attente: STATUS.pending,
        'en attente': STATUS.pending,
        confirme: STATUS.confirmed,
        'confirmé': STATUS.confirmed,
        effectue: STATUS.completed,
        'effectué': STATUS.completed,
        annule: STATUS.cancelled,
        'annulé': STATUS.cancelled
    };
    return map[status] || status || STATUS.pending;
};

export const DataService = {
    initializeDatabase: () => {
        if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
            const defaultUsers = [
                {
                    id: 1,
                    name: 'Dr. Fethi Ghraibia',
                    email: 'omar_oumay@hotmail.com',
                    passwordHash: 'admin123',
                    role: 'docteur',
                    speciality: 'Kinesitherapie du sport',
                    experience: 25,
                    phone: '+216 12 345 678',
                    createdAt: new Date().toISOString()
                },
                {
                    id: 2,
                    name: 'Patient Test',
                    email: 'patient@test.com',
                    passwordHash: 'patient123',
                    role: 'client',
                    phone: '+216 98 765 432',
                    createdAt: new Date().toISOString()
                }
            ];
            save(STORAGE_KEYS.USERS, defaultUsers);
        }

        if (!localStorage.getItem(STORAGE_KEYS.APPOINTMENTS)) {
            save(STORAGE_KEYS.APPOINTMENTS, []);
        }

        if (!localStorage.getItem(STORAGE_KEYS.MEDICAL_RECORDS)) {
            save(STORAGE_KEYS.MEDICAL_RECORDS, []);
        }

        if (!localStorage.getItem(STORAGE_KEYS.REVIEWS)) {
            save(STORAGE_KEYS.REVIEWS, [
                {
                    id: 101,
                    patientName: 'Sami B.',
                    rating: 5,
                    consultationType: 'sport',
                    comment: 'Equipe tres professionnelle. Resultats visibles rapidement.',
                    date: '2026-03-19'
                },
                {
                    id: 102,
                    patientName: 'Leila H.',
                    rating: 5,
                    consultationType: 'reeducation',
                    comment: 'Excellent suivi post-operatoire et planning clair.',
                    date: '2026-03-27'
                },
                {
                    id: 103,
                    patientName: 'Karim M.',
                    rating: 4,
                    consultationType: 'senior',
                    comment: 'Cabinet bien organise et communication tres efficace.',
                    date: '2026-04-02'
                }
            ]);
        }

        DataService.migrateLegacyData();
    },

    migrateLegacyData: () => {
        const appointments = safeRead(STORAGE_KEYS.APPOINTMENTS, []);
        const migrated = appointments.map((apt) => ({
            ...apt,
            status: normalizeStatus(apt.status),
            notes: Array.isArray(apt.notes) ? apt.notes : []
        }));
        save(STORAGE_KEYS.APPOINTMENTS, migrated);
    },

    getUserByEmailPassword: (email, password) => {
        const users = safeRead(STORAGE_KEYS.USERS, []);
        return users.find((u) => u.email === email && u.passwordHash === password) || null;
    },

    emailExists: (email) => {
        const users = safeRead(STORAGE_KEYS.USERS, []);
        return users.some((u) => u.email === email);
    },

    createUser: (userData) => {
        const users = safeRead(STORAGE_KEYS.USERS, []);
        const newUser = {
            id: Date.now(),
            name: userData.name,
            email: userData.email,
            role: userData.role || 'client',
            phone: userData.phone || '',
            birthDate: userData.birthDate || '',
            gender: userData.gender || '',
            emergencyContact: userData.emergencyContact || '',
            passwordHash: userData.password,
            createdAt: new Date().toISOString()
        };
        users.push(newUser);
        save(STORAGE_KEYS.USERS, users);
        return newUser;
    },

    updateUserProfile: (userId, updates) => {
        const users = safeRead(STORAGE_KEYS.USERS, []);
        const idx = users.findIndex((u) => u.id === userId);
        if (idx === -1) return null;

        users[idx] = {
            ...users[idx],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        save(STORAGE_KEYS.USERS, users);
        return users[idx];
    },

    getAllPatients: () => {
        const users = safeRead(STORAGE_KEYS.USERS, []);
        return users.filter((u) => u.role === 'client');
    },

    getUserById: (userId) => {
        const users = safeRead(STORAGE_KEYS.USERS, []);
        return users.find((u) => u.id === userId) || null;
    },

    createAppointment: (appointmentData) => {
        const appointments = safeRead(STORAGE_KEYS.APPOINTMENTS, []);

        const newAppointment = {
            id: Date.now(),
            patientId: appointmentData.patientId,
            patientName: appointmentData.patientName,
            date: appointmentData.date,
            time: appointmentData.time,
            location: appointmentData.location,
            reason: appointmentData.reason,
            serviceId: appointmentData.serviceId || null,
            servicePrice: appointmentData.servicePrice || null,
            totalPrice: appointmentData.totalPrice || null,
            painDescription: appointmentData.painDescription,
            specificNeeds: appointmentData.specificNeeds || '',
            attachedFile: appointmentData.attachedFile || null,
            requestDetails: {
                painLevel: appointmentData.requestDetails?.painLevel || '',
                symptomDuration: appointmentData.requestDetails?.symptomDuration || '',
                medicalBackground: appointmentData.requestDetails?.medicalBackground || '',
                objective: appointmentData.requestDetails?.objective || ''
            },
            status: STATUS.pending,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            notes: []
        };

        appointments.push(newAppointment);
        save(STORAGE_KEYS.APPOINTMENTS, appointments);
        return newAppointment;
    },

    getPatientAppointments: (patientId) => {
        const appointments = safeRead(STORAGE_KEYS.APPOINTMENTS, []);
        return appointments
            .filter((a) => a.patientId === patientId)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },

    getAllAppointments: () => {
        return safeRead(STORAGE_KEYS.APPOINTMENTS, []).sort(
            (a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`)
        );
    },

    hasTimeConflict: (date, time) => {
        const appointments = safeRead(STORAGE_KEYS.APPOINTMENTS, []);
        return appointments.some((apt) => {
            const sameSlot = apt.date === date && apt.time === time;
            return sameSlot && normalizeStatus(apt.status) !== STATUS.cancelled;
        });
    },

    getAvailableTimeSlots: (date) => {
        const appointments = safeRead(STORAGE_KEYS.APPOINTMENTS, []);
        const busyTimes = appointments
            .filter((apt) => apt.date === date && normalizeStatus(apt.status) !== STATUS.cancelled)
            .map((apt) => apt.time);

        const slots = [];
        for (let hour = 9; hour < 18; hour += 1) {
            for (let min = 0; min < 60; min += 30) {
                const timeStr = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
                if (!busyTimes.includes(timeStr)) {
                    slots.push(timeStr);
                }
            }
        }
        return slots;
    },

    updateAppointmentStatus: (appointmentId, status) => {
        const appointments = safeRead(STORAGE_KEYS.APPOINTMENTS, []);
        const index = appointments.findIndex((a) => a.id === appointmentId);
        if (index === -1) return null;

        appointments[index] = {
            ...appointments[index],
            status: normalizeStatus(status),
            updatedAt: new Date().toISOString()
        };
        save(STORAGE_KEYS.APPOINTMENTS, appointments);
        return appointments[index];
    },

    deleteAppointment: (appointmentId) => {
        const appointments = safeRead(STORAGE_KEYS.APPOINTMENTS, []);
        const index = appointments.findIndex((a) => a.id === appointmentId);
        if (index === -1) return false;

        appointments.splice(index, 1);
        save(STORAGE_KEYS.APPOINTMENTS, appointments);
        return true;
    },

    addClinicalNote: (appointmentId, note) => {
        const appointments = safeRead(STORAGE_KEYS.APPOINTMENTS, []);
        const index = appointments.findIndex((a) => a.id === appointmentId);
        if (index === -1) return null;

        const clinicalNote = {
            id: Date.now(),
            content: note,
            createdAt: new Date().toISOString()
        };

        const updatedNotes = [...(appointments[index].notes || []), clinicalNote];
        appointments[index] = {
            ...appointments[index],
            notes: updatedNotes,
            updatedAt: new Date().toISOString()
        };

        save(STORAGE_KEYS.APPOINTMENTS, appointments);
        return clinicalNote;
    },

    getPatientMedicalHistory: (patientId) => {
        const patientAppointments = DataService.getPatientAppointments(patientId);

        return {
            patientId,
            totalAppointments: patientAppointments.length,
            completedAppointments: patientAppointments.filter(
                (a) => normalizeStatus(a.status) === STATUS.completed
            ).length,
            pendingAppointments: patientAppointments.filter(
                (a) => normalizeStatus(a.status) === STATUS.pending
            ).length,
            appointments: patientAppointments
        };
    },

    getPatientFullRecord: (patientId) => {
        const patient = DataService.getUserById(patientId);
        const history = DataService.getPatientMedicalHistory(patientId);

        const lastAppointment = history.appointments[0] || null;
        const totalNotes = history.appointments.reduce(
            (acc, appt) => acc + (appt.notes?.length || 0),
            0
        );

        return {
            patient,
            history,
            summary: {
                totalNotes,
                lastAppointmentDate: lastAppointment ? `${lastAppointment.date} ${lastAppointment.time}` : null,
                currentStatus: lastAppointment ? normalizeStatus(lastAppointment.status) : null
            }
        };
    },

    getPatientFiles: (patientId) => {
        const appointments = DataService.getPatientAppointments(patientId);

        return appointments
            .filter((apt) => apt.attachedFile)
            .map((apt) => {
                const fileName =
                    typeof apt.attachedFile === 'string' ? apt.attachedFile : apt.attachedFile.name;
                const extension = fileName.split('.').pop()?.toLowerCase() || 'pdf';
                const type = extension === 'pdf' ? 'PDF' : extension.toUpperCase();
                return {
                    id: `${apt.id}-${fileName}`,
                    appointmentId: apt.id,
                    patientId: apt.patientId,
                    fileName,
                    type,
                    date: apt.date,
                    secureUrl: `local://patient-${patientId}/appointment-${apt.id}/${fileName}`,
                    size: typeof apt.attachedFile === 'object' ? apt.attachedFile.size || 0 : 0,
                    mimeType: typeof apt.attachedFile === 'object' ? apt.attachedFile.type || '' : '',
                    dataUrl: typeof apt.attachedFile === 'object' ? apt.attachedFile.dataUrl || '' : ''
                };
            });
    },

    getFilesByPatientId: (patientId) => {
        return DataService.getPatientFiles(patientId);
    },

    createDownloadPayload: (fileItem) => {
        if (fileItem?.dataUrl) {
            return {
                fileName: fileItem.fileName,
                downloadUrl: fileItem.dataUrl,
                mimeType: fileItem.mimeType || 'application/octet-stream'
            };
        }

        return {
            fileName: fileItem.fileName,
            content: `Compte-rendu AlloKine\n\nPatient File: ${fileItem.fileName}\nType: ${fileItem.type}\nDate: ${fileItem.date}\nReference: ${fileItem.secureUrl}\n\nDocument exporte depuis Mon Espace.`,
            mimeType: 'text/plain'
        };
    },

    getReviews: () => safeRead(STORAGE_KEYS.REVIEWS, []),

    addReview: (reviewData) => {
        const reviews = safeRead(STORAGE_KEYS.REVIEWS, []);
        const newReview = {
            id: Date.now(),
            patientName: reviewData.patientName,
            rating: Number(reviewData.rating),
            consultationType: reviewData.consultationType || 'reeducation',
            comment: reviewData.comment,
            date: new Date().toISOString().split('T')[0]
        };
        reviews.unshift(newReview);
        save(STORAGE_KEYS.REVIEWS, reviews);
        return newReview;
    },

    searchPatients: (query) => {
        const patients = DataService.getAllPatients();
        const lowerQuery = query.toLowerCase();

        return patients.filter(
            (p) => p.name.toLowerCase().includes(lowerQuery) || p.email.toLowerCase().includes(lowerQuery)
        );
    },

    getTodayAppointments: () => {
        const today = new Date().toISOString().split('T')[0];
        const appointments = safeRead(STORAGE_KEYS.APPOINTMENTS, []);
        return appointments.filter((a) => a.date === today);
    },

    getDoctorDashboardData: () => {
        const appointments = DataService.getAllAppointments();
        const patients = DataService.getAllPatients();

        const total = appointments.length;
        const pending = appointments.filter((a) => normalizeStatus(a.status) === STATUS.pending).length;
        const confirmed = appointments.filter((a) => normalizeStatus(a.status) === STATUS.confirmed).length;
        const completed = appointments.filter((a) => normalizeStatus(a.status) === STATUS.completed).length;

        return {
            appointments,
            patients,
            metrics: {
                totalAppointments: total,
                pendingAppointments: pending,
                confirmedAppointments: confirmed,
                completedAppointments: completed,
                activePatients: patients.length
            }
        };
    },

    STATUS
};
