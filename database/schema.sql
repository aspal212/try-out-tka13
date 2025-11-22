-- Participants table
CREATE TABLE IF NOT EXISTS participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    nisn TEXT UNIQUE NOT NULL,
    birth_date DATE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    participant_id TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'aktif' CHECK(status IN ('aktif', 'menunggu', 'terblokir')),
    registration_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Exam results table
CREATE TABLE IF NOT EXISTS exam_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    participant_id INTEGER NOT NULL,
    exam_name TEXT NOT NULL,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    correct_answers INTEGER NOT NULL,
    wrong_answers INTEGER NOT NULL,
    duration INTEGER, -- in minutes
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (participant_id) REFERENCES participants (id)
);

-- Questions table (for reference)
CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_text TEXT NOT NULL,
    category TEXT NOT NULL,
    difficulty TEXT NOT NULL CHECK(difficulty IN ('mudah', 'sedang', 'sulit')),
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_participants_nisn ON participants(nisn);
CREATE INDEX IF NOT EXISTS idx_participants_username ON participants(username);
CREATE INDEX IF NOT EXISTS idx_participants_status ON participants(status);
CREATE INDEX IF NOT EXISTS idx_participants_registration_date ON participants(registration_date);
CREATE INDEX IF NOT EXISTS idx_exam_results_participant ON exam_results(participant_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_exam_name ON exam_results(exam_name);