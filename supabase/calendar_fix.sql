ALTER TABLE calendar_events 
ADD COLUMN IF NOT EXISTS calendar_type text DEFAULT 'sales';

UPDATE calendar_events SET calendar_type = 'sales' WHERE calendar_type IS NULL;
