# Frontend — Ghost Apprentice

React + Vite + Tailwind. See the root README for setup; the short version:

```
npm install
npm run dev      # http://localhost:5173, expects the backend on :8000
npm run lint     # oxlint
npm run build    # outputs to dist/ (generated, not committed)
```

API calls go through the single axios instance in `src/services/api.js`.
Manual content is sample data in `src/data/` until the backend serves it.
