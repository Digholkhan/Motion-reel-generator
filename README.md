# Frontend in Motion — Production guide

A React + TypeScript + Remotion educational video generator for Md Mohiuddin. It includes a browser editor, frame-accurate 4:5 Facebook preview, reusable topic configuration, local audio preview, and a reliable local MP4 render workflow.

## What this application does

- Creates Facebook feed videos at **1080×1350 (4:5)**, 30fps, 30 seconds.
- Shows the real Remotion composition in a clean browser editor.
- Accepts a lesson title or a plain-language prompt without an API key.
- Generates an editable starter configuration from the prompt.
- Lets users change the series, creator, headline, and music preview.
- Exports the edited topic as JSON for repeatable rendering.
- Renders H.264 MP4 locally with the same composition used by the browser preview.

The prompt generator is dependency-free and creates a validated storyboard on every generation. [`src/storyboard.ts`](./src/storyboard.ts) classifies intent, chooses scene types, and emits narrative purpose, composition, motion, transition, and asset-element instructions. Remotion consumes those instructions through configurable scene renderers; it is not selecting a finished topic template. The current planner is local and deterministic rather than an LLM call. A server-side provider can replace `createStoryboard()` while preserving the `Storyboard` contract and keeping API keys off the client.

## AI Creative Director API

The application includes a server-side `POST /api/storyboard/generate` endpoint backed by Google's official `@google/genai` SDK. It requests schema-constrained JSON from Gemini, fits the scene durations to the requested duration, and runs the result through `validateStoryboard()` before returning it. Provider output is treated as data only; it is never executed as HTML or JavaScript.

Required server environment variables:

```text
GEMINI_API_KEY=your-server-only-key
GEMINI_MODEL=gemini-3.5-flash-lite
STORYBOARD_PROVIDER=gemini
```

Optional:

```text
API_PORT=8787
FRONTEND_ORIGIN=http://localhost:5173
```

For local development, start both the API and Vite together:

```powershell
npm run dev
```

Vite proxies `/api` to `http://localhost:8787`. On Vercel, [`api/storyboard/generate.ts`](./api/storyboard/generate.ts) is deployed as a serverless function automatically. Do not expose `GEMINI_API_KEY` through `VITE_` variables or commit it.

Copy `.env.example` to `.env` and add your Gemini key only to the server environment. `gemini-3.5-flash-lite` is the configured cost-effective model and supports structured JSON output for this integration. Set `STORYBOARD_PROVIDER=mock` to exercise the API without network calls or API charges; the UI labels mock results explicitly. If the local API is not running, the browser uses the existing local planner and clearly reports that it is in offline mode. Gemini errors are shown to the user and do not silently replace an approved storyboard.

Exact setup:

```powershell
npm install
Copy-Item .env.example .env
# Edit .env locally; never paste or commit GEMINI_API_KEY.
npm run typecheck
npm test
```

`npm run dev` starts both services:

```powershell
npm run dev
```

The Express server listens on `http://localhost:8787`; Vite serves the UI at `http://localhost:5173` and proxies `/api`. The server applies JSON body limits, CORS restricted to `FRONTEND_ORIGIN`, a 10-request-per-minute limiter, provider timeouts, and validation errors.

For a no-charge smoke test, set `STORYBOARD_PROVIDER=mock`, start the API, and submit the React, space, and cybersecurity prompts in the UI. The status will say **Mock storyboard generated and validated**, not Gemini. Restore `STORYBOARD_PROVIDER=gemini` for real generation. The backend retries transient Gemini `429` and `503` capacity responses up to twice with a short backoff.

## 1. Run locally

Install Node.js 20 or newer, then open PowerShell in the project folder:

```powershell
npm install
npm run typecheck
npm run dev
```

Open `http://localhost:5173`.

In the app:

1. Enter the complete video direction in the prompt field.
2. Click **Generate the video**. Typing alone never calls Gemini.
3. Wait for the validated storyboard and live Remotion preview.
4. Click **Download video** to render and download the exact validated AI storyboard as an H.264 MP4.

The browser workflow previews the generated storyboard and **Download video** renders that same validated AI plan on the server as an H.264 MP4. The Gemini key remains server-only.

## 2. Use Remotion Studio

For frame-by-frame inspection:

```powershell
npm run studio
```

Select `FrontendInMotionEpisode01` in Remotion Studio. The default topic is stored in [`src/topic.ts`](./src/topic.ts).

## 3. Render the default Facebook MP4

```powershell
npm run render
```

Output:

`frontend-in-motion-episode-01-fb.mp4`

The file is exactly 900 frames, 30 seconds, 30fps, 1080×1350, H.264.

## 4. Server-side video download

The **Download video** button sends the validated storyboard to `POST /api/video/render`. The API bundles the existing Remotion composition, renders it with the storyboard as `inputProps`, and streams the resulting H.264 MP4 back to the browser. It does not call Gemini again, so the downloaded file matches the preview's approved storyboard.

For production, run the API on a machine with a compatible Chromium environment and enough CPU, memory, and temporary disk space for Remotion rendering. Keep the API behind authentication or a deployment-level quota if the app is public.

## 5. Push to GitHub

Create an empty GitHub repository, then run:

```powershell
git init
git add .
git commit -m "Build Frontend in Motion reel generator"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

Do not commit private music, API keys, or generated MP4 files. The included `.gitignore` excludes `node_modules`, `.env` files, `dist`, MP4 files, and `public/audio/*`.

## 6. Deploy the editor to Vercel

### Vercel dashboard

1. Sign in at [vercel.com](https://vercel.com).
2. Click **Add New → Project**.
3. Import the GitHub repository.
4. Keep the detected framework as **Vite**.
5. Confirm:
   - Build command: `npm run build`
   - Output directory: `dist`
   - Install command: `npm install`
6. Click **Deploy**.

The included [`vercel.json`](./vercel.json) supplies the same settings automatically. The deployed URL provides the editor and live preview.

### Vercel CLI

```powershell
npm install -g vercel
vercel login
vercel
vercel --prod
```

## Important production rendering note

Vercel deployment reliably hosts the browser editor and preview. MP4 rendering should run on a worker or locally because Chromium + FFmpeg rendering is resource-heavy and Vercel Function limits vary by plan. For production video generation, use one of these supported paths:

- Render locally with `npm run render`.
- Run Remotion Lambda/Cloud Run/your own render worker and send the saved JSON plus a durable audio URL to it.
- Keep Vercel as the UI/API layer and move the render job to a queue-backed worker.

The current app does not claim to upload files or render MP4s on Vercel. That is deliberate: a browser `blob:` URL and an ephemeral serverless filesystem are not durable production media storage. Add Vercel Blob, S3, Cloudinary, or another object store before implementing remote render jobs.

For production, deploy the frontend and API behind HTTPS, set `GEMINI_API_KEY`, `GEMINI_MODEL`, `FRONTEND_ORIGIN`, and `STORYBOARD_PROVIDER=gemini` in server-side environment settings, and do not use `VITE_GEMINI_API_KEY`. The included Vercel function can serve the API; for a conventional Node deployment run `npm run api` behind a reverse proxy. Add a shared rate limiter such as Redis-backed limiting when deploying more than one API instance.

## Prompt-aware storyboard architecture

The old composition used seven fixed time windows and always rendered the same HTML/CSS/JavaScript lesson layout. The new flow is:

1. The editor sends the prompt to `createStoryboard()`.
2. The planner selects supported visual types (`particle`, `diagram`, `code`, `timeline`, or `kinetic-typography`) from topic intent and preserves a stable seed.
3. `validateStoryboard()` rejects unsupported types, invalid durations, unsafe fps, and invalid motion values, then calculates cumulative scene timing.
4. `FrontendInMotion` selects the active scene from the calculated timeline and passes its composition, animation, elements, and transition to the matching renderer.

Space prompts use layered particle/orbit scenes, phishing prompts use threat diagrams and timelines, and programming prompts use progressive code reveals. The same storyboard and seed produce the same frame output. The planner is intentionally local so the app works without an API key; an AI planner can be added server-side without changing the renderer contract.

## Audio

The composition always renders successfully with no audio. When `topic.audio.musicPath` is set, the music is mixed at a restrained volume. Only use music and sound effects that you own or have licensed. Add additional Remotion `<Audio>` layers in [`src/FrontendInMotion.tsx`](./src/FrontendInMotion.tsx) for typing, clicks, whooshes, or a bass hit.

## Validation commands

```powershell
npm run typecheck
npm test
npm run build
npm run render
```

The final MP4 can be checked with the bundled FFprobe:

```powershell
.\node_modules\@remotion\compositor-win32-x64-msvc\ffprobe.exe -v error -show_entries format=duration:stream=width,height,r_frame_rate,codec_name -of default=noprint_wrappers=1 .\frontend-in-motion-episode-01-fb.mp4
```

Expected values:

```text
codec_name=h264
width=1080
height=1350
r_frame_rate=30/1
duration=30.000000
```

## Social caption

> HTML builds it. CSS styles it. JavaScript brings it to life. Which superpower are you learning today?

`#FrontendInMotion #HTML #CSS #JavaScript #WebDevelopment`
