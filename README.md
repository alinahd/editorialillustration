# How Everything Became Gambling: illustrated article (neon)

Interactive editorial illustrations for "How Everything Became Gambling" (The New York Times Magazine).
Student project for Next Level Coding, Project 2. **Not published by The New York Times.**

The page images in `article/` are captures of the NYT article, used only as a mockup background for
class and portfolio. **Keep this repository private.**

## What's here

| Path | What it is |
|---|---|
| `index.html` | The article page, with both illustrations in place |
| `small-hopes-neon/` | The Hope-O-Matic betting machine (lead illustration): neon arcade tickets for everyday hopes, printing faster and faster |
| `dating-casino-neon/` | The dating-app casino (inline, before the dating-app paragraph): a roulette wheel of dating profiles |
| `article/` | The article page as high-resolution images |
| `lib/` | p5.js and rough.js, bundled so the illustrations run offline |

Both illustrations are fictional simulations: every odd is invented and no real money is involved.

## Run it locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000. Fonts load from Google Fonts, so they need an internet connection.

## View it online

GitHub Pages can serve this repo as a website (Settings → Pages → Deploy from branch → `main`, folder `/`).
Pages on a **private** repository needs GitHub Pro, which is free for students through GitHub Education.
The resulting site is public to anyone with the link, so it republishes the article captures; think twice
before turning it on.
