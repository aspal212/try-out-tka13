const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const morgan = require('morgan');
const { body, validationResult } = require('express-validator');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(morgan('combined'));

// Database connection
const dbPath = './database/tka13.db';
const db = new sqlite3.Database(dbPath);

// Helper function to run queries
function runQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve({ id: this.lastID, changes: this.changes });
            }
        });
    });
}

function getQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

function allQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

// Routes

// Get all participants
app.get('/api/participants', async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', status = '' } = req.query;
        const offset = (page - 1) * limit;
        
        let whereClause = 'WHERE 1=1';
        let params = [];
        
        if (search) {
            whereClause += ' AND (full_name LIKE ? OR nisn LIKE ? OR username LIKE ?)';
            const searchParam = `%${search}%`;
            params.push(searchParam, searchParam, searchParam);
        }
        
        if (status) {
            whereClause += ' AND status = ?';
            params.push(status);
        }
        
        const participants = await allQuery(`
            SELECT * FROM participants 
            ${whereClause}
            ORDER BY registration_date DESC 
            LIMIT ? OFFSET ?
        `, [...params, parseInt(limit), parseInt(offset)]);
        
        const totalResult = await getQuery(`
            SELECT COUNT(*) as total FROM participants ${whereClause}
        `, params);
        
        const totalParticipants = totalResult.total;
        
        res.json({
            success: true,
            data: participants,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalParticipants / limit),
                totalItems: totalParticipants,
                itemsPerPage: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Error fetching participants:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching participants'
        });
    }
});

// Get participant by ID
app.get('/api/participants/:id', async (req, res) => {
    try {
        const participant = await getQuery(
            'SELECT * FROM participants WHERE id = ?',
            [req.params.id]
        );
        
        if (!participant) {
            return res.status(404).json({
                success: false,
                message: 'Participant not found'
            });
        }
        
        // Get exam results
        const examResults = await allQuery(
            'SELECT * FROM exam_results WHERE participant_id = ? ORDER BY completed_at DESC',
            [req.params.id]
        );
        
        res.json({
            success: true,
            data: {
                ...participant,
                exam_results: examResults
            }
        });
    } catch (error) {
        console.error('Error fetching participant:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching participant'
        });
    }
});

// Get NISN list for duplicate checking
app.get('/api/participants/nisn-list', async (req, res) => {
    try {
        const nisnList = await allQuery('SELECT nisn FROM participants');
        res.json(nisnList);
    } catch (error) {
        console.error('Error fetching NISN list:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching NISN list'
        });
    }
});

// Create new participant
app.post('/api/participants', [
    body('fullName').trim().isLength({ min: 3 }).withMessage('Nama minimal 3 karakter'),
    body('nisn').isLength({ min: 10, max: 10 }).isNumeric().withMessage('NISN harus 10 digit angka'),
    body('birthDate').isISO8601().withMessage('Format tanggal lahir tidak valid'),
    body('username').trim().isLength({ min: 5 }).withMessage('Username minimal 5 karakter'),
    body('password').isLength({ min: 8 }).withMessage('Password minimal 8 karakter'),
    body('participantId').trim().notEmpty().withMessage('Participant ID harus diisi')
], async (req, res) => {
    try {
        // Check validation results
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Data tidak valid',
                errors: errors.array()
            });
        }
        
        const { fullName, nisn, birthDate, username, password, participantId } = req.body;
        
        // Check for duplicate NISN
        const existingNisn = await getQuery(
            'SELECT id FROM participants WHERE nisn = ?',
            [nisn]
        );
        
        if (existingNisn) {
            return res.status(400).json({
                success: false,
                message: 'NISN sudah terdaftar'
            });
        }
        
        // Check for duplicate username
        const existingUsername = await getQuery(
            'SELECT id FROM participants WHERE username = ?',
            [username]
        );
        
        if (existingUsername) {
            return res.status(400).json({
                success: false,
                message: 'Username sudah digunakan'
            });
        }
        
        // Insert new participant
        const result = await runQuery(`
            INSERT INTO participants 
            (full_name, nisn, birth_date, username, password, participant_id, status) 
            VALUES (?, ?, ?, ?, ?, ?, 'aktif')
        `, [fullName, nisn, birthDate, username, password, participantId]);
        
        const newParticipant = await getQuery(
            'SELECT * FROM participants WHERE id = ?',
            [result.id]
        );
        
        res.status(201).json({
            success: true,
            message: 'Peserta berhasil ditambahkan',
            data: newParticipant
        });
        
    } catch (error) {
        console.error('Error creating participant:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating participant'
        });
    }
});

// Update participant
app.put('/api/participants/:id', [
    body('fullName').optional().trim().isLength({ min: 3 }).withMessage('Nama minimal 3 karakter'),
    body('birthDate').optional().isISO8601().withMessage('Format tanggal lahir tidak valid'),
    body('status').optional().isIn(['aktif', 'menunggu', 'terblokir']).withMessage('Status tidak valid')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Data tidak valid',
                errors: errors.array()
            });
        }
        
        const updates = [];
        const params = [];
        
        ['fullName', 'birthDate', 'status'].forEach(field => {
            if (req.body[field] !== undefined) {
                updates.push(`${field === 'fullName' ? 'full_name' : field} = ?`);
                params.push(req.body[field]);
            }
        });
        
        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Tidak ada data yang diupdate'
            });
        }
        
        updates.push('updated_at = CURRENT_TIMESTAMP');
        params.push(req.params.id);
        
        const result = await runQuery(`
            UPDATE participants 
            SET ${updates.join(', ')} 
            WHERE id = ?
        `, params);
        
        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                message: 'Participant tidak ditemukan'
            });
        }
        
        const updatedParticipant = await getQuery(
            'SELECT * FROM participants WHERE id = ?',
            [req.params.id]
        );
        
        res.json({
            success: true,
            message: 'Peserta berhasil diupdate',
            data: updatedParticipant
        });
        
    } catch (error) {
        console.error('Error updating participant:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating participant'
        });
    }
});

// Delete participant
app.delete('/api/participants/:id', async (req, res) => {
    try {
        const result = await runQuery(
            'DELETE FROM participants WHERE id = ?',
            [req.params.id]
        );
        
        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                message: 'Participant tidak ditemukan'
            });
        }
        
        res.json({
            success: true,
            message: 'Peserta berhasil dihapus'
        });
        
    } catch (error) {
        console.error('Error deleting participant:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting participant'
        });
    }
});

// Get statistics
app.get('/api/statistics', async (req, res) => {
    try {
        const totalParticipants = await getQuery(
            'SELECT COUNT(*) as count FROM participants'
        );
        
        const activeParticipants = await getQuery(
            "SELECT COUNT(*) as count FROM participants WHERE status = 'aktif'"
        );
        
        const waitingParticipants = await getQuery(
            "SELECT COUNT(*) as count FROM participants WHERE status = 'menunggu'"
        );
        
        const blockedParticipants = await getQuery(
            "SELECT COUNT(*) as count FROM participants WHERE status = 'terblokir'"
        );
        
        const todayRegistrations = await getQuery(`
            SELECT COUNT(*) as count FROM participants 
            WHERE DATE(registration_date) = DATE('now')
        `);
        
        const completedExams = await getQuery(
            'SELECT COUNT(DISTINCT participant_id) as count FROM exam_results'
        );
        
        res.json({
            success: true,
            data: {
                totalParticipants: totalParticipants.count,
                activeParticipants: activeParticipants.count,
                waitingParticipants: waitingParticipants.count,
                blockedParticipants: blockedParticipants.count,
                todayRegistrations: todayRegistrations.count,
                completedExams: completedExams.count
            }
        });
        
    } catch (error) {
        console.error('Error fetching statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching statistics'
        });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'TKA13 API is running',
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`TKA13 Admin API server running on port ${PORT}`);
    console.log(`Database: ${dbPath}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nClosing database connection...');
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        } else {
            console.log('Database connection closed');
        }
        process.exit(0);
    });
});