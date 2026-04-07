import { authApi } from './authApi';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

const mapAppointment = (appointment) => ({
    id: appointment.id,
    patientId: appointment.patientId ?? appointment.patient_id,
    patientName: appointment.patientName ?? appointment.patient_name ?? '',
    patient: appointment.patient || null,
    date: appointment.date,
    time: appointment.time,
    location: appointment.location,
    reason: appointment.reason,
    serviceId: appointment.serviceId ?? appointment.service_id ?? null,
    servicePrice: appointment.servicePrice ?? appointment.service_price ?? null,
    totalPrice: appointment.totalPrice ?? appointment.total_price ?? null,
    painDescription: appointment.painDescription ?? appointment.pain_description ?? '',
    specificNeeds: appointment.specificNeeds ?? appointment.specific_needs ?? '',
    requestDetails: appointment.requestDetails ?? appointment.request_details ?? {},
    attachedFile: appointment.attachedFile ?? appointment.attached_file ?? null,
    status: appointment.status,
    notes: Array.isArray(appointment.notes) ? appointment.notes : [],
    createdAt: appointment.createdAt ?? appointment.created_at,
    updatedAt: appointment.updatedAt ?? appointment.updated_at
});

export const appointmentsApi = {
    getAvailableSlots: async (date) => {
        const data = await authApi.fetchJson(
            `${API_BASE_URL}/appointments/slots?date=${encodeURIComponent(date)}`,
            { method: 'GET' }
        );

        return data.slots || [];
    },

    create: async (payload) => {
        const data = await authApi.fetchJson(`${API_BASE_URL}/appointments`, {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        return mapAppointment(data.appointment);
    },

    getMine: async () => {
        const data = await authApi.fetchJson(`${API_BASE_URL}/appointments/mine`, { method: 'GET' });
        return (data.appointments || []).map(mapAppointment);
    },

    getDashboard: async () => {
        const data = await authApi.fetchJson(`${API_BASE_URL}/appointments/dashboard`, {
            method: 'GET'
        });

        return {
            appointments: (data.appointments || []).map(mapAppointment),
            metrics: data.metrics || {
                totalAppointments: 0,
                pendingAppointments: 0,
                confirmedAppointments: 0,
                completedAppointments: 0,
                activePatients: 0
            }
        };
    },

    updateStatus: async (appointmentId, status) => {
        const data = await authApi.fetchJson(`${API_BASE_URL}/appointments/${appointmentId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status })
        });

        return mapAppointment(data.appointment);
    },

    addNote: async (appointmentId, content) => {
        const data = await authApi.fetchJson(`${API_BASE_URL}/appointments/${appointmentId}/notes`, {
            method: 'POST',
            body: JSON.stringify({ content })
        });

        return mapAppointment(data.appointment);
    },

    remove: async (appointmentId) => {
        await authApi.fetchJson(`${API_BASE_URL}/appointments/${appointmentId}`, {
            method: 'DELETE'
        });
    }
};
