// static/js/fetchWithAuth.js
async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem("access_token");
    if (!token) {
        redirectToLogin();
        return;
    }
    options.headers = {
        ...options.headers,
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
    };
    let response = await fetch(url, options);
    if (response.status === 401) {
        console.warn("Access token expired. Attempting to refresh...");
        const refreshed = await refreshToken();
        if (refreshed) {
            options.headers["Authorization"] = `Bearer ${localStorage.getItem("access_token")}`;
            response = await fetch(url, options);
        } else {
            console.error("Token refresh failed. Logging out.");
            logout();
            return;
        }
    }
    return response;
}

window.fetchWithAuth = fetchWithAuth;
