-- Migration to add hourly payment support to the payroll module
-- Run this in your Supabase SQL Editor
-- URL: https://supabase.com/dashboard/project/ddwyutisxymuvofkjhpz/sql

ALTER TABLE payroll_workers 
  ADD COLUMN IF NOT EXISTS payment_type text NOT NULL DEFAULT 'daily' CHECK (payment_type IN ('daily', 'hourly'));

ALTER TABLE payroll_workers 
  ADD COLUMN IF NOT EXISTS hourly_rate numeric NOT NULL DEFAULT 0;

-- Comments explaining the new structure:
-- payment_type: 'daily' (default) for workers paid a daily rate, 'hourly' for workers paid an hourly rate.
-- hourly_rate: the hourly rate of the worker.
