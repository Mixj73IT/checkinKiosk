
CREATE INDEX IF NOT EXISTS idx_students_token ON students(current_token);
CREATE INDEX IF NOT EXISTS idx_events_date_student ON events(date, student_id) WHERE voided=0;
CREATE INDEX IF NOT EXISTS idx_daily_status_date ON daily_status(date);
CREATE INDEX IF NOT EXISTS idx_queue_status_next ON delivery_queue(status, next_retry);
