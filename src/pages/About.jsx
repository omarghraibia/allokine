export default function About() {
    return (
        <div className="container pt-top min-h-screen">
            <h1 className="text-center title-premium">
                A propos du <span className="text-blue">Cabinet</span>
            </h1>

            <section className="card mt-4 about-layout">
                <div className="about-photo-wrap">
                    <img src="src/assets/kine.png" alt="Dr. Fethi Ghraibia" className="kine-photo" loading="lazy" />
                </div>

                <div className="about-content">
                    <h2 className="text-blue">Fethi Ghraibia</h2>
                    <h3 className="subtitle">Kinesitherapeute - Specialiste en reeducation et medecine du sport</h3>

                    <p className="mt-2">
                        Diplome d'un Master en Kinesitherapie (ESSTST, Tunis), je mets a votre disposition plus de
                        25 ans d'experience dans la reeducation fonctionnelle et la prise en charge experte des
                        blessures sportives.
                    </p>

                    <p className="mt-2">
                        Mon parcours m'a amene a accompagner des athletes de tres haut niveau au sein de l'equipe
                        nationale tunisienne et de clubs professionnels. J'applique la meme exigence de soins a
                        tous les patients pour une rehabilitation rapide et durable.
                    </p>

                    <h4 className="mt-4 text-blue">Domaines d'expertise</h4>
                    <ul className="mt-2 about-list">
                        <li>Traumatologie et rhumatologie</li>
                        <li>Reeducation respiratoire et neurologique</li>
                        <li>Rehabilitation post-operatoire</li>
                        <li>Prevention et traitement des sportifs de haut niveau</li>
                    </ul>
                </div>
            </section>

            <h2 className="text-center mt-4">Avis de nos patients</h2>
            <div className="grid mt-2">
                <article className="card">
                    <p>
                        "Tres professionnel et a l'ecoute. La reeducation de mon genou apres operation s'est
                        parfaitement deroulee."
                    </p>
                    <h4 className="mt-2 text-blue">- Thomas L.</h4>
                </article>
                <article className="card">
                    <p>
                        "Diagnostic precis et soins de qualite. On sent l'experience et la rigueur du cabinet."
                    </p>
                    <h4 className="mt-2 text-blue">- Sophie M.</h4>
                </article>
            </div>
        </div>
    );
}
