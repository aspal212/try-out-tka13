// Admin Session Management
class AdminSession {
    constructor() {
        this.sessionKey = 'adminSession';
        this.checkSession();
    }

    // Check if user is logged in
    isLoggedIn() {
        const session = this.getSession();
        if (!session) return false;

        const now = new Date();
        const expiresAt = new Date(session.expiresAt);
        return now < expiresAt;
    }

    // Get current session data
    getSession() {
        try {
            const sessionData = sessionStorage.getItem(this.sessionKey);
            return sessionData ? JSON.parse(sessionData) : null;
        } catch (e) {
            return null;
        }
    }

    // Check session and redirect if needed
    checkSession() {
        if (!this.isLoggedIn()) {
            this.redirectToLogin();
        }
    }

    // Redirect to login page
    redirectToLogin() {
        window.location.href = 'login.html';
    }

    // Logout
    logout() {
        sessionStorage.removeItem(this.sessionKey);
        localStorage.removeItem('adminCredentials');
        localStorage.removeItem('adminRemember');
        
        // Show logout confirmation
        const alertHTML = `
            <div class="alert alert-success alert-dismissible fade show" role="alert">
                <i class="bi bi-check-circle-fill me-2"></i>
                Anda telah berhasil keluar dari sistem.
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        document.body.insertAdjacentHTML('afterbegin', alertHTML);
        
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
    }

    // Get user info
    getUserInfo() {
        const session = this.getSession();
        return session ? {
            username: session.username,
            name: session.name,
            email: session.email,
            role: session.role,
            loginTime: new Date(session.loginTime)
        } : null;
    }

    // Update session
    updateSession(newData) {
        const session = this.getSession();
        if (session) {
            const updatedSession = { ...session, ...newData };
            sessionStorage.setItem(this.sessionKey, JSON.stringify(updatedSession));
        }
    }

    // Auto logout on inactivity
    startAutoLogout(minutes = 30) {
        let inactivityTimer;
        const resetTimer = () => {
            clearTimeout(inactivityTimer);
            inactivityTimer = setTimeout(() => {
                this.logout();
                alert('Sesi Anda telah berakhir karena tidak aktif.');
            }, minutes * 60 * 1000);
        };

        // Reset timer on user activity
        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
            document.addEventListener(event, resetTimer, true);
        });

        resetTimer(); // Start initial timer
    }
}

// Global functions for use in HTML
function logout() {
    if (confirm('Apakah Anda yakin ingin keluar dari sistem?')) {
        window.adminSession.logout();
    }
}

function checkPermission(requiredRole) {
    const userInfo = window.adminSession.getUserInfo();
    if (!userInfo) return false;

    const roleHierarchy = {
        'Super Admin': 3,
        'Manager': 2,
        'Operator': 1
    };

    const userLevel = roleHierarchy[userInfo.role] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;

    return userLevel >= requiredLevel;
}

// Initialize session management on all admin pages
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on an admin page (not login page)
    if (!window.location.pathname.includes('login.html')) {
        window.adminSession = new AdminSession();
        
        // Add user info to page
        const userInfo = window.adminSession.getUserInfo();
        if (userInfo) {
            // Update user info in navbar
            const userElements = document.querySelectorAll('.admin-user-name');
            userElements.forEach(el => el.textContent = userInfo.name);
            
            const roleElements = document.querySelectorAll('.admin-user-role');
            roleElements.forEach(el => el.textContent = userInfo.role);
        }

        // Start auto logout
        window.adminSession.startAutoLogout(30); // 30 minutes
    }
});