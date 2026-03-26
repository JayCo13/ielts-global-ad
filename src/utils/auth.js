export const checkTokenExpiration = () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.href = '/login';
        return;
    }

    // Decode token to check expiration
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp * 1000 < Date.now()) {
            localStorage.clear();
            window.location.href = '/login';
        }
    } catch (error) {
        localStorage.clear();
        window.location.href = '/login';
    }
};
