
INSERT OR IGNORE INTO message_templates(template_name, channel, subject, body, variables) VALUES
('alert_initial', 'email',
 '{StudentName} has not checked out by {Cutoff}',
 'Student: {StudentName} ({StudentID})
Checked in: {CheckInTime}
Current time: {CurrentTime}
Station: {StationID}

Status: Not checked out by cutoff {Cutoff}.',
 '["StudentName","StudentID","CheckInTime","CurrentTime","StationID","Cutoff"]'
),
('alert_escalation', 'email',
 'Escalation: {StudentName} still not checked out',
 'Escalation notice for {StudentName} ({StudentID}). No checkout recorded as of {CurrentTime}.',
 '["StudentName","StudentID","CurrentTime"]'
),
('alert_sms', 'sms',
 null,
 '{StudentName} not checked out by {Cutoff}.',
 '["StudentName","Cutoff"]'
);
