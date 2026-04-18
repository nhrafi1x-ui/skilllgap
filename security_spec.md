# Security Specification - SkillGAP Navigator

## Data Invariants
1. A User Profile (`users/{userId}`) can only be created by the owner (where `auth.uid == userId`).
2. Users can only read and write their own data (profiles, todos, applications).
3. The `role` field in `users/{userId}` is strictly immutable for the user. Only an admin (via console or a specific admin collection) can change it.
4. Todos and Applications are nested under the user's document for strong relational isolation.
5. All IDs must match `^[a-zA-Z0-9_\-]+$`.
6. Timestamps (`updatedAt`, `createdAt`) must be server-validated.

## The "Dirty Dozen" Payloads (Blocked Actions)
1. **Identity Spoofing**: Attempt to create `users/other_user_id` as `current_user_id`. (Expected: Denied)
2. **Resource Scraping**: Attempt to list `users/` collection. (Expected: Denied)
3. **Subresource Scraping**: Attempt to read `users/other_user_id/todos/`. (Expected: Denied)
4. **Shadow Field Injection**: Attempt to update `users/my_id` with `isAdmin: true`. (Expected: Denied)
5. **Privilege Escalation**: Attempt to update `role: "admin"` on own profile. (Expected: Denied)
6. **Orphaned Writes**: Attempt to create a todo under a non-existent user path. (Expected: Denied)
7. **Value Poisoning**: Attempt to set `points` to a 1MB string. (Expected: Denied)
8. **Bypassing Identity**: Attempt to update `matchedJobId` of `users/other_user_id`. (Expected: Denied)
9. **Terminal State Reset**: If `milestones.hired` is true, attempt to reset it (if we enforce terminal states).
10. **ID Poisoning**: Use a document ID that is 10KB long. (Expected: Denied)
11. **Timestamp Spoofing**: Provide a client-side `updatedAt` far in the future. (Expected: Denied)
12. **Public PII Leak**: Unauthenticated user attempting to get any user profile. (Expected: Denied)

## Test Runner Plan
I will structure the `firestore.rules` to handle these scenarios using the 8 Pillars.
