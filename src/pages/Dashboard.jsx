import { useContext, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Download, Eye, FileText, Phone, Trash2 } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { DataService } from '../DataService';
import { NotificationService } from '../NotificationService';
import { useToast } from '../context/ToastContext';

const STATUS_LABELS = {
    en_attente: 'En attente',
    confirme: 'Confirme',
    effectue: 'Effectue',
    annule: 'Annule'
};

const STATUS_BADGE_CLASS = {
    en_attente: 'badge-warn',
    confirme: 'badge-info',
    effectue: 'badge-success',
    annule: 'badge-danger'
};

const formatTnd = (value) => (typeof value === 'number' ? `${value.toFixed(3)} TND` : '-');

export default function Dashboard() {
    const { user } = useContext(AuthContext);
    const { notify } = useToast();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
    const [selectedPatientId, setSelectedPatientId] = useState(null);
    const [clinicalNote, setClinicalNote] = useState('');
    const [refreshKey, setRefreshKey] = useState(0);

    const triggerRefresh = () => setRefreshKey((v) => v + 1);
    void refreshKey;

    const userId = user?.id ?? null;
    const doctorData = DataService.getDoctorDashboardData();
    const patientAppointments = userId ? DataService.getPatientAppointments(userId) : [];
    const patientFiles = userId ? DataService.getPatientFiles(userId) : [];
    const query = searchQuery.trim().toLowerCase();

    const filteredAppointments = doctorData.appointments.filter((appt) => {
        const patient = DataService.getUserById(appt.patientId);
        const byStatus = statusFilter === 'all' ? true : appt.status === statusFilter;
        const byQuery = query
            ? `${patient?.name || ''} ${patient?.email || ''} ${appt.reason || ''}`
                  .toLowerCase()
                  .includes(query)
            : true;
        return byStatus && byQuery;
    });

    const selectedAppointment =
        doctorData.appointments.find((a) => a.id === selectedAppointmentId) || null;
    const selectedPatientRecord = selectedPatientId
        ? DataService.getPatientFullRecord(selectedPatientId)
        : null;
    const doctorSelectedPatientFiles = selectedPatientId
        ? DataService.getFilesByPatientId(selectedPatientId)
        : [];

    if (!user) return <Navigate to="/login" />;

    const handleStatusChange = (appointmentId, status) => {
        DataService.updateAppointmentStatus(appointmentId, status);
        notify.success(`✓ Statut: ${STATUS_LABELS[status]}`);
        triggerRefresh();
    };

    const handleDeleteAppointment = (appointmentId) => {
        const confirmed = window.confirm('Supprimer cette demande de rendez-vous ? Cette action est définitive.');
        if (!confirmed) return;

        const deleted = DataService.deleteAppointment(appointmentId);
        if (deleted) {
            if (selectedAppointmentId === appointmentId) setSelectedAppointmentId(null);
            if (selectedPatientRecord?.history?.appointments?.some((apt) => apt.id === appointmentId)) {
                setSelectedPatientId(null);
            }
            notify.success('✓ Demande supprimée');
            triggerRefresh();
            return;
        }
        notify.error('❌ Demande non trouvée');
    };

    const handleOpenRecord = (appointment) => {
        setSelectedAppointmentId(appointment.id);
        setSelectedPatientId(appointment.patientId);
    };

    const handleAddClinicalNote = () => {
        if (!selectedAppointment || !clinicalNote.trim()) {
            notify.error('Veuillez sélectionner un dossier et saisir une note');
            return;
        }

        DataService.addClinicalNote(selectedAppointment.id, clinicalNote.trim());
        notify.success('✓ Note enregistrée au dossier patient');
        setClinicalNote('');
        triggerRefresh();
    };

    const handleReminderEmail = async (appointment) => {
        const patient = DataService.getUserById(appointment.patientId);
        if (!patient) return;

        await NotificationService.sendAppointmentReminder(appointment, patient.email);
        NotificationService.notify('success', 'Rappel envoye', 'Un rappel patient a ete simule avec succes.');
    };

    const handlePatientReminder = async () => {
        const upcoming = patientAppointments.find((apt) => apt.status !== 'annule');
        if (!upcoming) {
            NotificationService.notify('warning', 'Aucun rendez-vous', 'Aucun rendez-vous actif pour rappel.');
            return;
        }
        await NotificationService.sendAppointmentReminder(upcoming, user.email);
        NotificationService.notify('success', 'Rappel envoye', 'Le rappel a ete envoye sur votre email.');
    };

    const handleDownload = (fileItem) => {
        const payload = DataService.createDownloadPayload(fileItem);
        const anchor = document.createElement('a');

        if (payload.downloadUrl) {
            anchor.href = payload.downloadUrl;
            anchor.download = payload.fileName;
            anchor.click();
            return;
        }

        const blob = new Blob([payload.content], { type: payload.mimeType || 'text/plain' });
        const url = URL.createObjectURL(blob);
        anchor.href = url;
        anchor.download = payload.fileName;
        anchor.click();
        URL.revokeObjectURL(url);
    };

    const handlePreview = (fileItem) => {
        const payload = DataService.createDownloadPayload(fileItem);
        if (payload.downloadUrl) {
            window.open(payload.downloadUrl, '_blank', 'noopener,noreferrer');
            return;
        }
        NotificationService.notify('warning', 'Apercu indisponible', 'Ce fichier ancien ne peut pas etre previsualise.');
    };

    if (user.role === 'client') {
        return (
            <div className="container pt-top min-h-screen">
                <div className="dashboard-head">
                    <h2>Espace Patient</h2>
                    <p className="subtitle">Suivi de vos demandes, etat des rendez-vous et documents partages.</p>
                </div>

                <div className="grid stats-cards mt-2">
                    <div className="card stat-card"><p>Total demandes</p><strong>{patientAppointments.length}</strong></div>
                    <div className="card stat-card"><p>En attente</p><strong>{patientAppointments.filter((a) => a.status === 'en_attente').length}</strong></div>
                    <div className="card stat-card"><p>Confirmees</p><strong>{patientAppointments.filter((a) => a.status === 'confirme').length}</strong></div>
                    <div className="card stat-card"><p>Effectuees</p><strong>{patientAppointments.filter((a) => a.status === 'effectue').length}</strong></div>
                </div>

                <div className="grid patient-space mt-2">
                    <section className="card">
                        <div className="section-row">
                            <h3>Mes demandes envoyees</h3>
                            <button className="btn btn-outline" onClick={handlePatientReminder}>Envoyer un rappel Gmail</button>
                        </div>

                        {patientAppointments.length === 0 ? (
                            <p className="subtitle">Aucune demande. Commencez par une nouvelle demande de rendez-vous.</p>
                        ) : (
                            <div className="table-wrap">
                                <table className="dashboard-table">
                                    <thead><tr><th>Date</th><th>Heure</th><th>Prestation</th><th>Tarif</th><th>Statut</th><th>Apercu</th></tr></thead>
                                    <tbody>
                                        {patientAppointments.map((apt) => (
                                            <tr key={apt.id}>
                                                <td>{apt.date}</td><td>{apt.time}</td><td>{apt.reason}</td><td>{formatTnd(apt.totalPrice)}</td>
                                                <td><span className={`status-badge ${STATUS_BADGE_CLASS[apt.status] || ''}`}>{STATUS_LABELS[apt.status] || apt.status}</span></td>
                                                <td><button className="btn btn-outline" onClick={() => setSelectedAppointmentId(apt.id)}>Voir</button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <Link to="/rdv" className="btn btn-primary mt-2">Nouvelle demande</Link>
                    </section>

                    <aside className="card">
                        <h3>Apercu de dossier</h3>
                        {!selectedAppointment ? (
                            <p className="subtitle">Selectionnez une demande pour afficher les details.</p>
                        ) : (
                            <div className="record-panel">
                                <p><strong>Ref:</strong> #{selectedAppointment.id}</p>
                                <p><strong>Date:</strong> {selectedAppointment.date} {selectedAppointment.time}</p>
                                <p><strong>Lieu:</strong> {selectedAppointment.location}</p>
                                <p><strong>Prestation:</strong> {selectedAppointment.reason}</p>
                                <p><strong>Tarif:</strong> {formatTnd(selectedAppointment.totalPrice)}</p>
                                <p><strong>Douleur:</strong> {selectedAppointment.requestDetails?.painLevel || '-'} / 10</p>
                                <p><strong>Duree symptomes:</strong> {selectedAppointment.requestDetails?.symptomDuration || '-'}</p>
                                <p><strong>Objectif:</strong> {selectedAppointment.requestDetails?.objective || '-'}</p>
                                <p><strong>Description:</strong> {selectedAppointment.painDescription}</p>
                                {selectedAppointment.notes?.length > 0 && <div className="notes-block mt-2"><h4>Derniere note clinique</h4><p>{selectedAppointment.notes[selectedAppointment.notes.length - 1].content}</p></div>}
                            </div>
                        )}
                    </aside>
                </div>

                <section className="card mt-2">
                    <div className="section-row"><h3>Fichiers recus</h3><span className="subtitle">Comptes-rendus et imagerie disponibles</span></div>
                    {patientFiles.length === 0 ? <p className="subtitle">Aucun fichier disponible pour le moment.</p> : (
                        <div className="table-wrap">
                            <table className="dashboard-table file-table">
                                <thead><tr><th>Type</th><th>Nom du fichier</th><th>Date</th><th>Actions</th></tr></thead>
                                <tbody>
                                    {patientFiles.map((fileItem) => (
                                        <tr key={fileItem.id}>
                                            <td><span className="file-tag"><FileText size={14} /> {fileItem.type}</span></td>
                                            <td>{fileItem.fileName}</td><td>{fileItem.date}</td>
                                            <td><div className="table-actions"><button className="btn btn-outline" onClick={() => handlePreview(fileItem)}><Eye size={14} /> Voir</button><button className="btn btn-outline" onClick={() => handleDownload(fileItem)}><Download size={14} /> Telecharger</button></div></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>
        );
    }

    return (
        <div className="container pt-top min-h-screen">
            <div className="dashboard-head">
                <h2>Espace Medecin</h2>
                <p className="subtitle">Vue centralisee: agenda, dossiers patients, notes cliniques et suivi des statuts.</p>
            </div>

            <div className="grid stats-cards mt-2">
                <div className="card stat-card"><p>Patients actifs</p><strong>{doctorData.metrics.activePatients}</strong></div>
                <div className="card stat-card"><p>Rendez-vous total</p><strong>{doctorData.metrics.totalAppointments}</strong></div>
                <div className="card stat-card"><p>En attente</p><strong>{doctorData.metrics.pendingAppointments}</strong></div>
                <div className="card stat-card"><p>Confirmes</p><strong>{doctorData.metrics.confirmedAppointments}</strong></div>
            </div>

            <section className="card mt-2">
                <div className="filters-row">
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Rechercher patient, email, motif" />
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="all">Tous les statuts</option>
                        <option value="en_attente">En attente</option>
                        <option value="confirme">Confirme</option>
                        <option value="effectue">Effectue</option>
                        <option value="annule">Annule</option>
                    </select>
                </div>

                <div className="table-wrap mt-2">
                    <table className="dashboard-table">
                        <thead><tr><th>Date</th><th>Heure</th><th>Patient</th><th>Prestation</th><th>Tarif</th><th>Statut</th><th>Actions</th></tr></thead>
                        <tbody>
                            {filteredAppointments.map((apt) => {
                                const patient = DataService.getUserById(apt.patientId);
                                return (
                                    <tr key={apt.id}>
                                        <td>{apt.date}</td><td>{apt.time}</td>
                                        <td><div>{patient?.name || apt.patientName}</div><small className="subtitle">{patient?.phone || '+216 98 561 586'}</small></td>
                                        <td>{apt.reason}</td><td>{formatTnd(apt.totalPrice)}</td>
                                        <td><span className={`status-badge ${STATUS_BADGE_CLASS[apt.status] || ''}`}>{STATUS_LABELS[apt.status] || apt.status}</span></td>
                                        <td>
                                            <div className="table-actions">
                                                <button className="btn btn-outline" onClick={() => handleOpenRecord(apt)}>Dossier</button>
                                                <select value={apt.status} onChange={(e) => handleStatusChange(apt.id, e.target.value)}>
                                                    <option value="en_attente">En attente</option><option value="confirme">Confirme</option><option value="effectue">Effectue</option><option value="annule">Annule</option>
                                                </select>
                                                <button className="btn btn-outline" onClick={() => handleReminderEmail(apt)}>Rappel Gmail</button>
                                                <button className="btn btn-outline btn-danger-action" onClick={() => handleDeleteAppointment(apt.id)}><Trash2 size={14} /> Supprimer</button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </section>

            {selectedPatientRecord && (
                <section className="card mt-2">
                    <div className="section-row"><h3>Dossier patient: {selectedPatientRecord.patient?.name}</h3><div className="patient-inline-contact"><Phone size={14} /> {selectedPatientRecord.patient?.phone || '+216 98 561 586'}</div></div>

                    <div className="grid dossier-grid mt-2">
                        <article className="record-panel">
                            <h4>Profil patient</h4>
                            <p><strong>Email:</strong> {selectedPatientRecord.patient?.email}</p>
                            <p><strong>Telephone:</strong> {selectedPatientRecord.patient?.phone || 'Non renseigne'}</p>
                            <p><strong>Date de naissance:</strong> {selectedPatientRecord.patient?.birthDate || 'Non renseignee'}</p>
                            <p><strong>Contact urgence:</strong> {selectedPatientRecord.patient?.emergencyContact || 'Non renseigne'}</p>
                            <p><strong>Total rendez-vous:</strong> {selectedPatientRecord.history.totalAppointments}</p>
                            <p><strong>Rendez-vous effectues:</strong> {selectedPatientRecord.history.completedAppointments}</p>
                            <p><strong>Total notes cliniques:</strong> {selectedPatientRecord.summary.totalNotes}</p>
                        </article>

                        <article className="record-panel">
                            <h4>Demande selectionnee</h4>
                            {selectedAppointment ? (
                                <>
                                    <p><strong>Reference:</strong> #{selectedAppointment.id}</p>
                                    <p><strong>Date:</strong> {selectedAppointment.date} {selectedAppointment.time}</p>
                                    <p><strong>Prestation:</strong> {selectedAppointment.reason}</p>
                                    <p><strong>Tarif:</strong> {formatTnd(selectedAppointment.totalPrice)}</p>
                                    <p><strong>Niveau douleur:</strong> {selectedAppointment.requestDetails?.painLevel || '-'} / 10</p>
                                    <p><strong>Duree:</strong> {selectedAppointment.requestDetails?.symptomDuration || '-'}</p>
                                    <p><strong>Antecedents:</strong> {selectedAppointment.requestDetails?.medicalBackground || '-'}</p>
                                    <p><strong>Objectif:</strong> {selectedAppointment.requestDetails?.objective || '-'}</p>
                                    <p><strong>Description:</strong> {selectedAppointment.painDescription}</p>
                                </>
                            ) : <p className="subtitle">Aucun rendez-vous selectionne.</p>}
                        </article>
                    </div>

                    <div className="notes-editor mt-2">
                        <h4>Ajouter une note clinique</h4>
                        <textarea rows="4" value={clinicalNote} onChange={(e) => setClinicalNote(e.target.value)} placeholder="Bilan, protocole, exercices et recommandations" />
                        <button className="btn btn-primary mt-2" onClick={handleAddClinicalNote}>Sauvegarder la note</button>
                    </div>

                    <div className="mt-2">
                        <h4>Fichiers recus du patient</h4>
                        {doctorSelectedPatientFiles.length === 0 ? (
                            <p className="subtitle">Aucun fichier fourni pour ce patient.</p>
                        ) : (
                            <div className="table-wrap">
                                <table className="dashboard-table file-table">
                                    <thead><tr><th>Type</th><th>Nom</th><th>Date</th><th>Actions</th></tr></thead>
                                    <tbody>
                                        {doctorSelectedPatientFiles.map((fileItem) => (
                                            <tr key={fileItem.id}>
                                                <td><span className="file-tag"><FileText size={14} /> {fileItem.type}</span></td>
                                                <td>{fileItem.fileName}</td><td>{fileItem.date}</td>
                                                <td><div className="table-actions"><button className="btn btn-outline" onClick={() => handlePreview(fileItem)}><Eye size={14} /> Voir</button><button className="btn btn-outline" onClick={() => handleDownload(fileItem)}><Download size={14} /> Telecharger</button></div></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    <div className="mt-2">
                        <h4>Historique des consultations</h4>
                        <div className="timeline-list mt-2">
                            {selectedPatientRecord.history.appointments.map((apt) => (
                                <div key={apt.id} className="timeline-item">
                                    <div>
                                        <strong>{apt.date} - {apt.time}</strong>
                                        <p>{apt.reason} ({formatTnd(apt.totalPrice)})</p>
                                        <span className={`status-badge ${STATUS_BADGE_CLASS[apt.status] || ''}`}>{STATUS_LABELS[apt.status] || apt.status}</span>
                                    </div>
                                    <button className="btn btn-outline" onClick={() => setSelectedAppointmentId(apt.id)}>Ouvrir</button>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}
