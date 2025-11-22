const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../database/tka13.db');

// Read and execute schema
function initDatabase() {
    const db = new sqlite3.Database(DB_PATH);
    
    // Read schema file
    const schema = fs.readFileSync(path.join(__dirname, '../database/schema.sql'), 'utf8');
    
    // Execute schema
    db.exec(schema, (err) => {
        if (err) {
            console.error('Error creating tables:', err);
        } else {
            console.log('Database tables created successfully');
        }
        
        // Insert sample data
        insertSampleData(db);
        
        db.close();
    });
}

function insertSampleData(db) {
    console.log('Inserting sample data...');
    
    // Sample participants
    const sampleParticipants = [
        {
            full_name: 'Ahmad Wijaya',
            nisn: '1234567890',
            birth_date: '2005-03-15',
            username: 'tka13_ahmad.wijaya_7890',
            password: 'TKA130315AB',
            participant_id: 'TKA13-001',
            status: 'aktif'
        },
        {
            full_name: 'Siti Nurhaliza',
            nisn: '2345678901',
            birth_date: '2006-07-22',
            username: 'tka13_siti.nurhaliza_8901',
            password: 'TKA130722CD',
            participant_id: 'TKA13-002',
            status: 'menunggu'
        },
        {
            full_name: 'Budi Rahmad',
            nisn: '3456789012',
            birth_date: '2006-01-10',
            username: 'tka13_budi.rahmad_9012',
            password: 'TKA130110EF',
            participant_id: 'TKA13-003',
            status: 'aktif'
        }
    ];
    
    const insertParticipant = db.prepare(`
        INSERT OR IGNORE INTO participants 
        (full_name, nisn, birth_date, username, password, participant_id, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    sampleParticipants.forEach(participant => {
        insertParticipant.run([
            participant.full_name,
            participant.nisn,
            participant.birth_date,
            participant.username,
            participant.password,
            participant.participant_id,
            participant.status
        ]);
    });
    
    insertParticipant.finalize();
    
    // Sample exam results
    const sampleResults = [
        {
            participant_id: 1,
            exam_name: 'TKA13 2025 - Simulasi 1',
            score: 85,
            total_questions: 100,
            correct_answers: 85,
            wrong_answers: 15,
            duration: 120
        },
        {
            participant_id: 1,
            exam_name: 'TKA13 2025 - Simulasi 2',
            score: 90,
            total_questions: 100,
            correct_answers: 90,
            wrong_answers: 10,
            duration: 115
        },
        {
            participant_id: 3,
            exam_name: 'TKA13 2025 - Simulasi 1',
            score: 75,
            total_questions: 100,
            correct_answers: 75,
            wrong_answers: 25,
            duration: 130
        }
    ];
    
    const insertResult = db.prepare(`
        INSERT INTO exam_results 
        (participant_id, exam_name, score, total_questions, correct_answers, wrong_answers, duration) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    sampleResults.forEach(result => {
        insertResult.run([
            result.participant_id,
            result.exam_name,
            result.score,
            result.total_questions,
            result.correct_answers,
            result.wrong_answers,
            result.duration
        ]);
    });
    
    insertResult.finalize();
    
    // Sample questions
    const sampleQuestions = [
        {
            question_text: 'Berapa hasil dari 15 × 8?',
            category: 'matematika',
            difficulty: 'mudah',
            correct_answer: 'B',
            explanation: '15 × 8 = 120'
        },
        {
            question_text: 'Apa ibukota dari Indonesia?',
            category: 'ips',
            difficulty: 'mudah',
            correct_answer: 'A',
            explanation: 'Ibukota Indonesia adalah Jakarta'
        },
        {
            question_text: 'Proses fotosintesis terjadi di mana?',
            category: 'ipa',
            difficulty: 'sedang',
            correct_answer: 'C',
            explanation: 'Fotosintesis terjadi di daun, khususnya di kloroplas'
        }
    ];
    
    const insertQuestion = db.prepare(`
        INSERT INTO questions 
        (question_text, category, difficulty, correct_answer, explanation) 
        VALUES (?, ?, ?, ?, ?)
    `);
    
    sampleQuestions.forEach(question => {
        insertQuestion.run([
            question.question_text,
            question.category,
            question.difficulty,
            question.correct_answer,
            question.explanation
        ]);
    });
    
    insertQuestion.finalize();
    
    console.log('Sample data inserted successfully');
}

// Initialize database
initDatabase();