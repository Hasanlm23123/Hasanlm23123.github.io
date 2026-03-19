# RoleReady AI

RoleReady AI is a Vercel-ready full-stack project that analyzes a candidate resume against a job description and returns:

- A fit score and recruiter summary
- Resume strengths, gaps, and concrete fixes
- Rewritten resume bullets
- Likely interview questions with talking points
- A 7-day prep plan

## Stack

- Static frontend: `projects/role-ready-ai/index.html`
- Frontend logic: `projects/role-ready-ai/app.js`
- Serverless backend: `api/role-ready.js`
- Model integration: OpenAI Responses API with structured JSON output

## Deployment

1. Import this repo into Vercel.
2. Add `OPENAI_API_KEY` as an environment variable.
3. Deploy.

The frontend calls `/api/role-ready`, so the live OpenAI analysis works when the repo is hosted on Vercel. On GitHub Pages, the project automatically shows a demo response because static hosting cannot run the serverless route.

## Notes

- The backend disables response storage with `store: false`.
- Input length is validated before the API call.
- The UI is designed to read like a recruiter tool, not just a plain prompt box.
