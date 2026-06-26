-- Migration script to add support for unregistered/custom salesperson or staff in calendar events
ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS custom_assigned_to TEXT;
