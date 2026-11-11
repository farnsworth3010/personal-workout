# Contract: Firestore access

The only security boundary of the app (constitution IV). Tested on the emulator.

## Rules

| Path | Read | Write |
|---|---|---|
| `/users/{uid}` | signed in and `auth.uid == uid` | same, and the document passes shape checks |
| `/users/{uid}/templates/{id}` | owner only | owner only, shape checks |
| `/users/{uid}/workouts/{id}` | owner only | owner only, shape checks |
| `/users/{uid}/exerciseStats/{id}` | owner only | owner only, shape checks |
| anything else | denied | denied |

Shape checks in rules stay shallow, because rules cannot iterate arrays: allowed top-level keys
only, types of scalar fields, `name` length, `entries` is a list within its size cap, `status` and
enum fields within their sets. Deep validation of entries is done on the client with the same
schema that types the app.

## Required tests (rules unit tests)

1. Unauthenticated: every read and write on every path is denied.
2. User A: read, create, update, delete under `/users/A/**` allowed for valid documents.
3. User A on `/users/B/**`: every read (get, list) and write denied, for all four document kinds.
4. A write with an unknown top-level key, a wrong scalar type, an oversized `entries` list or an
   empty or over-long `name` is denied.
5. Collection-group and root-level queries are denied.
