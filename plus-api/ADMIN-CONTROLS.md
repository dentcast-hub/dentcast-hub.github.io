# Member and Spot administration

The existing Basic-auth `/admin` page now includes **فهرست اعضا** and
**مدیریت کمپین‌های Spot**. All admin endpoints inherit the same `onRequest`
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

Migration **0069_member_spot_controls** adds a profile ordering index and the
per-placement `spot_controls` table. Migration **0070_spot_campaign_sessions**
adds one optional three-visit campaign schedule. Both migrations are additive;
their down migrations retain saved controls so rollback cannot discard them.
The admin page leads with three plain-language visit cards. Each can be off,
image-only, text-only, or mixed, with an optional link. Saving makes the
schedule advance once per visit; a visit continues until 30 minutes without a
page view. Resetting resumes the published static rotation. An empty/unsaved
schedule leaves published behavior unchanged.

The detailed per-placement editor remains under **«تنظیم جداگانهٔ محل‌های
نمایش (پیشرفته)»**. It controls eleven technical placements, not campaign
visits. Resetting one placement retains its saved creative and sets
`use_default`; an explicit save reactivates its override.

The checked-in Spot configuration currently contains eleven placement keys.
The three-visit schedule is separate from those placements: it chooses the
campaign for each visit, while the placement switches determine where a card
can appear. A saved campaign schedule is applied by `GET /spot/config`; existing
placement overrides continue to take precedence for their own placement. The
schedule preserves premium exclusion and impression/click reporting. On an API
outage the renderer retains the published static configuration. Reload a page
to pick up a saved change.

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

The admin preview reads published static defaults through the same-origin
`GET /admin/spot/defaults` endpoint. The API tries the .ir and .org mirrors with
bounded timeouts and validates the placement switches. A failed read leaves the
form unavailable with an explicit unknown-state message; it never becomes a
fictional disabled placement. This read does not use the GitHub upload token.
