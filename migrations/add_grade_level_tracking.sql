-- Migration: Add grade level tracking columns to students table
-- This allows teachers to update student grade levels and tracks who made the change

-- Add new columns to track grade level changes (if they don't already exist)
-- Using IF NOT EXISTS pattern to avoid errors if columns exist

ALTER TABLE students ADD COLUMN IF NOT EXISTS previous_grade_level VARCHAR(20);
ALTER TABLE students ADD COLUMN IF NOT EXISTS grade_level_updated_date TIMESTAMP;
ALTER TABLE students ADD COLUMN IF NOT EXISTS grade_level_updated_by VARCHAR(100);

-- Create index for finding students with recent grade updates
CREATE INDEX IF NOT EXISTS idx_grade_level_updated_date ON students(grade_level_updated_date DESC);

-- Optional: Create a grade_level_changes audit log table for complete history
CREATE TABLE IF NOT EXISTS grade_level_changes (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  old_grade_level VARCHAR(20),
  new_grade_level VARCHAR(20) NOT NULL,
  changed_by VARCHAR(100),
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  teacher_id INTEGER REFERENCES teachers(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_student_id (student_id),
  INDEX idx_changed_at (changed_at DESC)
);
