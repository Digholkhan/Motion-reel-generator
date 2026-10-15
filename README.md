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

The prompt generator is intentionally deterministic and dependency-free. It creates a strong editable starting point; it does not pretend to be an AI model. To add AI-generated lesson copy later, replace `topicFromPrompt()` in [`src/app/App.tsx`](./src/app/App.tsx) with a server-side provider call and keep the API key on the server.

## 1. Run locally

Install Node.js 20 or newer, then open PowerShell in the project folder:

```powershell
npm install
npm run typecheck
npm run dev
```

Open `http://localhost:5173`.

In the app:

1. Edit the topic title. After a short pause, the complete lesson configuration and preview regenerate automatically.
2. Leave the prompt empty if you want the app to create one automatically from the title.
3. Enter a prompt when you want to control the lesson direction. Prompt changes also regenerate automatically; the button is available for an immediate regeneration.
4. Edit the opening headline, series, or creator if needed.
5. Upload a licensed MP3/WAV/M4A file for the live preview.
6. Scrub or play the preview.
7. Click **Save topic JSON** when the configuration is ready.

The uploaded music is a browser-local preview. It is not uploaded to a server and disappears when the page is refreshed.

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

## 4. Render a topic created in the web app

After clicking **Save topic JSON**, place the downloaded file in the project root as:

`frontend-in-motion-topic.json`

Then render it with Remotion:

```powershell
npx remotion render src/index.tsx FrontendInMotionEpisode01 frontend-in-motion-custom.mp4 --props=frontend-in-motion-topic.json
```

If you used uploaded music, put the licensed file in `public/audio/` and change the JSON `musicPath` to a public path such as `/audio/my-track.mp3` before rendering. Temporary browser `blob:` URLs are intentionally removed from downloaded JSON because they cannot work in a CLI render.

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

Do not commit private music, API keys, or generated MP4 files. The included `.gitignore` excludes `node_modules`, `dist`, MP4 files, and `public/audio/*`.

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

## Audio

The composition always renders successfully with no audio. When `topic.audio.musicPath` is set, the music is mixed at a restrained volume. Only use music and sound effects that you own or have licensed. Add additional Remotion `<Audio>` layers in [`src/FrontendInMotion.tsx`](./src/FrontendInMotion.tsx) for typing, clicks, whooshes, or a bass hit.

## Validation commands

```powershell
npm run typecheck
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
