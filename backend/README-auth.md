# Auth

Email + password, with a self-issued JWT as the session token. No third-party
identity provider — the only auth secret to configure is `JWT_SECRET_KEY`.

## Endpoints

| Method | Path                 | Body                        | Returns                      |
| ------ | -------------------- | --------------------------- | ---------------------------- |
| POST   | `/api/auth/register` | `email`, `password`, `name?` | `201` `{ token, user }`      |
| POST   | `/api/auth/login`    | `email`, `password`         | `200` `{ token, user }`      |
| GET    | `/api/auth/me`       | —                           | `200` `{ user }`             |

`/auth/me` and every other protected route read the token from
`Authorization: Bearer <token>`. The WebSocket route takes it as a query param
and resolves it through the same `verify_jwt` path.

## Configuration

`JWT_SECRET_KEY` signs session tokens. Generate one with:

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Rotating it invalidates every existing session. `JWT_EXPIRY_DAYS` (default `7`)
controls token lifetime. Startup logs a warning if the secret is still the
built-in default.

## Password storage

bcrypt, via the `bcrypt` package directly (not passlib, which is unmaintained
and breaks against bcrypt 4.x). Hashing and verification both run in a
threadpool because bcrypt deliberately costs ~100ms and would otherwise stall
the event loop for every concurrent request.

bcrypt hashes only the first 72 bytes of a password and silently ignores the
rest, so both endpoints reject anything longer rather than truncating it —
otherwise two long passwords sharing a 72-byte prefix would be interchangeable.

Failed logins run a bcrypt comparison against a dummy hash even when the email
doesn't exist, so response time doesn't reveal which addresses are registered.
Note that `/auth/register` returning `409` on a taken email does disclose
existence; that's a deliberate usability trade, since the alternative is a
signup form that fails without saying why.

## The unique index on `users.email`

Email is the login identifier, so `connect_db()` builds a unique index on it.
This index — not an application-level "does this email exist?" check — is what
makes registration safe: two concurrent signups for the same address both pass a
read-then-insert check, and only the index rejects the loser.

It is scoped with `partialFilterExpression: { email: { $gt: "" } }` so it
tolerates pre-existing documents with a missing or blank email. The old Google
sign-in stored `""` when a token carried no email claim, and several such
documents would otherwise collide on null and the index would never build.

If index creation fails, startup logs an exception and continues — the app still
runs, but duplicate accounts become possible until the underlying duplicates are
cleaned up. Check for them with:

```js
db.users.aggregate([
  { $group: { _id: { $toLower: "$email" }, n: { $sum: 1 }, ids: { $push: "$_id" } } },
  { $match: { n: { $gt: 1 } } },
])
```

## Migrating accounts left over from Google sign-in

Documents created by the old Google OAuth flow have a `google_sub` and no
`password_hash`. Those users can't log in — there's no password to check — and
`/auth/login` returns `409` telling them the account needs migration.

They are deliberately *not* allowed to claim the account by registering with the
same email. There's no email-verification step in this app, so "set a password
for this address" would let anyone who knows the address take over that user's
saved trips.

Find them with:

```js
db.users.find({ password_hash: { $exists: false } }, { email: 1, google_sub: 1 })
```

For pre-launch/test data, delete them and let the owners sign up fresh. Their
trips are keyed by user `_id`, so this orphans those documents:

```js
// Check what would be orphaned first.
const ids = db.users.find({ password_hash: { $exists: false } }).map(u => u._id)
db.trips.countDocuments({ user_id: { $in: ids.map(String) } })
```

For real users, the safe path is an out-of-band reset: verify the person by
another channel, then set a `password_hash` for them using
`auth_service.hash_password`.
