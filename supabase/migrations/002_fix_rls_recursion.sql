-- =============================================================
-- Fix: infinite recursion in group_members RLS policy
--
-- Root cause: the group_members SELECT policy queried group_members
-- itself, creating a recursive loop during policy evaluation.
--
-- Fix: a SECURITY DEFINER function queries group_members without
-- triggering RLS, breaking the recursion. All policies that need
-- to know "which groups does the current user belong to" now call
-- this function instead of querying group_members directly.
-- =============================================================

CREATE OR REPLACE FUNCTION get_my_group_ids()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT group_id FROM group_members WHERE user_id = auth.uid()
$$;

-- group_members: replace self-referencing policy
DROP POLICY IF EXISTS "group_members: member read" ON group_members;
CREATE POLICY "group_members: member read"
    ON group_members FOR SELECT
    USING (group_id IN (SELECT get_my_group_ids()));

-- profiles: co-members policy used group_members indirectly
DROP POLICY IF EXISTS "profiles: read co-members" ON profiles;
CREATE POLICY "profiles: read co-members"
    ON profiles FOR SELECT
    USING (
        id IN (
            SELECT gm.user_id FROM group_members gm
            WHERE gm.group_id IN (SELECT get_my_group_ids())
        )
    );

-- groups: member read
DROP POLICY IF EXISTS "groups: member read" ON groups;
CREATE POLICY "groups: member read"
    ON groups FOR SELECT
    USING (id IN (SELECT get_my_group_ids()));

-- expenses: member read + insert
DROP POLICY IF EXISTS "expenses: member read" ON expenses;
CREATE POLICY "expenses: member read"
    ON expenses FOR SELECT
    USING (group_id IN (SELECT get_my_group_ids()));

DROP POLICY IF EXISTS "expenses: member insert" ON expenses;
CREATE POLICY "expenses: member insert"
    ON expenses FOR INSERT
    WITH CHECK (group_id IN (SELECT get_my_group_ids()));

-- expense_splits: member read + insert
DROP POLICY IF EXISTS "expense_splits: member read" ON expense_splits;
CREATE POLICY "expense_splits: member read"
    ON expense_splits FOR SELECT
    USING (
        expense_id IN (
            SELECT e.id FROM expenses e
            WHERE e.group_id IN (SELECT get_my_group_ids())
        )
    );

DROP POLICY IF EXISTS "expense_splits: member insert" ON expense_splits;
CREATE POLICY "expense_splits: member insert"
    ON expense_splits FOR INSERT
    WITH CHECK (
        expense_id IN (
            SELECT e.id FROM expenses e
            WHERE e.group_id IN (SELECT get_my_group_ids())
        )
    );
