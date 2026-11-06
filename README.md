# DentCast publish queue

This branch holds the publish queue. It is not the site and nothing here is deployed.

The rules live on `main`:

- **Prepare an item or report the queue:** `.dentcast/workflows/publish-queue.md`, read completely; preparation then reads the queue-prep reading pack it names (`tools/dentcast_publish_readpack.py --queue-prep`).
- **Publish an item (publish day):** only `.dentcast/workflows/queue-route.md`, one tool per step, two deliveries.
- **Tool maintainers:** `.dentcast/workflows/queue-maintainer.md` (publish-day tool contract). No agent reads it on either day.

Each item is a folder `queue/NN-<category>-<latin-slug>/`. NN is the queue order and never changes. The only log of an item is the history section of its `00-وضعیت.md`; `queue/_logs/` is historical and nothing new is written there.
