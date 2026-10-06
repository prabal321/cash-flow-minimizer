# Expense Splitter — Deployment Guide

## Phase 37: Running on a Real Device via Expo Go

### 1. Start the Backend

```bash
cd backend
npm run dev
# Server starts at http://localhost:4000/graphql
```

### 2. Find Your Machine's LAN IP

```bash
# macOS
ipconfig getifaddr en0
# e.g. 192.168.1.42
```

### 3. Configure the Mobile App

Edit `mobile/.env`:

```env
EXPO_PUBLIC_GRAPHQL_URI=http://192.168.1.42:4000/graphql
```

Your phone must be on the **same Wi-Fi network** as your development machine.

### 4. Start Expo

```bash
cd mobile
npx expo start
```

Scan the QR code with Expo Go (iOS: Camera app, Android: Expo Go app).

### 5. Test Authentication

1. Open the app on your phone.
2. Tap **Sign Up** — create a test account.
3. After signup you land on the Groups screen.

### 6. GraphQL URL Configuration Summary

| Environment | URL |
|---|---|
| iOS Simulator | `http://localhost:4000/graphql` |
| Android Emulator | `http://10.0.2.2:4000/graphql` |
| Physical device | `http://<LAN-IP>:4000/graphql` |

---

## Phase 36: End-to-End Test Procedure

1. **User A signs up** via Sign Up screen.
2. **User B signs up** (use a separate device or incognito browser + Expo).
3. **User A creates** "Goa Trip" group.
4. **User A invites** User B — copies the token.
5. **User B** taps Accept Invitation (or use `acceptInvitation` GraphQL mutation) with the token.
6. **Group Detail** shows 2 members.
7. **User A adds** ₹1000 expense — EQUAL split — both participants.
   - Each share: ₹500.
8. **User A adds** another expense — UNEQUAL split.
   - A: ₹300, B: ₹700.
9. **Settlements screen** shows correct balances and recommended transactions.
10. **Delete** an expense — verify balances update on refresh.
11. **Edit** an expense — verify balances update.
12. **Logout** — app returns to Login screen.
13. **Login again** — data persists (Apollo cache + Supabase backend).

---

## Phase 38: Security & Code Review Checklist

### Security
- [x] `.env` is in `.gitignore` — service-role key never committed
- [x] Service-role key is **backend-only** — never sent to Expo app
- [x] Mobile app uses anon key (public) for Supabase auth only
- [x] Every authenticated GraphQL request sends `Authorization: Bearer <token>`
- [x] Backend verifies JWT via `anonClient.auth.getUser(token)` before granting access
- [x] All mutations require `requireAuth()` check in resolvers

### Backend
- [x] Thin resolvers — all logic in `src/services/`
- [x] `group.service.ts`, `expense.service.ts`, `balance.service.ts`, `settlement.service.ts`
- [x] Input validation in every service function
- [x] Compensating transactions on failure (createGroup, createExpense)

### Database
- [x] Foreign keys on all join tables
- [x] `amount CHECK (amount > 0)` on expenses
- [x] UNIQUE constraints: `group_members(group_id, user_id)`, `expense_splits(expense_id, user_id)`
- [x] Indexes on foreign keys and `group_invitations.token`
- [x] RLS enabled on all 6 tables
- [x] `handle_new_user()` trigger auto-creates profile on auth.users insert
- [x] `get_my_group_ids()` SECURITY DEFINER function breaks RLS recursion

### GraphQL
- [x] Full schema: User, Group, GroupMember, GroupInvitation, Expense, ExpenseSplit, Balance, Settlement
- [x] All queries and mutations implemented and tested
- [x] Typed errors: UNAUTHENTICATED, FORBIDDEN, NOT_FOUND, BAD_REQUEST
- [x] Auth context: `user` + `supabase` (service client) passed to every resolver

### Frontend
- [x] Expo Go compatible (no custom native modules)
- [x] Redux for client state only: auth session, UI state
- [x] Apollo Client for all server state (groups, expenses, balances)
- [x] Navigation: auth gate, bottom tabs, stack navigators
- [x] Loading states on all async operations
- [x] Error states with `Alert.alert`
- [x] Empty states on Groups and Expenses lists
- [x] Session persistence: token stored in `expo-secure-store`
- [x] Safe area + keyboard avoidance on form screens

### Algorithm
- [x] MaxHeap binary heap in `backend/src/utils/heap.ts`
- [x] Greedy cash-flow minimization in `settlement.service.ts`
- [x] O(n log n), at most n-1 transactions for n non-zero participants
- [x] `distributeAmount()` for penny-accurate equal splits
- [x] EPSILON = 0.005 for float comparison in settlement
