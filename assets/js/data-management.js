// Data Management JavaScript
class DataManager {
    constructor() {
        this.uploadedFile = null;
        this.importMode = 'append';
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // File upload handlers
        const fileInput = document.getElementById('questionsFile');
        const uploadArea = document.getElementById('uploadArea');

        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        }

        if (uploadArea) {
            // Drag and drop functionality
            uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
            uploadArea.addEventListener('drop', (e) => this.handleDrop(e));
            uploadArea.addEventListener('click', () => fileInput.click());
        }

        // Import mode radio buttons
        document.querySelectorAll('input[name="importMode"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.importMode = e.target.value;
            });
        });

        // Validate and Import buttons
        const validateBtn = document.getElementById('validateBtn');
        const importBtn = document.getElementById('importBtn');

        if (validateBtn) {
            validateBtn.addEventListener('click', () => this.validateData());
        }

        if (importBtn) {
            importBtn.addEventListener('click', () => this.importData());
        }
    }

    handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            this.processFile(file);
        }
    }

    handleDragOver(event) {
        event.preventDefault();
        event.currentTarget.classList.add('dragover');
    }

    handleDrop(event) {
        event.preventDefault();
        event.currentTarget.classList.remove('dragover');
        
        const files = event.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    processFile(file) {
        // Validate file type
        const allowedTypes = ['.xlsx', '.xls', '.csv'];
        const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
        
        if (!allowedTypes.includes(fileExtension)) {
            this.showAlert('error', 'Format file tidak didukung! Gunakan Excel (.xlsx, .xls) atau CSV.');
            return;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            this.showAlert('error', 'Ukuran file terlalu besar! Maksimal 10MB.');
            return;
        }

        this.uploadedFile = file;
        this.readFile(file);
    }

    readFile(file) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, {type: 'array'});
                
                // Get first sheet
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                
                // Convert to JSON
                const jsonData = XLSX.utils.sheet_to_json(worksheet, {header: 1});
                
                this.displayPreview(jsonData);
                this.showAlert('success', `File berhasil dibaca: ${jsonData.length - 1} baris data`);
                
            } catch (error) {
                this.showAlert('error', 'Error membaca file: ' + error.message);
            }
        };
        
        if (file.name.toLowerCase().endsWith('.csv')) {
            reader.readAsText(file);
        } else {
            reader.readAsArrayBuffer(file);
        }
    }

    displayPreview(data) {
        const previewContainer = document.getElementById('filePreview');
        const questionsPreview = document.getElementById('questionsPreview');
        
        if (data.length === 0) {
            questionsPreview.innerHTML = '<p class="text-muted">File kosong atau tidak valid.</p>';
            return;
        }

        // Assume first row is header
        const headers = data[0];
        const rows = data.slice(1, 6); // Show first 5 rows
        
        let previewHTML = `
            <div class="table-responsive">
                <table class="table table-sm table-striped">
                    <thead>
                        <tr>${headers.map(header => `<th>${header}</th>`).join('')}</tr>
                    </thead>
                    <tbody>
                        ${rows.map(row => `
                            <tr>${row.map(cell => `<td>${cell || ''}</td>`).join('')}</tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <small class="text-muted">Menampilkan 5 dari ${data.length - 1} baris data</small>
        `;
        
        questionsPreview.innerHTML = previewHTML;
        previewContainer.style.display = 'block';
        
        // Enable validate button
        document.getElementById('validateBtn').disabled = false;
    }

    validateData() {
        if (!this.uploadedFile) {
            this.showAlert('error', 'Belum ada file yang dipilih!');
            return;
        }

        // Show validation in progress
        this.showAlert('info', 'Memvalidasi data...', 2000);
        
        // Simulate validation
        setTimeout(() => {
            const validationResults = {
                totalRows: 156,
                validRows: 150,
                invalidRows: 6,
                errors: [
                    'Baris 45: Kategori tidak valid',
                    'Baris 78: Pilihan jawaban kurang dari 2',
                    'Baris 123: Format email tidak valid'
                ]
            };

            this.displayValidationResults(validationResults);
            document.getElementById('importBtn').disabled = false;
        }, 2000);
    }

    displayValidationResults(results) {
        const resultsHTML = `
            <div class="card mt-3">
                <div class="card-header">
                    <h6>Hasil Validasi</h6>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-4">
                            <div class="text-center">
                                <h4 class="text-success">${results.validRows}</h4>
                                <small>Baris Valid</small>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="text-center">
                                <h4 class="text-danger">${results.invalidRows}</h4>
                                <small>Baris Bermasalah</small>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="text-center">
                                <h4 class="text-primary">${results.totalRows}</h4>
                                <small>Total Baris</small>
                            </div>
                        </div>
                    </div>
                    
                    ${results.errors.length > 0 ? `
                        <hr>
                        <h6>Error yang Ditemukan:</h6>
                        <ul class="list-unstyled">
                            ${results.errors.map(error => `
                                <li><small class="text-danger"><i class="bi bi-exclamation-triangle"></i> ${error}</small></li>
                            `).join('')}
                        </ul>
                    ` : ''}
                </div>
            </div>
        `;
        
        document.getElementById('questionsPreview').insertAdjacentHTML('beforeend', resultsHTML);
    }

    importData() {
        if (!this.uploadedFile) {
            this.showAlert('error', 'Belum ada file yang dipilih!');
            return;
        }

        // Show import progress
        this.showAlert('info', 'Mengimport data...', 5000);
        
        // Disable buttons during import
        document.getElementById('importBtn').disabled = true;
        document.getElementById('validateBtn').disabled = true;
        
        // Simulate import process
        setTimeout(() => {
            this.showAlert('success', 'Data berhasil diimport! 150 soal telah ditambahkan.');
            this.resetModal();
        }, 5000);
    }

    resetModal() {
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('importQuestionsModal'));
        if (modal) {
            modal.hide();
        }
        
        // Reset form
        document.getElementById('questionsFile').value = '';
        document.getElementById('filePreview').style.display = 'none';
        document.getElementById('importBtn').disabled = true;
        document.getElementById('validateBtn').disabled = true;
    }

    showAlert(type, message, duration = 0) {
        const alertContainer = document.getElementById('alertContainer') || this.createAlertContainer();
        const alertClass = type === 'error' ? 'danger' : type;
        const icon = type === 'error' ? 'exclamation-triangle' : type === 'success' ? 'check-circle' : 'info-circle';
        
        const alertHTML = `
            <div class="alert alert-${alertClass} alert-dismissible fade show" role="alert">
                <i class="bi bi-${icon}-fill me-2"></i>
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        alertContainer.innerHTML = alertHTML;
        
        if (duration > 0) {
            setTimeout(() => {
                const alert = alertContainer.querySelector('.alert');
                if (alert) {
                    const bsAlert = new bootstrap.Alert(alert);
                    bsAlert.close();
                }
            }, duration);
        }
    }

    createAlertContainer() {
        const container = document.createElement('div');
        container.id = 'alertContainer';
        container.className = 'mb-3';
        document.querySelector('.modal-body').insertBefore(container, document.querySelector('.modal-body').firstChild);
        return container;
    }
}

// Export functions
function exportResults() {
    showExportProgress('Mengekspor hasil ujian...');
    
    setTimeout(() => {
        // Simulate file download
        const link = document.createElement('a');
        link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(generateResultsCSV());
        link.download = `hasil-ujian-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        
        showExportSuccess('File hasil ujian berhasil diunduh!');
    }, 3000);
}

function exportStatistics() {
    showExportProgress('Mengekspor data statistik...');
    
    setTimeout(() => {
        showExportSuccess('File statistik berhasil diunduh!');
    }, 3000);
}

function showExportProgress(message) {
    const alertContainer = document.getElementById('exportAlertContainer') || createExportAlertContainer();
    
    alertContainer.innerHTML = `
        <div class="alert alert-info alert-dismissible fade show">
            <i class="bi bi-hourglass-split me-2"></i>
            ${message}
            <div class="progress mt-2" style="height: 4px;">
                <div class="progress-bar progress-bar-striped progress-bar-animated" style="width: 100%"></div>
            </div>
        </div>
    `;
}

function showExportSuccess(message) {
    const alertContainer = document.getElementById('exportAlertContainer');
    alertContainer.innerHTML = `
        <div class="alert alert-success alert-dismissible fade show">
            <i class="bi bi-check-circle-fill me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    setTimeout(() => {
        const alert = alertContainer.querySelector('.alert');
        if (alert) {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        }
    }, 5000);
}

function createExportAlertContainer() {
    const container = document.createElement('div');
    container.id = 'exportAlertContainer';
    container.className = 'mb-3';
    document.querySelector('.admin-main').insertBefore(container, document.querySelector('.admin-main').firstChild);
    return container;
}

function generateResultsCSV() {
    const headers = ['No', 'Nama', 'Email', 'Nilai', 'Rangking', 'Status', 'Waktu Selesai'];
    const data = [
        headers,
        ['001', 'Ahmad Wijaya', 'ahmad@email.com', 85, 1, 'Lulus', '10:30:15'],
        ['002', 'Siti Nurhaliza', 'siti@email.com', 82, 2, 'Lulus', '10:32:45'],
        // Add more sample data...
    ];
    
    return data.map(row => row.join(',')).join('\n');
}

// Initialize Data Manager
document.addEventListener('DOMContentLoaded', function() {
    new DataManager();
});