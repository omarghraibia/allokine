export const getRoleHomePath = (role) => {
    if (role === 'docteur') {
        return '/espace-docteur';
    }

    return '/espace-client';
};
