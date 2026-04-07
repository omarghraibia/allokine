import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

const ORIENTATION = {
    sportif: {
        standard:
            'Orientation recommandee: bilan fonctionnel + programme de recuperation progressive sur 4 a 6 semaines.',
        prioritaire:
            'Orientation recommandee: prise en charge prioritaire sous 24h pour limiter la perte de performance.'
    },
    postOp: {
        standard:
            'Orientation recommandee: protocole post-operatoire personnalise avec suivi hebdomadaire.',
        prioritaire:
            'Orientation recommandee: coordination rapide avec le chirurgien et suivi rapproche des amplitudes.'
    },
    chronique: {
        standard:
            'Orientation recommandee: seances ciblees douleur/mobilite avec education therapeutique.',
        prioritaire:
            'Orientation recommandee: evaluation complete rapide et adaptation du plan anti-douleur.'
    }
};

export default function Home() {
    const [profil, setProfil] = useState('sportif');
    const [niveau, setNiveau] = useState('standard');

    const recommandation = useMemo(() => ORIENTATION[profil][niveau], [profil, niveau]);

    return (
        <div className="home-page pt-top">
            <section className="home-hero">
                <div className="container hero-grid">
                    <div>
                        <p className="hero-kicker">Cabinet de kinesitherapie conventionne</p>
                        <h1 className="title-premium">
                            Une prise en charge
                            <span className="text-blue"> professionnelle, claire et humaine.</span>
                        </h1>
                        <p className="subtitle">
                            AlloKine structure votre parcours de soin: evaluation, plan therapeutique, suivi et
                            coordination administrative.
                        </p>
                        <div className="hero-actions">
                            <Link to="/rdv" className="btn btn-primary">
                                Prendre un rendez-vous
                            </Link>
                            <Link to="/services" className="btn btn-outline">
                                Voir nos prestations
                            </Link>
                        </div>
                        <div className="hero-trust">
                            <span className="trust-chip">Suivi personnalise</span>
                            <span className="trust-chip">Protocoles traces</span>
                            <span className="trust-chip">Parcours organise</span>
                        </div>
                    </div>

                    <div className="hero-panel card">
                        <h2>Apercu rapide</h2>
                        <div className="stats-grid">
                            <div>
                                <strong>25+</strong>
                                <p>ans d'experience</p>
                            </div>
                            <div>
                                <strong>24h</strong>
                                <p>reponse moyenne</p>
                            </div>
                            <div>
                                <strong>100%</strong>
                                <p>parcours structure</p>
                            </div>
                            <div>
                                <strong>Cabinet + Domicile</strong>
                                <p>formats de consultation</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="container section-block">
                <div className="section-header">
                    <h2>Fonctionnalites et services</h2>
                    <p className="subtitle">Une organisation lisible pour les patients et leurs proches.</p>
                </div>
                <div className="grid feature-grid">
                    <article className="card feature-card">
                        <h3>Rendez-vous digitalise</h3>
                        <p>Demande de RDV guidee avec collecte des informations cliniques essentielles.</p>
                    </article>
                    <article className="card feature-card">
                        <h3>Suivi de dossier</h3>
                        <p>Espace patient pour suivre les demandes, statuts et prochaines etapes.</p>
                    </article>
                    <article className="card feature-card">
                        <h3>Contact multi-canal</h3>
                        <p>Telephone, WhatsApp, email et formulaire pour un acces fluide au cabinet.</p>
                    </article>
                </div>
            </section>

            <section className="container section-block">
                <div className="card orientation-card">
                    <div className="section-header">
                        <h2>Orientation rapide</h2>
                        <p className="subtitle">
                            Selectionnez votre profil pour obtenir une recommandation de prise en charge.
                        </p>
                    </div>
                    <div className="orientation-controls">
                        <label className="form-group">
                            <span>Votre profil</span>
                            <select value={profil} onChange={(e) => setProfil(e.target.value)}>
                                <option value="sportif">Sportif</option>
                                <option value="postOp">Post-operatoire</option>
                                <option value="chronique">Douleur chronique</option>
                            </select>
                        </label>
                        <label className="form-group">
                            <span>Niveau de prise en charge</span>
                            <select value={niveau} onChange={(e) => setNiveau(e.target.value)}>
                                <option value="standard">Standard</option>
                                <option value="prioritaire">Prioritaire</option>
                            </select>
                        </label>
                    </div>
                    <p className="orientation-result">{recommandation}</p>
                    <Link to="/rdv" className="btn btn-primary">
                        Lancer ma demande de RDV
                    </Link>
                </div>
            </section>

            <section className="container section-block">
                <div className="section-header">
                    <h2>Cadre legal et transparence</h2>
                    <p className="subtitle">Un fonctionnement conforme et rassurant.</p>
                </div>
                <div className="grid legal-grid">
                    <article className="card legal-item">
                        <h3>Mentions legales</h3>
                        <p>Identification du cabinet, responsabilites et informations editeur.</p>
                        <Link to="/mentions-legales" className="text-blue">
                            Consulter
                        </Link>
                    </article>
                    <article className="card legal-item">
                        <h3>Confidentialite</h3>
                        <p>Protection des donnees patient et regles de conservation des informations.</p>
                        <Link to="/confidentialite" className="text-blue">
                            Consulter
                        </Link>
                    </article>
                    <article className="card legal-item">
                        <h3>Conditions d'utilisation</h3>
                        <p>Regles d'usage des services numeriques et obligations mutuelles.</p>
                        <Link to="/conditions-utilisation" className="text-blue">
                            Consulter
                        </Link>
                    </article>
                </div>
            </section>
        </div>
    );
}
