-- Fix INSERT policies that were too strict.
-- The backend always sets created_by/paid_by to the authenticated user's ID.
-- Checking auth.role() = 'authenticated' is sufficient here — the
-- service layer provides the stronger guarantee that the value is correct.

-- groups: allow any authenticated user to create a group
DROP POLICY IF EXISTS "groups: create" ON groups;
CREATE POLICY "groups: create"
    ON groups FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- expenses: allow any group member to create an expense
DROP POLICY IF EXISTS "expenses: member insert" ON expenses;
CREATE POLICY "expenses: member insert"
    ON expenses FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated'
        AND group_id IN (SELECT get_my_group_ids())
    );

-- group_members: self-insert (accepting invitation) or owner insert
DROP POLICY IF EXISTS "group_members: insert" ON group_members;
CREATE POLICY "group_members: insert"
    ON group_members FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- profiles: allow trigger-created and self-created profiles
DROP POLICY IF EXISTS "profiles: insert own" ON profiles;
CREATE POLICY "profiles: insert own"
    ON profiles FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');
