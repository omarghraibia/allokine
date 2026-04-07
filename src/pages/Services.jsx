import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock3, Home, Stethoscope } from 'lucide-react';
import { DOMICILE_FEE, formatTnd, SERVICES_CATALOG } from '../constants/servicesCatalog';

export default function Services() {
    const navigate = useNavigate();

    const formatter = useMemo(
        () => new Intl.NumberFormat('fr-TN', { style: 'currency', currency: 'TND' }),
        []
    );

    const handleServiceSelect = (serviceId) => {
        navigate('/rdv', { state: { serviceId } });
    };

    return (
        <div className="container pt-top min-h-screen">
            <h1 className="text-center title-premium">Tarifs & Prestations</h1>
            <p className="subtitle text-center">Grille tarifaire cabinet AlloKine - reference 2026</p>

            <div className="grid mt-4 pricing-grid">
                {SERVICES_CATALOG.map((service) => (
                    <article key={service.id} className="card pricing-card">
                        <div className="pricing-top">
                            <Stethoscope size={18} />
                            <span>{service.duration}</span>
                        </div>
                        <h2>{service.title}</h2>
                        <p className="pricing-value">{formatter.format(service.price)}</p>
                        <p className="subtitle">{service.description}</p>

                        <div className="pricing-meta mt-2">
                            <span><Clock3 size={15} /> Duree: {service.duration}</span>
                            <span><Home size={15} /> Domicile: +{formatter.format(DOMICILE_FEE)}</span>
                        </div>

                        <button className="btn btn-primary mt-2" onClick={() => handleServiceSelect(service.id)}>
                            Choisir cette prestation
                        </button>
                    </article>
                ))}
            </div>

            <div className="card mt-4">
                <h3>Information de deplacement</h3>
                <p className="subtitle">
                    Seance a domicile: +{formatTnd(DOMICILE_FEE)} (frais de deplacement), selon disponibilite et zone.
                </p>
            </div>
        </div>
    );
}
