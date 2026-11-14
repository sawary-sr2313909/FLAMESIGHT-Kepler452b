# Mission Safety X-Ray — redesigned experience

Work remains on `feature/mission-safety-xray`. No push, merge, website deployment, Render setting change, credential change, or NASA CSV modification was performed. The user separately approved publishing the Spline React code export during this revision.

## Integrated result

The existing Spline file **FLAMESIGHT Mission Safety X-Ray**, UUID `2213ab4c-06fa-48f9-bf27-4c0a07580646`, was substantially rebuilt and published with approval:

https://prod.spline.design/p9Rt6i6nDuN8Nmkj/scene.splinecode

React renders that actual export through the official `@splinetool/react-spline` and `@splinetool/runtime` packages. This is not a static background or separate prototype. The same app still serves Explorer, Compare, Ranking, Evidence Brief and Gemini chat.

The original conceptual model has 516 parts: pressure deck, curved ribs, port bulkhead and hatch, instrument bezel and display traces, 21 circuit breakers, cable looms and clamps, duct collars, filter louvers and fan, three cargo shelves, six fabric transport bags with straps/buckles, quilted insulation, lighting and fasteners. For the Spline scene, geometry is consolidated by assembly/material to keep the scene compact. Finishes use metalness/roughness, practical lighting, shadows and ambient occlusion. Geometry is illustrative, not a verified NASA spacecraft design or measured specification.

Mouse events on actual Spline meshes named `<component>::<finish>` map to the four existing React scenario names. The runtime controls a named inspection camera for orbit, zoom and smooth selection focus. Selection illuminates the assembly. Scanning adds a world-space moving slice and a projected, geometry-clipped scan band, retrieval reticle and deterministic evidence results.

The detailed SVG recovery renderer projects the same original three-dimensional geometry, with depth sorting, surface subdivision, shading, woven cargo fabric, component pins and direct equipment selection. It retains keyboard access, orbit, focus, zoom and scanning without WebGL or a scene download. It can be selected with the cube control. An error boundary, load timeout and graphics-context-loss listener also activate it. These recovery paths are implemented; the manual fallback path was exercised in the browser, while forced network failure/context loss was not simulated.

**Spline plan constraint:** the Free account's export includes a visible Built with Spline badge. It has been retained. This work does not purchase or change a plan. The standard runtime's larger chunks remain lazy-loaded, with a Vite size advisory; no unsupported bundler suppression was added.

## Scientific behavior preserved

`evidenceCoverage.js` is unchanged by the visual revision. It ranks study metadata by matched conditions, never probability of fire. The current CSVs contain ten studies and four extracted records (three observed results and one objective). Oxygen and component applicability are unreported; only SAFFIRE-I and III have numeric airflow metadata. Unknown and unspecified conditions remain unknown. Missing fields are limitations of the curated dataset, not proof NASA has never investigated a condition.

All scenarios currently have dataset coverage gaps because component applicability and oxygen are absent. A material mention in study metadata does not verify every finding for that material or geometry. The UI preserves evidence IDs, source URLs, objective/result labels, curated engineering interpretations, AI labels and scientific/SI-use disclosures. The cabin equipment names are interface mappings only, not invented mappings to NASA test hardware.

Gemini continues through the existing Express `/api/interpret` endpoint with the same model, key handling and response contract. It explains one retrieved study at a time; the deterministic comparison across all studies does not depend on AI. Prompt constraints and source attribution are preserved, but AI explanations still require human source verification.

## Files changed

- `app/src/CabinViewer.jsx` and `CabinViewer.css`: real lazy-loaded Spline runtime, camera controls, scene events, selection lighting, scan sweep, responsive canvas sizing, accessible controls, loading/error handling and detailed projected SVG fallback.
- `app/src/cabinModel.js`: original reusable geometry, finishes, descriptions and strict scene-name-to-component mapping.
- `app/src/cabinModel.test.js`: geometry integrity, spatial depth, bounds and event mapping checks.
- `app/scripts/spline-build.mjs`: generates bounded editor DSL passes from the geometry source, including lighting/camera setup. It does not publish or mutate a remote scene when run locally. It is intended for an explicitly authorized rebuild of this scene.
- `app/src/MissionXRay.jsx` and `MissionXRay.css`: integrated inspection workspace, demos, controls, scan/results, coverage visualization, citations, research question and optional source-grounded AI explanation.
- `app/src/Product.css`: site-wide mission-control identity, horizontal navigation, responsive layouts, cards, charts, comparisons, briefs and AI presentation.
- `app/src/App.jsx` and `App.css`: X-Ray becomes the hero feature; all existing tools and disclosures remain; earlier loading and accessibility improvements retained.
- `app/src/Compare.jsx`: real reported-value comparison charts, explicit missing values and units; original table remains functional.
- `app/index.html`: product title and description.
- `app/package.json` and `package-lock.json`: official Spline dependencies and repeatable eight-test command. Install reported zero dependency vulnerabilities.
- `app/src/evidenceCoverage.js` and its tests: original deterministic feature implementation, unchanged by the redesign.
- `server/index.js`: earlier source-grounding prompt additions retained; no backend code was changed during the visual redesign.
- `mission-xray-redesign.jpg`, `mission-xray-scan.jpg`, `mission-xray-evidence.jpg`, `mission-xray-fallback.jpg`, `mission-xray-mobile.jpg`: local browser verification captures.

## Validation and interaction proof

- `npm test` in `app`: all eight tests passed, including byte-for-byte equality of public CSV copies with `NASA_DATA`.
- `npm run lint`: successful with the pre-existing unused `known` helper warning in `SafetyBrief.jsx` only.
- `npm run build`: successful. Vite reports two large Spline runtime chunks; the runtime is split and loaded dynamically.
- Browser ran the actual built app through the existing local Express server at `http://localhost:3001`.
- All four components were selected by clicking physical meshes in the actual 3D canvas; the corresponding scenario heading updated. Mobile selection of the electrical rack also worked.
- Pointer drag changed orbit from 18 degrees to 40 degrees; zoom increased from 100% to 112%; reset restored the overview. Camera focus and illumination were reviewed visually.
- Concrete end-to-end interaction: click actual cargo rack -> selected Storage area -> SIBAL/Microgravity/20 cm/s -> Scan Evidence -> EVIDENCE GAP DETECTED -> SAFFIRE-I first with 3/5 matched metadata fields -> Gemini explanation citing E001 and its NASA source. The limitations explicitly retain unknown oxygen and component applicability.
- Final canvas-click check also selected the actual Electrical panel, ran the component-clipped scan sweep, and showed SAFFIRE-I at 3/5 with Matched material/gravity/airflow, Unknown component/oxygen, and E001 source attribution. `mission-xray-scan.jpg` and `mission-xray-evidence.jpg` record this interaction.
- The detailed fallback was rendered, reviewed and selected manually. Clicking rack geometry selected Electrical panel; keyboard Enter on the ventilation pin selected Ventilation system. Its zoom/orbit controls returned 112% and 19 degrees, then reset worked.
- Comparison charts showed SAFFIRE-III at 25 cm/s versus SAFFIRE-I at 20 cm/s after swap, from real CSV metadata.
- Existing tools: FLEX search returned one result with cool-flame details; ISS filtering returned four studies; comparison swap worked; fabric ranking returned BASS-M first; brief generation and actual TXT download succeeded.
- A real integrated Gemini X-Ray response was received with E001/source URL and objective/result/limitation separation. Existing Gemini chat was also exercised.
- Desktop and 390 x 844 mobile views were reviewed. Mobile document width equaled client width (375 CSS pixels after scrollbar), with no horizontal overflow; the camera adapts its distance to stage aspect ratio.
- Browser console had no application errors during the core checks. An early transparent-background color warning was corrected by using an opaque supported color.

## Local review and safe deployment handoff

1. Remain on `feature/mission-safety-xray`. Run `npm ci`, `npm test`, `npm run lint`, and `npm run build` in `app`. Use `npm ci` and `node index.js` in `server` with the existing private environment configuration.
2. Open `http://localhost:3001`. Test all four scene components, each demo, a scan, citations, fallback, comparison, brief download and Gemini.
3. Review the changes, captures, disclosures and remaining Spline branding constraint. Review current competition submission requirements separately; the project disclosure does not assert formal competition certification.
4. Obtain explicit approval before any merge that could trigger deployment, push to main, website deployment or Render setting change. The approved Spline asset export does not authorize those actions.
5. After approval, use the existing deployment process and credentials; retain the previous deployed commit as the rollback target. Smoke-test health, CSV loading, scene rendering, fallback, existing tools and Gemini, and roll back through the approved existing process if checks fail.

No new runtime environment variables are required. The published scene URL is a non-secret asset constant in `CabinViewer.jsx`. No generated measurements or NASA branding were introduced.
