// Admin Login JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const loginForm = document.getElementById('adminLoginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.getElementById('loginBtn');
    const loginSpinner = document.getElementById('loginSpinner');
    const alertContainer = document.getElementById('alertContainer');
    const togglePasswordBtn = document.getElementById('togglePassword');
    const toggleIcon = document.getElementById('toggleIcon');

    // Demo Admin Credentials
    const DEMO_ADMIN = {
        username: 'admin',
        password: 'admin123',
        name: 'Administrator',
        email: 'admin@tka13.com'
    };

    // Enhanced Admin Credentials (additional demo accounts)
    const ADMIN_ACCOUNTS = [
        {
            username: 'admin',
            password: 'admin123',
            name: 'Administrator',
            email: 'admin@tka13.com',
            role: 'Super Admin'
        },
        {
            username: 'manager',
            password: 'manager123',
            name: 'Test Manager',
            email: 'manager@tka13.com',
            role: 'Manager'
        },
        {
            username: 'operator',
            password: 'operator123',
            name: 'Test Operator',
            email: 'operator@tka13.com',
            role: 'Operator'
        }
    ];

    // Load saved credentials if remember me was checked
    loadSavedCredentials();

    // Toggle password visibility
    togglePasswordBtn.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        
        if (type === 'text') {
            toggleIcon.classList.remove('bi-eye');
            toggleIcon.classList.add('bi-eye-slash');
        } else {
            toggleIcon.classList.remove('bi-eye-slash');
            toggleIcon.classList.add('bi-eye');
        }
    });

    // Login form submission
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        handleLogin();
    });

    // Handle login process
    function handleLogin() {
        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        const rememberMe = document.getElementById('rememberMe').checked;

        // Basic validation
        if (!username || !password) {
            showAlert('error', 'Harap masukkan username dan password!');
            return;
        }

        // Show loading state
        setLoadingState(true);

        // Simulate API call delay
        setTimeout(() => {
            authenticateUser(username, password, rememberMe);
        }, 1500);
    }

    // Authenticate user
    function authenticateUser(username, password, rememberMe) {
        const admin = ADMIN_ACCOUNTS.find(acc => 
            acc.username === username && acc.password === password
        );

        if (admin) {
            // Save session
            saveSession(admin, rememberMe);
            
            // Show success message
            showAlert('success', 'Login berhasil! Mengalihkan ke dashboard...');
            
            // Redirect after delay
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);
        } else {
            // Increment failed attempts
            incrementFailedAttempts();
            
            // Show error message
            const attempts = getFailedAttempts();
            if (attempts >= 3) {
                showAlert('error', 'Terlalu banyak percobaan login gagal. Silakan tunggu 5 menit.');
                disableLogin(300000); // Disable for 5 minutes
            } else {
                showAlert('error', `Username atau password salah! Percobaan ke-${attempts + 1}`);
            }
        }

        setLoadingState(false);
    }

    // Save session
    function saveSession(admin, rememberMe) {
        const sessionData = {
            username: admin.username,
            name: admin.name,
            email: admin.email,
            role: admin.role,
            loginTime: new Date().toISOString(),
            expiresAt: rememberMe ? 
                new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : // 30 days
                new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 1 day
        };

        sessionStorage.setItem('adminSession', JSON.stringify(sessionData));
        localStorage.setItem('adminRemember', rememberMe);
        localStorage.setItem('adminCredentials', rememberMe ? 
            JSON.stringify({username: admin.username, password: admin.password}) : '');
    }

    // Load saved credentials
    function loadSavedCredentials() {
        const rememberMe = localStorage.getItem('adminRemember') === 'true';
        const savedCredentials = localStorage.getItem('adminCredentials');

        if (rememberMe && savedCredentials) {
            try {
                const credentials = JSON.parse(savedCredentials);
                usernameInput.value = credentials.username || '';
                passwordInput.value = credentials.password || '';
                document.getElementById('rememberMe').checked = true;
            } catch (e) {
                console.error('Error loading saved credentials');
            }
        }
    }

    // Show alert message
    function showAlert(type, message) {
        const alertClass = type === 'error' ? 'danger' : type;
        const alertIcon = type === 'error' ? 'exclamation-triangle' : 'check-circle';
        
        const alertHTML = `
            <div class="alert alert-${alertClass} alert-dismissible fade show" role="alert">
                <i class="bi bi-${alertIcon}-fill me-2"></i>
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        alertContainer.innerHTML = alertHTML;
        
        // Auto-dismiss success alerts
        if (type === 'success') {
            setTimeout(() => {
                const alert = alertContainer.querySelector('.alert');
                if (alert) {
                    const bsAlert = new bootstrap.Alert(alert);
                    bsAlert.close();
                }
            }, 3000);
        }
    }

    // Set loading state
    function setLoadingState(loading) {
        if (loading) {
            loginBtn.disabled = true;
            loginSpinner.style.display = 'inline-block';
            loginBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span>Memverifikasi...';
        } else {
            loginBtn.disabled = false;
            loginSpinner.style.display = 'none';
            loginBtn.innerHTML = '<i class="bi bi-box-arrow-in-right"></i> Masuk ke Dashboard';
        }
    }

    // Failed attempts management
    function getFailedAttempts() {
        const attempts = sessionStorage.getItem('failedLoginAttempts');
        return attempts ? parseInt(attempts) : 0;
    }

    function incrementFailedAttempts() {
        const attempts = getFailedAttempts() + 1;
        sessionStorage.setItem('failedLoginAttempts', attempts.toString());
        
        // Reset after successful login
        setTimeout(() => {
            sessionStorage.removeItem('failedLoginAttempts');
        }, 3600000); // Reset after 1 hour
    }

    function disableLogin(duration) {
        loginBtn.disabled = true;
        setTimeout(() => {
            loginBtn.disabled = false;
            sessionStorage.removeItem('failedLoginAttempts');
            showAlert('info', 'Anda dapat mencoba login kembali.');
        }, duration);
    }

    // Check for existing session
    checkExistingSession();

    function checkExistingSession() {
        const session = sessionStorage.getItem('adminSession');
        if (session) {
            try {
                const sessionData = JSON.parse(session);
                const now = new Date();
                const expiresAt = new Date(sessionData.expiresAt);

                if (now < expiresAt) {
                    // Session still valid
                    window.location.href = 'dashboard.html';
                    return;
                } else {
                    // Session expired
                    sessionStorage.removeItem('adminSession');
                    localStorage.removeItem('adminCredentials');
                }
            } catch (e) {
                sessionStorage.removeItem('adminSession');
            }
        }
    }

    // Add demo credentials helper
    addDemoCredentialsHelper();
});

function addDemoCredentialsHelper() {
    const helperDiv = document.createElement('div');
    helperDiv.className = 'mt-3 p-3 bg-light rounded';
    helperDiv.innerHTML = `
        <h6><i class="bi bi-info-circle"></i> Demo Credentials</h6>
        <small class="text-muted">
            <strong>Username:</strong> admin | <strong>Password:</strong> admin123<br>
            <strong>Manager:</strong> manager | <strong>Password:</strong> manager123<br>
            <strong>Operator:</strong> operator | <strong>Password:</strong> operator123
        </small>
        <br>
        <button class="btn btn-sm btn-outline-primary mt-2" onclick="fillCredentials('admin', 'admin123')">
            Fill Admin Credentials
        </button>
    `;
    
    document.querySelector('.login-body').appendChild(helperDiv);
}

function fillCredentials(username, password) {
    document.getElementById('username').value = username;
    document.getElementById('password').value = password;
}