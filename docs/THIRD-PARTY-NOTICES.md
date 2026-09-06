# Third-party notices

## Exercise catalog & illustrations (RepDB free tier)

Built-in exercises and flat WebP illustrations are a **curated subset** of the
[RepDB free exercise dataset](https://github.com/RepDB/exercise-dataset)
used **in-app only**.

License (summary — see their `LICENSE-DATA.md`):

- Free for personal and **commercial in-app** use
- **Attribution required** (visible in Settings → Credits)
- Do **not** republish/resell as a dataset or API
- Do **not** use images for generative-AI training/derivation
- Do **not** ship `premium-samples/` in production

Attribution shown to users:

> Exercise data by [RepDB](https://repdb.co)

Regenerate the curated seed + images:

```bash
curl -L -o scripts/_repdb_exercises.json https://raw.githubusercontent.com/RepDB/exercise-dataset/main/exercises.json
node scripts/import-repdb-catalog.mjs
```

## Optional YouTube links

“Watch form” opens YouTube search (or a pinned `videoUrl`). We do not host
third-party exercise videos.
