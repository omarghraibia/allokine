import { useContext, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { DataService } from '../DataService';
import { ValidationService } from '../ValidationService';
import { NotificationService } from '../NotificationService';
import { useToast } from '../context/ToastContext';
import { authApi } from '../services/authApi';
import { appointmentsApi } from '../services/appointmentsApi';
import { DOMICILE_FEE, formatTnd, getServiceById, SERVICES_CATALOG } from '../constants/servicesCatalog';

const readFileAsDataUrl = (file) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Lecture du fichier impossible'));
        reader.readAsDataURL(file);
    });

export default function Rdv() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const { notify } = useToast();

    const initialServiceId = location.state?.serviceId || SERVICES_CATALOG[0].id;

    const [serviceId, setServiceId] = useState(initialServiceId);
    const [lieu, setLieu] = useState('cabinet');
    const [date, setDate] = useState('');
    const [heure, setHeure] = useState('');
    const [douleur, setDouleur] = useState('');
    const [besoins, setBesoins] = useState('');
    const [painLevel, setPainLevel] = useState('');
    const [symptomDuration, setSymptomDuration] = useState('');
    const [medicalBackground, setMedicalBackground] = useState('');
    const [objective, setObjective] = useState('');
    const [rapports, setRapports] = useState(null);
    const [errors, setErrors] = useState([]);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const selectedService = useMemo(() => getServiceById(serviceId) || SERVICES_CATALOG[0], [serviceId]);
    const finalPrice = selectedService.price + (lieu === 'domicile' ? DOMICILE_FEE : 0);

    const handleDateChange = async (e) => {
        const selectedDate = e.target.value;
        setDate(selectedDate);
        if (!selectedDate) {
            setAvailableSlots([]);
            setHeure('');
            return;
        }

        try {
            const slots = authApi.isBackendEnabled
                ? await appointmentsApi.getAvailableSlots(selectedDate)
                : DataService.getAvailableTimeSlots(selectedDate);

            setAvailableSlots(slots);
            setHeure('');
        } catch (error) {
            notify.error(error.details || error.message || 'Impossible de charger les creneaux');
            setAvailableSlots([]);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const validation = ValidationService.validateMedicalFile(file);
        if (!validation.isValid) {
            setErrors(validation.errors);
            setRapports(null);
            validation.errors.forEach((err) => notify.error(err));
            return;
        }

        setRapports(file);
        setErrors([]);
        notify.success(`Fichier accepte: ${file.name}`);
    };

    const preview = useMemo(
        () => ({
            service: selectedService.title,
            prix: formatTnd(finalPrice),
            lieu,
            date: date || 'Non defini',
            heure: heure || 'Non definie',
            douleur: douleur || 'Aucune description',
            painLevel: painLevel || 'Non renseigne',
            symptomDuration: symptomDuration || 'Non renseignee',
            objective: objective || 'Non renseigne'
        }),
        [selectedService.title, finalPrice, lieu, date, heure, douleur, painLevel, symptomDuration, objective]
    );

    const resetForm = () => {
        setDate('');
        setHeure('');
        setDouleur('');
        setBesoins('');
        setPainLevel('');
        setSymptomDuration('');
        setMedicalBackground('');
        setObjective('');
        setRapports(null);
        setErrors([]);
        setAvailableSlots([]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user) {
            navigate('/login');
            return;
        }

        const validationErrors = [];
        const dateTimeValidation = ValidationService.validateAppointmentDateTime(date, heure);
        if (!dateTimeValidation.isValid) {
            validationErrors.push(...dateTimeValidation.errors);
        }

        if (!ValidationService.isValidPainDescription(douleur)) {
            validationErrors.push('La description de douleur doit contenir entre 10 et 1000 caracteres.');
        }

        if (!painLevel) {
            validationErrors.push('Veuillez renseigner le niveau de douleur.');
        }

        if (!symptomDuration.trim()) {
            validationErrors.push('Veuillez renseigner la duree des symptomes.');
        }

        if (!authApi.isBackendEnabled && DataService.hasTimeConflict(date, heure)) {
            validationErrors.push('Ce creneau est deja reserve. Choisissez une autre heure.');
        }

        if (validationErrors.length > 0) {
            setErrors(validationErrors);
            NotificationService.notify('error', 'Erreur de validation', validationErrors[0]);
            return;
        }

        setIsSubmitting(true);
        try {
            let attachedFile = null;
            if (rapports) {
                const dataUrl = await readFileAsDataUrl(rapports);
                attachedFile = {
                    name: rapports.name,
                    type: rapports.type,
                    size: rapports.size,
                    dataUrl,
                    uploadedAt: new Date().toISOString()
                };
            }

            const payload = {
                patientId: user.id,
                patientName: user.name,
                date,
                time: heure,
                location: lieu,
                reason: selectedService.title,
                serviceId: selectedService.id,
                servicePrice: selectedService.price,
                totalPrice: finalPrice,
                painDescription: douleur,
                specificNeeds: besoins,
                attachedFile,
                requestDetails: {
                    painLevel,
                    symptomDuration,
                    medicalBackground,
                    objective
                }
            };

            const appointment = authApi.isBackendEnabled
                ? await appointmentsApi.create(payload)
                : DataService.createAppointment(payload);

            NotificationService.notify(
                'success',
                'Demande envoyee',
                `Demande #${appointment.id} enregistree (${formatTnd(finalPrice)}).`
            );

            resetForm();
            setTimeout(() => navigate('/dashboard'), 600);
        } catch (error) {
            notify.error(error.details || error.message || 'Erreur lors de la creation du rendez-vous');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="container pt-top min-h-screen">
            <div className="grid rdv-layout">
                <section className="card">
                    <h2>Demande de rendez-vous</h2>
                    <p className="subtitle">Formulaire patient organise pour un traitement rapide par le praticien.</p>

                    {errors.length > 0 && (
                        <div className="alert-box mt-2">
                            <strong>Informations a corriger</strong>
                            <ul>
                                {errors.map((err, idx) => (
                                    <li key={idx}>{err}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <form className="mt-4" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Prestation choisie</label>
                            <select value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
                                {SERVICES_CATALOG.map((service) => (
                                    <option key={service.id} value={service.id}>
                                        {service.title} - {formatTnd(service.price)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Lieu de consultation</label>
                            <div className="toggle-row">
                                <label>
                                    <input
                                        type="radio"
                                        value="cabinet"
                                        checked={lieu === 'cabinet'}
                                        onChange={(e) => setLieu(e.target.value)}
                                    />
                                    Cabinet
                                </label>
                                <label>
                                    <input
                                        type="radio"
                                        value="domicile"
                                        checked={lieu === 'domicile'}
                                        onChange={(e) => setLieu(e.target.value)}
                                    />
                                    Domicile (+{formatTnd(DOMICILE_FEE)})
                                </label>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Date souhaitee</label>
                            <input type="date" required value={date} onChange={handleDateChange} />
                        </div>

                        <div className="form-group">
                            <label>Heure souhaitee</label>
                            <select value={heure} onChange={(e) => setHeure(e.target.value)} required>
                                <option value="">Selectionner</option>
                                {availableSlots.map((slot) => (
                                    <option key={slot} value={slot}>
                                        {slot}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Niveau de douleur (0-10)</label>
                            <input
                                type="number"
                                min="0"
                                max="10"
                                value={painLevel}
                                onChange={(e) => setPainLevel(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Duree des symptomes</label>
                            <input
                                type="text"
                                value={symptomDuration}
                                onChange={(e) => setSymptomDuration(e.target.value)}
                                placeholder="Ex: 3 semaines"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Description de la douleur</label>
                            <textarea
                                rows="3"
                                value={douleur}
                                onChange={(e) => setDouleur(e.target.value)}
                                placeholder="Localisation, intensite, mouvement declencheur..."
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Antecedents medicaux</label>
                            <textarea
                                rows="2"
                                value={medicalBackground}
                                onChange={(e) => setMedicalBackground(e.target.value)}
                                placeholder="Operations, pathologies, allergies..."
                            />
                        </div>

                        <div className="form-group">
                            <label>Objectif du patient</label>
                            <textarea
                                rows="2"
                                value={objective}
                                onChange={(e) => setObjective(e.target.value)}
                                placeholder="Reprendre le sport, marcher sans douleur..."
                            />
                        </div>

                        <div className="form-group">
                            <label>Besoins specifiques</label>
                            <textarea
                                rows="2"
                                value={besoins}
                                onChange={(e) => setBesoins(e.target.value)}
                                placeholder="Contrainte horaire, acces PMR, etc."
                            />
                        </div>

                        <div className="form-group">
                            <label>Document medical (optionnel)</label>
                            <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                onChange={handleFileChange}
                            />
                            {rapports && <small>Fichier: {rapports.name}</small>}
                        </div>

                        <button type="submit" className="btn btn-primary full-width mt-2" disabled={isSubmitting}>
                            {isSubmitting ? 'Envoi...' : `Envoyer ma demande (${formatTnd(finalPrice)})`}
                        </button>
                    </form>
                </section>

                <aside className="card request-preview">
                    <h3>Apercu de votre demande</h3>
                    <p className="subtitle">Ce resume est visible par le medecin dans le dossier patient.</p>

                    <dl className="preview-list mt-2">
                        <div>
                            <dt>Prestation</dt>
                            <dd>{preview.service}</dd>
                        </div>
                        <div>
                            <dt>Prix estime</dt>
                            <dd>{preview.prix}</dd>
                        </div>
                        <div>
                            <dt>Lieu</dt>
                            <dd>{preview.lieu}</dd>
                        </div>
                        <div>
                            <dt>Date / Heure</dt>
                            <dd>
                                {preview.date} - {preview.heure}
                            </dd>
                        </div>
                        <div>
                            <dt>Douleur</dt>
                            <dd>{preview.painLevel}/10</dd>
                        </div>
                        <div>
                            <dt>Duree</dt>
                            <dd>{preview.symptomDuration}</dd>
                        </div>
                        <div>
                            <dt>Objectif</dt>
                            <dd>{preview.objective}</dd>
                        </div>
                    </dl>

                    <div className="preview-note mt-2">
                        <strong>Description patient</strong>
                        <p>{preview.douleur}</p>
                    </div>
                </aside>
            </div>
        </div>
    );
}
