# ORDER is a position enforced by the database

Status: accepted

`sort_order` was only a sort key with `created_at` as the tie-break, and the admin forms defaulted to `0`. Typing `0` for a new item did not move anything: among equal values the oldest wins, so the new item landed below all of them.

## Decision

- On `projects`, `certificates` and `tech_stack`, `sort_order` is a dense **0-based position**: writing `p` puts the row at `p` and shifts the others, out-of-range values are clamped, and a delete closes the gap.
- Triggers enforce it (migration `0004_content_positions.sql`), in the same transaction as the write. A per-table advisory lock serialises writers. The functions are `security invoker`, so row-level security keeps applying.
- The admin forms default a new item to the end of its list and reject empty or negative input.

## Considered

| Option                                    | Why not                                                     |
| ----------------------------------------- | ----------------------------------------------------------- |
| Client sends one update per shifted row   | Not atomic: a dropped connection leaves the order broken    |
| A separate "move" RPC after create/update | Two requests, not atomic, and other write paths can skip it |
| Only flip the tie-break to newest-first   | Numbers still would not mean positions                      |
| Drag-and-drop                             | Larger scope; can be built on top of this later             |

## Consequences

- Every write path (console, SQL Editor, `seed.sql`) gets the same behaviour; the Store interface is unchanged.
- The row returned by create/update can carry the pre-shift value. The console reloads the lists after saving.
- Shifted rows get a new `updated_at`.
- Rollback: drop the `*_position_*` triggers. The schema itself does not change.
