# DentCast Repo — Publishing Protocol

This repo powers DentCast. When the user brings new content to publish:

1. Read `.dentcast/workflows/README.md` and follow it strictly.
2. `dentcast-brain.json` is the source of truth for every content type's structure, schema, and category. Always use the most recent entry of the SAME category as the template for any new entry.
3. Never mix categories. NoteCast stays in NoteCast. Insight stays in Insight. Each category's entries go to their own section/array in the brain and their own directory on disk.
4. The "latest content" widget on the homepage reads the LAST entries from `dentcast-brain.json`. Therefore, every new entry MUST be appended at the END of its category in the brain — never inserted mid-list.
5. Auto-discover whatever you can. Ask the user only for things you genuinely cannot determine.
6. Brain entry schema is sacred. Never add new fields to a brain entry that don't exist on previous same-category entries. Match the existing shape exactly.

## Repo conventions

- `dentcast-brain.json` — central data file, has separate sections/arrays per content type.
- `tools/` — Python scripts including the main index builder.
- `index.html` — homepage with Pulse section + latest-content widget.
- Each content type has its own directory at the repo root (e.g., `/notecast/`, `/insight/`, `/litecast/`, etc.). Confirm exact paths from the URLs stored in brain entries.
- `.dentcast/workflows/` — publishing workflows.
