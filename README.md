# HHD Practice Room

Free static browser prototype for Year 11 VCE Health and Human Development.

## Run locally

Because the site loads `questions.json`, use a local web server rather than opening `index.html` directly:

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000`.

## Publish free with GitHub Pages

1. Create a public GitHub repository named `hhd-practice-room`.
2. Upload every file in this folder to the repository root.
3. Open **Settings > Pages**.
4. Select **Deploy from a branch**, then `main` and `/ (root)`.
5. Test `tests.html` and then the main application in Microsoft Edge or Google Chrome.

## Marker modes

- **Rubric self-check:** instant fallback, no model download.
- **Local AI:** optional WebLLM model using WebGPU. The first download is large and availability depends on device memory, browser policy and network restrictions.

## Privacy

Answers, drafts and progress remain in browser local storage. The package has no analytics or backend.

## Important

Results are estimates for practice. The teacher's mark is authoritative. Fictional question-bank data must not be presented as real statistics.
