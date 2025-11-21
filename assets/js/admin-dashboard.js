// Admin Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize dashboard
    initializeDashboard();
    loadDashboardData();
    initCharts();
    loadRecentActivities();
});

function initializeDashboard() {
    // Set current date and time
    updateDateTime();
    setInterval(updateDateTime, 1000);
    
    // Auto refresh dashboard every 5 minutes
    setInterval(loadDashboardData, 300000);
    
    // Initialize tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

function updateDateTime() {
    const now = new Date();
    const dateTimeString = now.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    
    const dateTimeElements = document.querySelectorAll('#currentDateTime');
    dateTimeElements.forEach(el => el.textContent = dateTimeString);
}

function loadDashboardData() {
    // Simulate loading dashboard statistics
    const stats = {
        totalParticipants: Math.floor(Math.random() * 500) + 1000,
        totalQuestions: Math.floor(Math.random() * 50) + 150,
        activeExams: Math.floor(Math.random() * 20) + 5,
        completedResults: Math.floor(Math.random() * 200) + 800
    };

    // Update statistics with animation
    animateValue('totalParticipants', stats.totalParticipants);
    animateValue('totalQuestions', stats.totalQuestions);
    animateValue('activeExams', stats.activeExams);
    animateValue('completedResults', stats.completedResults);
}

function animateValue(elementId, finalValue) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const startValue = parseInt(element.textContent.replace(/,/g, '')) || 0;
    const duration = 1000;
    const startTime = performance.now();

    function updateValue(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const currentValue = Math.floor(startValue + (finalValue - startValue) * progress);
        element.textContent = currentValue.toLocaleString();
        
        if (progress < 1) {
            requestAnimationFrame(updateValue);
        }
    }
    
    requestAnimationFrame(updateValue);
}

function initCharts() {
    // Participants Chart
    const participantsCtx = document.getElementById('participantsChart');
    if (participantsCtx) {
        new Chart(participantsCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'],
                datasets: [{
                    label: 'Pendaftaran Peserta',
                    data: [65, 75, 80, 81, 56, 95],
                    borderColor: '#0d6efd',
                    backgroundColor: 'rgba(13, 110, 253, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // Grades Distribution Chart
    const gradesCtx = document.getElementById('gradesChart');
    if (gradesCtx) {
        new Chart(gradesCtx, {
            type: 'doughnut',
            data: {
                labels: ['Sangat Baik (90-100)', 'Baik (80-89)', 'Cukup (70-79)', 'Kurang (<70)'],
                datasets: [{
                    data: [25, 35, 30, 10],
                    backgroundColor: [
                        '#28a745',
                        '#17a2b8',
                        '#ffc107',
                        '#dc3545'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
}

function loadRecentActivities() {
    // Simulate loading recent activities
    const activities = [
        {
            time: '2 menit lalu',
            activity: 'Login ke sistem',
            user: 'admin@tka13.com',
            status: 'Berhasil',
            statusClass: 'success'
        },
        {
            time: '15 menit lalu',
            activity: 'Tambah soal baru',
            user: 'admin@tka13.com',
            status: 'Selesai',
            statusClass: 'success'
        },
        {
            time: '1 jam lalu',
            activity: 'Ujian dimulai',
            user: 'Sistem',
            status: 'Berjalan',
            statusClass: 'warning'
        }
    ];

    const tbody = document.querySelector('#activitiesTable tbody');
    if (tbody) {
        tbody.innerHTML = activities.map(activity => `
            <tr>
                <td>${activity.time}</td>
                <td>${activity.activity}</td>
                <td>${activity.user}</td>
                <td><span class="badge bg-${activity.statusClass}">${activity.status}</span></td>
            </tr>
        `).join('');
    }
}

// Quick action functions
function quickAddQuestion() {
    window.location.href = 'add-question.html';
}

function quickStartExam() {
    window.location.href = 'exam-management.html';
}

function quickAddParticipant() {
    // Show add participant modal
    const modal = new bootstrap.Modal(document.getElementById('addParticipantModal'));
    modal.show();
}

function exportResults() {
    // Simulate export
    alert('Mengekspor hasil ujian... File akan diunduh sebentar lagi.');
}

function openSettings() {
    window.location.href = 'settings.html';
}