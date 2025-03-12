const API_BASE_URL = window.location.origin;

document.addEventListener("DOMContentLoaded", function () {
    checkAuth();
});

function checkAuth() {
    const token = localStorage.getItem("access_token");
    if (!token) {
        redirectToLogin();
        return;
    }

    try {
        const payload = JSON.parse(atob(token.split(".")[1])); // Decode JWT
        const currentTime = Math.floor(Date.now() / 1000);

        if (payload.exp < currentTime) {
            console.warn("Access token expired. Trying to refresh...");
            refreshToken().then(success => {
                if (!success) {
                    alert("Session expired. Please log in again.");
                    redirectToLogin();
                }
            });
        }
    } catch (error) {
        console.error("Invalid token:", error);
        redirectToLogin();
    }
}

function redirectToLogin() {
    alert("You need to log in first.");
    window.location.href = "/user/login-page/";
}

async function refreshToken() {
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) return false;

    try {
        const response = await fetch(`${API_BASE_URL}/api/token/refresh/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh: refreshToken })
        });

        if (!response.ok) return false;

        const data = await response.json();
        localStorage.setItem("access_token", data.access);
        return true;
    } catch (error) {
        console.error("Error refreshing token:", error);
        return false;
    }
}

async function fetchWithAuth(url, options = {}) {
    let token = localStorage.getItem("access_token");
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
            alert("Session expired. Please log in again.");
            redirectToLogin();
        }
    }

    return response;
}

function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    window.location.href = "/user/login-page/";
}
