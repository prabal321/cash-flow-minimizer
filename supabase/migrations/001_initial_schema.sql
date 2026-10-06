-- =============================================================
-- expense-splitter: initial schema
-- Phases 2, 3, 4, 5 combined
-- =============================================================

-- =============================================================
-- ENUMS
-- =============================================================

CREATE TYPE member_role AS ENUM ('owner', 'member');

-- =============================================================
-- TABLES
-- =============================================================

-- profiles: one row per auth.users row, auto-created by trigger
CREATE TABLE profiles (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    email       TEXT NOT NULL UNIQUE,
    avatar_url  TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- groups
CREATE TABLE groups (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    description TEXT,
    created_by  UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- group_members: junction table — one row per user per group
CREATE TABLE group_members (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id    UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role        member_role NOT NULL DEFAULT 'member',
    joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (group_id, user_id)
);

-- group_invitations: token-based invitations
CREATE TABLE group_invitations (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id    UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    email       TEXT NOT NULL,
    token       TEXT NOT NULL UNIQUE,
    invited_by  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    expires_at  TIMESTAMPTZ NOT NULL,
    used        BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- expenses: one row per expense event
CREATE TABLE expenses (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id    UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount      NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    paid_by     UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    split_count INTEGER NOT NULL CHECK (split_count > 0),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- expense_splits: one row per participant per expense
CREATE TABLE expense_splits (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_id  UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    amount      NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (expense_id, user_id)
);

-- =============================================================
-- INDEXES
-- =============================================================

CREATE INDEX idx_groups_created_by          ON groups(created_by);
CREATE INDEX idx_group_members_group_id     ON group_members(group_id);
CREATE INDEX idx_group_members_user_id      ON group_members(user_id);
CREATE INDEX idx_invitations_group_id       ON group_invitations(group_id);
CREATE INDEX idx_invitations_email          ON group_invitations(email);
CREATE INDEX idx_invitations_token          ON group_invitations(token);
CREATE INDEX idx_expenses_group_id          ON expenses(group_id);
CREATE INDEX idx_expenses_paid_by           ON expenses(paid_by);
CREATE INDEX idx_expense_splits_expense_id  ON expense_splits(expense_id);
CREATE INDEX idx_expense_splits_user_id     ON expense_splits(user_id);

-- =============================================================
-- UPDATED_AT TRIGGER (shared function)
-- =============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_groups_updated_at
    BEFORE UPDATE ON groups
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_expenses_updated_at
    BEFORE UPDATE ON expenses
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================
-- PROFILE AUTO-CREATION TRIGGER (Phase 4)
-- Fires after every new row in auth.users.
-- Reads the display name from signup metadata if provided.
-- ON CONFLICT DO NOTHING makes it safe to run twice.
-- =============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, name, email)
    VALUES (
        NEW.id,
        COALESCE(
            NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
            SPLIT_PART(NEW.email, '@', 1)
        ),
        NEW.email
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- =============================================================
-- ROW LEVEL SECURITY (Phase 5)
-- =============================================================

ALTER TABLE profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups            ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members     ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses          ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_splits    ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------
-- profiles
-- -----------------------------------------------------------

-- Read own profile
CREATE POLICY "profiles: read own"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

-- Read profiles of users who share a group with the current user
CREATE POLICY "profiles: read co-members"
    ON profiles FOR SELECT
    USING (
        id IN (
            SELECT gm.user_id FROM group_members gm
            WHERE gm.group_id IN (
                SELECT group_id FROM group_members WHERE user_id = auth.uid()
            )
        )
    );

-- Own insert (trigger uses SECURITY DEFINER but policy still needed)
CREATE POLICY "profiles: insert own"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Own update only
CREATE POLICY "profiles: update own"
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- -----------------------------------------------------------
-- groups
-- -----------------------------------------------------------

-- Members can read their groups
CREATE POLICY "groups: member read"
    ON groups FOR SELECT
    USING (
        id IN (
            SELECT group_id FROM group_members WHERE user_id = auth.uid()
        )
    );

-- Authenticated user can create a group (must be the creator)
CREATE POLICY "groups: create"
    ON groups FOR INSERT
    WITH CHECK (auth.uid() = created_by);

-- Only owner can update
CREATE POLICY "groups: owner update"
    ON groups FOR UPDATE
    USING (
        id IN (
            SELECT group_id FROM group_members
            WHERE user_id = auth.uid() AND role = 'owner'
        )
    );

-- Only owner can delete
CREATE POLICY "groups: owner delete"
    ON groups FOR DELETE
    USING (
        id IN (
            SELECT group_id FROM group_members
            WHERE user_id = auth.uid() AND role = 'owner'
        )
    );

-- -----------------------------------------------------------
-- group_members
-- -----------------------------------------------------------

-- Members can see all members of groups they belong to
CREATE POLICY "group_members: member read"
    ON group_members FOR SELECT
    USING (
        group_id IN (
            SELECT group_id FROM group_members WHERE user_id = auth.uid()
        )
    );

-- A user can insert themselves (accepting invitation) OR
-- the group owner can insert any member
CREATE POLICY "group_members: insert"
    ON group_members FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        OR
        group_id IN (
            SELECT group_id FROM group_members
            WHERE user_id = auth.uid() AND role = 'owner'
        )
    );

-- -----------------------------------------------------------
-- group_invitations
-- -----------------------------------------------------------

-- Owner can see invitations for their group.
-- Invited user can see invitations matching their email.
-- Any authenticated user can look up an invitation by token
-- (token acts as a capability — validated server-side).
CREATE POLICY "group_invitations: read"
    ON group_invitations FOR SELECT
    USING (
        group_id IN (
            SELECT group_id FROM group_members
            WHERE user_id = auth.uid() AND role = 'owner'
        )
        OR email = (SELECT email FROM profiles WHERE id = auth.uid())
        OR auth.uid() IS NOT NULL  -- token lookup during acceptance flow
    );

-- Only group owner can create invitations
CREATE POLICY "group_invitations: owner insert"
    ON group_invitations FOR INSERT
    WITH CHECK (
        group_id IN (
            SELECT group_id FROM group_members
            WHERE user_id = auth.uid() AND role = 'owner'
        )
    );

-- Authenticated user can mark an invitation as used
CREATE POLICY "group_invitations: mark used"
    ON group_invitations FOR UPDATE
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

-- -----------------------------------------------------------
-- expenses
-- -----------------------------------------------------------

-- Group members can read expenses in their groups
CREATE POLICY "expenses: member read"
    ON expenses FOR SELECT
    USING (
        group_id IN (
            SELECT group_id FROM group_members WHERE user_id = auth.uid()
        )
    );

-- Group members can create expenses in their groups
-- (paid_by validation — payer must be a group member — is enforced in service layer)
CREATE POLICY "expenses: member insert"
    ON expenses FOR INSERT
    WITH CHECK (
        group_id IN (
            SELECT group_id FROM group_members WHERE user_id = auth.uid()
        )
    );

-- Payer or group owner can update an expense
CREATE POLICY "expenses: update"
    ON expenses FOR UPDATE
    USING (
        paid_by = auth.uid()
        OR group_id IN (
            SELECT group_id FROM group_members
            WHERE user_id = auth.uid() AND role = 'owner'
        )
    );

-- Payer or group owner can delete an expense
CREATE POLICY "expenses: delete"
    ON expenses FOR DELETE
    USING (
        paid_by = auth.uid()
        OR group_id IN (
            SELECT group_id FROM group_members
            WHERE user_id = auth.uid() AND role = 'owner'
        )
    );

-- -----------------------------------------------------------
-- expense_splits
-- -----------------------------------------------------------

-- Group members can read splits for expenses in their groups
CREATE POLICY "expense_splits: member read"
    ON expense_splits FOR SELECT
    USING (
        expense_id IN (
            SELECT e.id FROM expenses e
            WHERE e.group_id IN (
                SELECT group_id FROM group_members WHERE user_id = auth.uid()
            )
        )
    );

-- Group members can insert splits for expenses in their groups
CREATE POLICY "expense_splits: member insert"
    ON expense_splits FOR INSERT
    WITH CHECK (
        expense_id IN (
            SELECT e.id FROM expenses e
            WHERE e.group_id IN (
                SELECT group_id FROM group_members WHERE user_id = auth.uid()
            )
        )
    );

-- Expense payer or group owner can update splits
CREATE POLICY "expense_splits: update"
    ON expense_splits FOR UPDATE
    USING (
        expense_id IN (
            SELECT e.id FROM expenses e
            WHERE e.paid_by = auth.uid()
            OR e.group_id IN (
                SELECT group_id FROM group_members
                WHERE user_id = auth.uid() AND role = 'owner'
            )
        )
    );

-- Expense payer or group owner can delete splits
-- (also deleted automatically via CASCADE when parent expense is deleted)
CREATE POLICY "expense_splits: delete"
    ON expense_splits FOR DELETE
    USING (
        expense_id IN (
            SELECT e.id FROM expenses e
            WHERE e.paid_by = auth.uid()
            OR e.group_id IN (
                SELECT group_id FROM group_members
                WHERE user_id = auth.uid() AND role = 'owner'
            )
        )
    );
