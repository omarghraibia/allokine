import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import supabase from '../services/supabaseClient.js';

const router = Router();

const STATUS = {
    pending: 'en_attente',
    confirmed: 'confirme',
    completed: 'effectue',
    cancelled: 'annule'
};

const VALID_STATUS = new Set(Object.values(STATUS));

const isSchemaMissing = (error) =>
    typeof error?.message === 'string' &&
    error.message.toLowerCase().includes("could not find the table 'public.appointments'");

const schemaErrorPayload = {
    error: 'Table appointments manquante dans Supabase',
    details: 'Executez backend/sql/appointments_schema.sql dans l editeur SQL de Supabase.'
};

const sanitizePatient = (user) => {
    if (!user) return null;

    return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone || '',
        birthDate: user.birth_date || '',
        emergencyContact: user.emergency_contact || '',
        createdAt: user.created_at
    };
};

const sanitizeAppointment = (appointment, patient = null) => ({
    id: appointment.id,
    patientId: appointment.patient_id,
    patientName: patient?.name || appointment.patient_name || '',
    patient: sanitizePatient(patient),
    date: appointment.date,
    time: appointment.time,
    location: appointment.location,
    reason: appointment.reason,
    serviceId: appointment.service_id || null,
    servicePrice: appointment.service_price ?? null,
    totalPrice: appointment.total_price ?? null,
    painDescription: appointment.pain_description,
    specificNeeds: appointment.specific_needs || '',
    requestDetails: appointment.request_details || {},
    attachedFile: appointment.attached_file || null,
    status: appointment.status || STATUS.pending,
    notes: Array.isArray(appointment.notes) ? appointment.notes : [],
    createdAt: appointment.created_at,
    updatedAt: appointment.updated_at
});

const ensureDoctor = (req, res) => {
    if (req.auth.user.role !== 'docteur') {
        res.status(403).json({ error: 'Acces reserve au docteur' });
        return false;
    }

    return true;
};

const buildPatientMap = async (appointments) => {
    const patientIds = [...new Set(appointments.map((appointment) => appointment.patient_id).filter(Boolean))];
    if (patientIds.length === 0) return new Map();

    const { data: patients, error } = await supabase
        .from('users')
        .select('id, name, email, role, phone, birth_date, emergency_contact, created_at')
        .in('id', patientIds);

    if (error) throw error;

    return new Map((patients || []).map((patient) => [patient.id, patient]));
};

router.get('/slots', requireAuth, async (req, res) => {
    const { date = '' } = req.query;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ error: 'Date invalide' });
    }

    const { data: appointments, error } = await supabase
        .from('appointments')
        .select('time, status')
        .eq('date', date);

    if (error) {
        if (isSchemaMissing(error)) return res.status(500).json(schemaErrorPayload);
        return res.status(500).json({ error: 'Erreur chargement des creneaux' });
    }

    const busyTimes = (appointments || [])
        .filter((appointment) => appointment.status !== STATUS.cancelled)
        .map((appointment) => appointment.time);

    const slots = [];
    for (let hour = 9; hour < 18; hour += 1) {
        for (let minute = 0; minute < 60; minute += 30) {
            const slot = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
            if (!busyTimes.includes(slot)) {
                slots.push(slot);
            }
        }
    }

    return res.status(200).json({ slots });
});

router.post('/', requireAuth, async (req, res) => {
    const {
        date = '',
        time = '',
        location = 'cabinet',
        reason = '',
        serviceId = null,
        servicePrice = null,
        totalPrice = null,
        painDescription = '',
        specificNeeds = '',
        requestDetails = {},
        attachedFile = null
    } = req.body;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
        return res.status(400).json({ error: 'Date ou heure invalide' });
    }

    if (painDescription.trim().length < 10 || painDescription.length > 1000) {
        return res.status(400).json({ error: 'Description de douleur invalide' });
    }

    const { data: conflicts, error: conflictError } = await supabase
        .from('appointments')
        .select('id, status')
        .eq('date', date)
        .eq('time', time);

    if (conflictError) {
        if (isSchemaMissing(conflictError)) return res.status(500).json(schemaErrorPayload);
        return res.status(500).json({ error: 'Erreur verification creneau' });
    }

    const hasConflict = (conflicts || []).some((appointment) => appointment.status !== STATUS.cancelled);
    if (hasConflict) {
        return res.status(409).json({ error: 'Ce creneau est deja reserve' });
    }

    const insertPayload = {
        patient_id: req.auth.user.id,
        patient_name: req.auth.user.name,
        date,
        time,
        location,
        reason,
        service_id: serviceId,
        service_price: servicePrice,
        total_price: totalPrice,
        pain_description: painDescription.trim(),
        specific_needs: specificNeeds,
        request_details: requestDetails,
        attached_file: attachedFile,
        status: STATUS.pending,
        notes: []
    };

    const { data: appointment, error } = await supabase
        .from('appointments')
        .insert(insertPayload)
        .select('*')
        .single();

    if (error) {
        if (isSchemaMissing(error)) return res.status(500).json(schemaErrorPayload);
        return res.status(500).json({ error: 'Erreur creation rendez-vous' });
    }

    return res.status(201).json({ appointment: sanitizeAppointment(appointment, req.auth.user) });
});

router.get('/mine', requireAuth, async (req, res) => {
    const { data: appointments, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('patient_id', req.auth.user.id)
        .order('date', { ascending: true })
        .order('time', { ascending: true });

    if (error) {
        if (isSchemaMissing(error)) return res.status(500).json(schemaErrorPayload);
        return res.status(500).json({ error: 'Erreur chargement rendez-vous' });
    }

    const sanitized = (appointments || []).map((appointment) =>
        sanitizeAppointment(appointment, req.auth.user)
    );

    return res.status(200).json({ appointments: sanitized });
});

router.get('/dashboard', requireAuth, async (req, res) => {
    if (!ensureDoctor(req, res)) return;

    const { data: appointments, error } = await supabase
        .from('appointments')
        .select('*')
        .order('date', { ascending: true })
        .order('time', { ascending: true });

    if (error) {
        if (isSchemaMissing(error)) return res.status(500).json(schemaErrorPayload);
        return res.status(500).json({ error: 'Erreur chargement dashboard' });
    }

    try {
        const patientMap = await buildPatientMap(appointments || []);
        const sanitized = (appointments || []).map((appointment) =>
            sanitizeAppointment(appointment, patientMap.get(appointment.patient_id))
        );

        const metrics = {
            totalAppointments: sanitized.length,
            pendingAppointments: sanitized.filter((appointment) => appointment.status === STATUS.pending).length,
            confirmedAppointments: sanitized.filter((appointment) => appointment.status === STATUS.confirmed).length,
            completedAppointments: sanitized.filter((appointment) => appointment.status === STATUS.completed).length,
            activePatients: new Set(sanitized.map((appointment) => appointment.patientId)).size
        };

        return res.status(200).json({ appointments: sanitized, metrics });
    } catch {
        return res.status(500).json({ error: 'Erreur chargement patients dashboard' });
    }
});

router.patch('/:id/status', requireAuth, async (req, res) => {
    if (!ensureDoctor(req, res)) return;

    const { status = '' } = req.body;
    if (!VALID_STATUS.has(status)) {
        return res.status(400).json({ error: 'Statut invalide' });
    }

    const { data: appointment, error } = await supabase
        .from('appointments')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', req.params.id)
        .select('*')
        .single();

    if (error) {
        if (isSchemaMissing(error)) return res.status(500).json(schemaErrorPayload);
        return res.status(500).json({ error: 'Erreur mise a jour statut' });
    }

    const patientMap = await buildPatientMap([appointment]);
    return res.status(200).json({
        appointment: sanitizeAppointment(appointment, patientMap.get(appointment.patient_id))
    });
});

router.post('/:id/notes', requireAuth, async (req, res) => {
    if (!ensureDoctor(req, res)) return;

    const { content = '' } = req.body;
    if (content.trim().length === 0) {
        return res.status(400).json({ error: 'Note vide' });
    }

    const { data: existing, error: fetchError } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', req.params.id)
        .single();

    if (fetchError) {
        if (isSchemaMissing(fetchError)) return res.status(500).json(schemaErrorPayload);
        return res.status(404).json({ error: 'Rendez-vous introuvable' });
    }

    const nextNotes = [
        ...(Array.isArray(existing.notes) ? existing.notes : []),
        {
            id: Date.now(),
            content: content.trim(),
            createdAt: new Date().toISOString()
        }
    ];

    const { data: appointment, error } = await supabase
        .from('appointments')
        .update({ notes: nextNotes, updated_at: new Date().toISOString() })
        .eq('id', req.params.id)
        .select('*')
        .single();

    if (error) {
        if (isSchemaMissing(error)) return res.status(500).json(schemaErrorPayload);
        return res.status(500).json({ error: 'Erreur ajout note' });
    }

    const patientMap = await buildPatientMap([appointment]);
    return res.status(200).json({
        appointment: sanitizeAppointment(appointment, patientMap.get(appointment.patient_id))
    });
});

router.delete('/:id', requireAuth, async (req, res) => {
    if (!ensureDoctor(req, res)) return;

    const { error } = await supabase.from('appointments').delete().eq('id', req.params.id);

    if (error) {
        if (isSchemaMissing(error)) return res.status(500).json(schemaErrorPayload);
        return res.status(500).json({ error: 'Erreur suppression rendez-vous' });
    }

    return res.status(200).json({ ok: true });
});

export default router;
