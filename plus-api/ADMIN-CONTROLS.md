# Member and Spot administration

The existing Basic-auth `/admin` page now includes **فهرست اعضا** and
**مدیریت جایگاه‌های تبلیغ**. All admin endpoints inherit the same `onRequest`
authentication hook; ordinary member sessions confer no admin privileges.

Members use `(created_at, id)` keyset pagination in both directions. The cursor
keeps PostgreSQL timestamp precision. Search covers names, identity usernames,
phones and exact profile IDs without duplicating users with multiple identities.
`subscriptions` and independent `premium_grants` determine the reported current
premium status; `profiles.tier` is returned separately as diagnostic cached data.
Expiry is evaluated on read, including before the expiry sweep runs. A removed
subscription is labeled revoked only when its existing activation audit says so.
Payment cancellation is reported separately from subscription status. Payment
history is paged across `payments` and `gift_redemptions`, including the stored
gateway track ID, bank reference, order ID and manual-payment reference. Gift
bearer codes and settings are not returned. Subscription granting is unchanged.

Migration **0069_member_spot_controls** adds a profile ordering index and an
initially empty `spot_controls` table. It does not rewrite or remove existing
data. Its down migration retains these additive structures so rollback cannot
discard saved campaigns. Resetting a placement retains its saved creative and
sets `use_default`; an explicit save reactivates its override.

The checked-in Spot configuration currently contains eleven placement keys,
not three. Each existing key is editable independently, covering any selection
of three without inventing or relocating placements. An untouched placement
continues using `spot/spot-config.json`, including rotation and targeting. A saved
override applies only to its placement, for its existing audiences, preserving
the premium exclusion and impression/click reporting. The public read endpoint
is `GET /spot/config`. On an API outage the renderer retains the published static
configuration. Reload a page to pick up a saved change.

## Image storage

The existing storage method is self-hosted files under **spot/img** in this
repository. The API uploads raw WebP/PNG/JPEG/GIF bytes (maximum 5 MiB), verifies
their signature, gives each a new UUID filename, and uses GitHub's Contents API
to append the file to the same directory. Neither image bytes nor base64 are
stored in PostgreSQL. Old image files remain available after a replacement.

Configure **SPOT_GITHUB_TOKEN** in the API runtime with a fine-grained token
restricted to `dentcast-hub/dentcast-hub.github.io`, **Contents: write**. Never
put this secret in frontend config or Git history. The deployment must be able
to reach `api.github.com`. A token that cannot write main (for example due to
branch protection) produces a visible `spot_storage_http_403`/`409`/`422`, rather
than a false successful upload. No new storage service or disk volume is used.
If unset the panel explicitly reports upload unavailable and the endpoint
returns `503 spot_storage_not_configured`; existing image paths still work.

The uploaded asset becomes public through the site's existing deployment
pipeline on both mirrors. The upload preview temporarily uses the selected
local file and says so; wait for site publication before saving the placement
with its new image path. Text, image and link can be used alone or together.
The backend accepts only self-hosted image paths and HTTP(S)/root-relative
destinations. Text renders through `textContent`, never raw markup.

The API changes require the project's normal API image deployment; merging
frontend files alone does not deploy the API. No production admin endpoint or
production database was invoked to seed or change a real campaign.

## Validation

From `plus-api`, with the existing local PostgreSQL service available:

```sh
npm ci
npm run build
npm test -- test/admin-member-spot.test.ts test/admin-member-spot.dom.test.ts test/admin.test.ts test/admin-resolve-user.test.ts test/admin-page-scripts.test.ts test/spot.dom.test.ts test/spot-stats.test.ts test/subscription.test.ts test/subscription-backfill.test.ts
```

The scoped Actions workflow runs this same build and these tests with PostgreSQL
16, plus the repository's asset-version check. Tests use a dedicated test
database and mocked image uploads, with no payment or notification delivery.
