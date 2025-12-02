-- Manual SQL to insert sections if they don't exist
-- Run this in your Render PostgreSQL database

INSERT INTO sections (grade_level, section_name, max_capacity, room_number, is_active) VALUES
('Kindergarten', 'angel', 35, 'Room 101', true),
('Kindergarten', 'dahlia', 35, 'Room 102', true),
('Kindergarten', 'lily', 35, 'Room 103', true),
('Kindergarten', 'santan', 35, 'Room 104', true),
('Grade 1', 'rosal', 40, 'Room 201', true),
('Grade 1', 'rose', 40, 'Room 202', true),
('Grade 2', 'camia', 40, 'Room 301', true),
('Grade 2', 'daisy', 40, 'Room 302', true),
('Grade 2', 'lirio', 40, 'Room 303', true),
('Grade 3', 'adelfa', 40, 'Room 401', true),
('Grade 3', 'orchids', 40, 'Room 402', true),
('Grade 4', 'ilang-ilang', 40, 'Room 501', true),
('Grade 4', 'sampaguita', 40, 'Room 502', true),
('Grade 5', 'blueberry', 45, 'Room 601', true),
('Grade 5', 'everlasting', 45, 'Room 602', true),
('Grade 6', 'cattleya', 45, 'Room 701', true),
('Grade 6', 'sunflower', 45, 'Room 702', true),
('Non-Graded', 'tulips', 30, 'Room 801', true)
ON CONFLICT (section_name) DO NOTHING;

-- Verify sections were inserted
SELECT COUNT(*) as total_sections FROM sections;
SELECT grade_level, section_name, room_number, is_active FROM sections ORDER BY grade_level, section_name;
