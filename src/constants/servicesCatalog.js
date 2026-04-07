export const SERVICES_CATALOG = [
    {
        id: 'bilan',
        title: 'Bilan Initial & Diagnostic',
        duration: '45 min',
        price: 70,
        description: 'Evaluation clinique complete et plan de traitement personnalise.'
    },
    {
        id: 'standard',
        title: 'Seance de Reeducation standard',
        duration: '30 min',
        price: 40,
        description: 'Seance ciblee pour mobilite, douleur et reprise progressive.'
    },
    {
        id: 'complexe',
        title: 'Reeducation Neurologique ou Complexe',
        duration: '45 min',
        price: 55,
        description: 'Prise en charge avancee des cas complexes et neurologiques.'
    },
    {
        id: 'massage',
        title: 'Massage Therapeutique / Sportif',
        duration: '40 min',
        price: 50,
        description: 'Relachement musculaire et recuperation fonctionnelle.'
    }
];

export const DOMICILE_FEE = 20;

export const getServiceById = (serviceId) => SERVICES_CATALOG.find((service) => service.id === serviceId);

export const formatTnd = (value) =>
    new Intl.NumberFormat('fr-TN', { style: 'currency', currency: 'TND' }).format(value);
