export default function Gallery() {
    return (
        <div className="container pt-top min-h-screen">
            <h1 className="text-center title-premium">Notre <span className="text-blue">Cabinet</span></h1>
            <p className="subtitle text-center mb-4">Un plateau technique moderne équipé pour votre rééducation.</p>

            <div className="gallery-grid mt-4">
                {/* Utilisation d'images haute qualité Unsplash pour la démo commerciale */}
                <div className="gallery-item">
                    <img src="https://images.unsplash.com/photo-1581595220892-b0739db3ba8c?auto=format&fit=crop&w=800" className="gallery-img" alt="Salle de soin" />
                </div>
                <div className="gallery-item">
                    <img src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=800" className="gallery-img" alt="Matériel de rééducation" />
                </div>
                <div className="gallery-item">
                    <img src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=800" className="gallery-img" alt="Espace sport" />
                </div>
                <div className="gallery-item">
                    <img src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800" className="gallery-img" alt="Accueil" />
                </div>
            </div>
        </div>
    );
}