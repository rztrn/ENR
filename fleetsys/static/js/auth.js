// static/js/auth.js
function checkAuth() {
    const token = localStorage.getItem("access_token");
    if (!token) {
        redirectToLogin();
        return;
    }
    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
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
    if (!refreshToken) {
        console.warn("No refresh token available.");
        return false;
    }
    try {
        const response = await fetch(`${window.location.origin}/api/token/refresh/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh: refreshToken })
        });
        if (!response.ok) {
            console.warn("Refresh token is invalid or expired.");
            return false;
        }
        const data = await response.json();
        if (data.access) {
            localStorage.setItem("access_token", data.access);
            return true;
        }
        return false;
    } catch (error) {
        console.error("Error refreshing token:", error);
        return false;
    }
}

function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    window.location.href = "/user/login-page/";
}

// Expose functions to the global scope
window.checkAuth = checkAuth;
window.redirectToLogin = redirectToLogin;
window.refreshToken = refreshToken;
window.logout = logout;
