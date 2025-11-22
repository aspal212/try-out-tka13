const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const { body, validationResult } = require('express-validator');

// Mock data - replace with actual database
let participants = [];

// Middleware for authentication (implement based on your auth system)
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ success: false, message: 'Access token required' });
    }
    
    // Verify token (implement your JWT verification)
    // For now, assume it's valid
    next();
};

// GET all participants
router.get('/', authenticateToken, async (req, res) => {
    try {
        // In real implementation, query database
        res.json({
            success: true,
            data: participants,
            total: participants.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch participants',
            error: error.message
        });
    }
});

// GET participant by ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const participant = participants.find(p => p.id === parseInt(req.params.id));
        
        if (!participant) {
            return res.status(404).json({
                success: false,
                message: 'Participant not found'
            });
        }
        
        res.json({
            success: true,
            data: participant
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch participant',
            error: error.message
        });
    }
});

// CREATE new participant
router.post('/', [
    authenticateToken,
    body('fullName').notEmpty().withMessage('Full name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('school').notEmpty().withMessage('School is required'),
    body('class').notEmpty().withMessage('Class is required'),
    body('academicYear').notEmpty().withMessage('Academic year is required'),
    body('accountStatus').isIn(['aktif', 'menunggu', 'terblokir']).withMessage('Invalid account status')
], async (req, res) => {
    try {
        // Validate input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }
        
        const participantData = {
            id: participants.length + 1,
            fullName: req.body.fullName,
            email: req.body.email,
            nis: req.body.nis || null,
            phone: req.body.phone || null,
            gender: req.body.gender || null,
            birthDate: req.body.birthDate || null,
            address: req.body.address || null,
            religion: req.body.religion || null,
            school: req.body.school,
            class: req.body.class,
            major: req.body.major || null,
            academicYear: req.body.academicYear,
            parentName: req.body.parentName || null,
            parentRelation: req.body.parentRelation || null,
            parentPhone: req.body.parentPhone || null,
            parentEmail: req.body.parentEmail || null,
            parentJob: req.body.parentJob || null,
            accountStatus: req.body.accountStatus || 'menunggu',
            examGroup: req.body.examGroup || 'umum',
            priority: req.body.priority || 'normal',
            allowRetake: req.body.allowRetake !== false,
            allowDownload: req.body.allowDownload !== false,
            medicalCondition: req.body.medicalCondition || null,
            notes: req.body.notes || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // Generate credentials if auto-generate is enabled
        let credentials = null;
        if (req.body.autoGenerate !== false) {
            const { username, password } = generateCredentials(participantData);
            participantData.username = username;
            participantData.passwordHash = await bcrypt.hash(password, 10);
            
            credentials = {
                username,
                password,
                email: participantData.email
            };
        } else {
            // Use manual credentials
            participantData.username = req.body.manualUsername;
            participantData.passwordHash = await bcrypt.hash(req.body.manualPassword, 10);
        }
        
        // Check for duplicate email or username
        const existingEmail = participants.find(p => p.email === participantData.email);
        const existingUsername = participants.find(p => p.username === participantData.username);
        
        if (existingEmail) {
            return res.status(400).json({
                success: false,
                message: 'Email already exists'
            });
        }
        
        if (existingUsername) {
            return res.status(400).json({
                success: false,
                message: 'Username already exists'
            });
        }
        
        // Add to database (mock - replace with actual DB insert)
        participants.push(participantData);
        
        res.status(201).json({
            success: true,
            message: 'Participant created successfully',
            data: participantData,
            credentials: credentials
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to create participant',
            error: error.message
        });
    }
});

// UPDATE participant
router.put('/:id', authenticateToken, [
    body('fullName').notEmpty().withMessage('Full name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('accountStatus').optional().isIn(['aktif', 'menunggu', 'terblokir']).withMessage('Invalid account status')
], async (req, res) => {
    try {
        const participantId = parseInt(req.params.id);
        const participantIndex = participants.findIndex(p => p.id === participantId);
        
        if (participantIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Participant not found'
            });
        }
        
        // Update participant data
        participants[participantIndex] = {
            ...participants[participantIndex],
            ...req.body,
            updatedAt: new Date().toISOString()
        };
        
        res.json({
            success: true,
            message: 'Participant updated successfully',
            data: participants[participantIndex]
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update participant',
            error: error.message
        });
    }
});

// DELETE participant
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const participantId = parseInt(req.params.id);
        const participantIndex = participants.findIndex(p => p.id === participantId);
        
        if (participantIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Participant not found'
            });
        }
        
        participants.splice(participantIndex, 1);
        
        res.json({
            success: true,
            message: 'Participant deleted successfully'
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete participant',
            error: error.message
        });
    }
});

// IMPORT participants from Excel/CSV
router.post('/import', authenticateToken, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }
        
        // Process Excel/CSV file (implement with exceljs or csv-parser)
        // This is a placeholder - implement actual file processing
        const importedCount = Math.floor(Math.random() * 10) + 1;
        
        res.json({
            success: true,
            message: `${importedCount} participants imported successfully`,
            imported: importedCount
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to import participants',
            error: error.message
        });
    }
});

// Helper function to generate credentials
function generateCredentials(participantData) {
    // Generate username from name
    let username = participantData.fullName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '.')
        .replace(/\.+/g, '.')
        .replace(/^\.+|\.+$/g, '');
    
    // Ensure username is unique
    let counter = 1;
    let originalUsername = username;
    while (participants.find(p => p.username === username)) {
        username = `${originalUsername}${counter}`;
        counter++;
    }
    
    // Generate random password
    const password = generateRandomPassword();
    
    return { username, password };
}

function generateRandomPassword() {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

module.exports = router;