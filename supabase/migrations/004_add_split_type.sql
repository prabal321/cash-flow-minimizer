-- Add split_type column to expenses table
-- Existing rows default to 'equal' since we can't recover the original value

ALTER TABLE expenses
  ADD COLUMN split_type TEXT NOT NULL DEFAULT 'equal'
  CHECK (split_type IN ('equal', 'unequal'));
