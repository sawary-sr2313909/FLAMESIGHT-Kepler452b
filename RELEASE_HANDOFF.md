# Production deployment handoff — 14 November 2026

## Scope and branch

Design and feature work are frozen. This preflight only validates, documents, commits and pushes the approved feature. All application changes are on `feature/mission-safety-xray`. No environment variables, credentials, Render settings, main branch content or deployment settings were changed.

## Rollback baseline

The refreshed GitHub `origin/main`, local `main`, existing `backup-before-xray`, and feature branch's original HEAD all resolve to:

`a6c44f6f87d4d7f34bb3feb93a9ee949f7a0e12b`

This is the repository baseline for the existing production version. Render's deployed SHA has not been independently inspected; confirm it against this SHA before authorizing deployment. A local annotated tag `rollback/pre-mission-safety-xray-2026-11-14` preserves this commit. Only the feature branch is pushed; the tag is local. The rollback commit remains an ancestor in the pushed feature history and is recorded here for recovery.

Before any later deployment, record the approved Render deployment ID and verify its commit. If rollback is required, redeploy that verified previous deployment/commit through the authorized Render workflow; do not rewrite main history.

## Preflight results

- Production Vite build passed. The Spline runtime remains lazy-loaded; Vite reports size advisories for its larger chunks.
- All eight automated tests passed: geometry integrity, component event mapping, spatial bounds/depth, exact CSV-copy integrity, matching, missing-versus-zero values, lunar differences, and objective/result distinction.
- Oxlint exited successfully with the pre-existing unused `known` helper warning in `SafetyBrief.jsx`.
- Server syntax check passed. `server/package.json` has no automated test suite: its `test` script is the original placeholder. HTTP/browser checks below provide backend integration coverage.
- Existing local Express production server: `/api/health`, `/`, `/data/experiments.csv`, `/data/evidence.csv` returned 200. Health reported Gemini configured. No environment variables were changed to run these checks.
- Existing `/api/interpret`: invalid short question returned 400; SAFFIRE-III returned 200 with `insufficient_evidence`; real FLEX/Gemini request returned 200 with E003 and its source URL.
- Browser regressions: FLEX Explorer search returned one result and cool-flame details; ISS filter returned four studies; comparison swap produced SAFFIRE-III versus SAFFIRE-I; Fabric ranking returned BASS-M first; brief generation exposed Export TXT; existing Gemini chat returned a real response. Prior verification also exercised an actual TXT download.
- Integrated Spline rendering, selection, orbit/zoom, detailed fallback, scenarios and evidence scanning were validated during implementation and checked again for this preflight.
- NASA CSVs, backend environment names, API contracts and source citations remain unchanged. SI-use and scientific-limitations disclosures remain present.

## Scientific validation item for submission

The live Gemini response was functional and cited E003, but added lunar/Martian gravity fractions absent from the retrieved curated records despite the grounding prompt. Treat this as a known scientific-validation issue, not a validated claim. Human source review of AI output is still required. The deterministic coverage engine and source records do not generate those values and are unaffected. No new feature or model change was made during this deployment preparation.

## Exact final merge commands — only after explicit approval

A push to main may trigger Render's existing automatic deployment. Do not execute these commands until approval includes that consequence and the deployed rollback SHA has been confirmed.

```powershell
git fetch origin
git switch main
git pull --ff-only origin main
git merge --no-ff origin/feature/mission-safety-xray -m "Merge Mission Safety X-Ray"
git push origin main
```

If main advances, review the new diff/conflicts and repeat the build/tests before pushing. Do not force-push.

## Deployment verification checklist

- Confirm deployed commit equals the approved merged commit; retain the verified previous deployment ID and SHA.
- Check `/api/health` is 200 and Gemini configured without displaying secrets.
- Confirm both CSVs load and show 10 studies / 4 evidence records.
- Check Spline loads; select a physical component, orbit/zoom, run a scan, then check accessible fallback and mobile layout.
- Verify Explorer, Compare, Ranking, brief export and Gemini chat on the deployed origin.
- Verify evidence IDs/source links, unknown oxygen/component applicability, objective/result labels and SI/AI disclosures.
- Review browser/server errors and one real Gemini answer for unsupported claims; use the verified previous deployment for rollback if necessary.

Website deployment, merging into main, and environment changes remain unapproved and were not performed.
