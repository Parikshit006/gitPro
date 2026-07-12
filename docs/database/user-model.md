# User Database Model

**Project:** GitPro  
**Table:** `users`  
**ORM:** Prisma  

---

## Schema

| Column         | Type        | Constraints                     | Description                                    |
|----------------|-------------|---------------------------------|------------------------------------------------|
| `id`           | `UUID`      | Primary Key, auto-generated     | GitPro's internal identifier for the user.     |
| `github_id`    | `BIGINT`    | Unique, Not Null                | The user's immutable GitHub numeric ID.        |
| `username`     | `TEXT`       | Not Null, Indexed               | The user's current GitHub login handle.        |
| `display_name` | `TEXT`       | Not Null                        | The user's display name (falls back to login). |
| `avatar_url`   | `TEXT`       | Not Null                        | URL to the user's GitHub avatar image.         |
| `profile_url`  | `TEXT`       | Not Null                        | URL to the user's public GitHub profile.       |
| `email`        | `TEXT`       | Nullable, Indexed               | The user's primary email from GitHub.          |
| `is_active`    | `BOOLEAN`   | Not Null, Default: `true`       | Whether the user account is active.            |
| `provider`     | `TEXT`       | Not Null, Default: `"github"`   | The OAuth provider used for authentication.    |
| `created_at`   | `TIMESTAMP` | Not Null, Default: `now()`      | When the user first authenticated with GitPro. |
| `updated_at`   | `TIMESTAMP` | Not Null, Auto-updated          | When the user record was last modified.        |
| `last_login_at`| `TIMESTAMP` | Nullable                        | When the user last completed an OAuth flow.    |

---

## Design Decisions

### Why GitHub ID is the unique external key

GitHub usernames are mutable — a user can rename their account at any time. The numeric GitHub ID (`github_id`) is permanent and immutable. It is the only reliable key for linking a GitPro user to their GitHub identity across renames. If we used `username` as the unique key, a user who renames their GitHub account would appear as a new user in GitPro, losing all their analysis history.

### Why username is NOT unique

Two scenarios make username uniqueness unsafe:

1. **Rename reuse.** If User A renames from `alice` to `alice-v2`, GitHub may eventually allow User B to claim the handle `alice`. If `username` were unique in GitPro, User B's login would fail with a constraint violation.
2. **Sync lag.** GitPro updates `username` on each login. Between logins, the stored value may be stale. Uniqueness on a stale, mutable field creates false conflicts.

The `github_id` column carries the uniqueness constraint instead.

### Why an internal UUID exists alongside GitHub ID

- **Domain isolation.** Foreign keys across GitPro tables (analysis runs, reports, metrics) reference the internal `id`, not `github_id`. This means GitPro's relational model has zero coupling to GitHub's identity scheme.
- **Future provider support.** If GitPro ever supports GitLab or Bitbucket OAuth, the internal UUID remains the universal primary key while each provider contributes its own external ID column.
- **Security.** The internal UUID is never sent to or received from GitHub, preventing enumeration attacks based on sequential GitHub IDs.

### Why email is nullable

GitHub does not require users to set a public email. The `user:email` OAuth scope grants access to the user's *verified* emails, but some accounts have no verified email at all. Making `email` non-nullable would block authentication for these users. GitPro treats email as optional profile metadata, not an identity key.

### Why lastLoginAt is useful

- **Security auditing.** Allows detecting dormant accounts that haven't authenticated in months.
- **Session hygiene.** Enables future policies like "require re-authentication after 90 days of inactivity."
- **Product analytics.** Provides a reliable signal for user engagement without requiring a separate analytics table.

This field is nullable because it is only set after a completed login — on initial record creation during the first OAuth flow, it may be set simultaneously with `created_at` or left null until the flow fully completes.

---

## Indexes

| Index                  | Columns      | Type      | Purpose                                    |
|------------------------|--------------|-----------|--------------------------------------------|
| Primary Key            | `id`         | Unique    | Internal record lookup.                    |
| `User_github_id_key`   | `github_id`  | Unique    | Fast lookup during OAuth callback upsert.  |
| `User_username_idx`    | `username`   | Non-unique | Lookup users by GitHub handle.             |
| `User_email_idx`       | `email`      | Non-unique | Lookup users by email address.             |
