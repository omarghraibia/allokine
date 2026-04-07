import { useMemo, useState } from 'react';
import { MessageSquarePlus, Star } from 'lucide-react';
import { DataService } from '../DataService';
import { useToast } from '../context/ToastContext';

const formatDate = (date) => new Date(date).toLocaleDateString('fr-FR');

export default function AvisEnLigne() {
    const { notify } = useToast();
    const [reviews, setReviews] = useState(() => DataService.getReviews());
    const [isOpen, setIsOpen] = useState(false);
    const [filterType, setFilterType] = useState('all');
    const [form, setForm] = useState({
        patientName: '',
        rating: 5,
        consultationType: 'reeducation',
        comment: ''
    });

    const typeLabels = {
        all: 'Tous',
        sport: 'Sport',
        senior: 'Senior',
        reeducation: 'Reeducation'
    };

    const averageRating = useMemo(() => {
        if (reviews.length === 0) return 0;
        const total = reviews.reduce((sum, review) => sum + Number(review.rating), 0);
        return (total / reviews.length).toFixed(1);
    }, [reviews]);

    const visibleReviews = useMemo(() => {
        if (filterType === 'all') return reviews;
        return reviews.filter((review) => (review.consultationType || 'reeducation') === filterType);
    }, [reviews, filterType]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.patientName.trim() || !form.comment.trim()) {
            notify.error('Veuillez remplir tous les champs');
            return;
        }

        DataService.addReview(form);
        setReviews(DataService.getReviews());
        notify.success(`✓ Avis de ${form.patientName} enregistré! Merci 🙏`);
        setForm({ patientName: '', rating: 5, consultationType: 'reeducation', comment: '' });
        setIsOpen(false);
    };

    return (
        <div className="container pt-top min-h-screen">
            <div className="section-row">
                <div>
                    <h1 className="title-premium">Avis Clients</h1>
                    <p className="subtitle">Note moyenne: {averageRating}/5 sur {reviews.length} avis verifies.</p>
                </div>
                <button className="btn btn-primary" onClick={() => setIsOpen(true)}>
                    <MessageSquarePlus size={18} /> Laisser un avis
                </button>
            </div>

            <div className="section-row mt-2">
                <div className="toggle-row">
                    {Object.entries(typeLabels).map(([value, label]) => (
                        <button
                            key={value}
                            type="button"
                            className={`btn ${filterType === value ? 'btn-primary' : 'btn-outline'}`}
                            onClick={() => setFilterType(value)}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid mt-4 reviews-grid">
                {visibleReviews.map((review) => (
                    <article className="card review-card" key={review.id}>
                        <div className="section-row">
                            <h3>{review.patientName}</h3>
                            <span className="subtitle">{formatDate(review.date)}</span>
                        </div>
                        <div className="stars-row">
                            {Array.from({ length: 5 }).map((_, index) => (
                                <Star
                                    key={`${review.id}-${index}`}
                                    size={17}
                                    className={index < review.rating ? 'star-filled' : 'star-empty'}
                                />
                            ))}
                        </div>
                        <span className="status-badge badge-info">{typeLabels[review.consultationType || 'reeducation']}</span>
                        <p className="subtitle mt-2">{review.comment}</p>
                    </article>
                ))}
            </div>

            {isOpen && (
                <div className="modal-overlay" onClick={() => setIsOpen(false)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <h3>Laisser un avis</h3>
                        <form className="mt-2" onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Nom du patient</label>
                                <input
                                    value={form.patientName}
                                    onChange={(e) => setForm((prev) => ({ ...prev, patientName: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Note</label>
                                <select
                                    value={form.rating}
                                    onChange={(e) => setForm((prev) => ({ ...prev, rating: Number(e.target.value) }))}
                                >
                                    <option value={5}>5 etoiles</option>
                                    <option value={4}>4 etoiles</option>
                                    <option value={3}>3 etoiles</option>
                                    <option value={2}>2 etoiles</option>
                                    <option value={1}>1 etoile</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Type de consultation</label>
                                <select
                                    value={form.consultationType}
                                    onChange={(e) => setForm((prev) => ({ ...prev, consultationType: e.target.value }))}
                                >
                                    <option value="sport">Sport</option>
                                    <option value="senior">Senior</option>
                                    <option value="reeducation">Reeducation</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Commentaire</label>
                                <textarea
                                    rows="4"
                                    value={form.comment}
                                    onChange={(e) => setForm((prev) => ({ ...prev, comment: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="section-row mt-2">
                                <button type="button" className="btn btn-outline" onClick={() => setIsOpen(false)}>
                                    Annuler
                                </button>
                                <button className="btn btn-primary" type="submit">
                                    Publier
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
