import React, {useMemo, useRef, useState} from 'react';
import {Player} from '@remotion/player';
import {FrontendInMotion} from '../FrontendInMotion';
import {topic as initialTopic, type TopicConfig} from '../topic';
import type {Storyboard} from '../storyboard';

const cloneTopic = (): TopicConfig => ({
  ...initialTopic,
  colors: {...initialTopic.colors},
  scenes: initialTopic.scenes.map((scene) => ({...scene})),
  quiz: {...initialTopic.quiz, options: [...initialTopic.quiz.options]},
  hashtags: [...initialTopic.hashtags],
  audio: {...initialTopic.audio},
});

const shortLabel = (value: string) => value.replace(/[^a-z0-9 ]/gi, '').trim().split(/\s+/).slice(0, 2).map((word) => word.slice(0, 5)).join(' ').toUpperCase() || 'TOPIC';

const topicFromStoryboard = (storyboard: Storyboard, base: TopicConfig): TopicConfig => {
  const next = cloneTopic();
  const palette = storyboard.creativeDirection.colorPalette;
  next.title = storyboard.title;
  next.prompt = storyboard.prompt;
  next.storyboard = storyboard;
  next.durationInSeconds = storyboard.settings.durationInSeconds;
  next.fps = storyboard.settings.fps;
  next.width = storyboard.settings.width;
  next.height = storyboard.settings.height;
  next.motionSeed = storyboard.seed;
  next.background = palette[0] || base.background;
  next.colors = {...base.colors, blue: palette[1] || base.colors.blue, purple: palette[2] || base.colors.purple};
  next.scenes = storyboard.scenes;
  next.visualLabels = storyboard.scenes.slice(0, 3).map((scene) => scene.elements[0] || scene.visualType.toUpperCase());
  next.logoText = shortLabel(storyboard.title).replace(/\s/g, '').slice(0, 4);
  return next;
};

function App() {
  const [draft, setDraft] = useState<TopicConfig>(cloneTopic);
  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState('Enter a prompt to generate your video.');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const generationId = useRef(0);

  const inputProps = useMemo(() => ({topic: draft}), [draft]);
  const generate = async () => {
    const requestId = ++generationId.current;
    const effectivePrompt = prompt.trim();
    if (!effectivePrompt) {
      setStatus('Write a prompt before generating the video.');
      return;
    }
    setIsGenerating(true);
    setStatus('Gemini is creating your video storyboard…');
    try {
      const response = await fetch('/api/storyboard/generate', {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify({prompt: effectivePrompt, durationInSeconds: draft.durationInSeconds, fps: draft.fps, width: draft.width, height: draft.height}),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({})) as {error?: string};
        throw new Error(body.error || `Storyboard API failed with status ${response.status}.`);
      }
      const body = await response.json() as {storyboard?: Storyboard; provider?: 'gemini' | 'mock'};
      if (!body.storyboard) throw new Error('Storyboard API returned no storyboard.');
      if (requestId !== generationId.current) return;
      setDraft((current) => topicFromStoryboard(body.storyboard!, current));
      setStatus(body.provider === 'mock' ? 'Mock storyboard generated and validated.' : 'Gemini storyboard generated and validated.');
    } catch (error) {
      if (requestId !== generationId.current) return;
      setStatus(error instanceof Error ? error.message : 'Video generation failed. Try again.');
    } finally {
      if (requestId === generationId.current) setIsGenerating(false);
    }
  };

  const downloadVideo = async () => {
    if (!draft.storyboard || isRendering) return;
    setIsRendering(true);
    setStatus('Rendering your original AI storyboard into an MP4…');
    try {
      const response = await fetch('/api/video/render', {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify({storyboard: draft.storyboard}),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({})) as {error?: string};
        throw new Error(body.error || `Video rendering failed with status ${response.status}.`);
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'frontend-in-motion-ai-video.mp4';
      anchor.click();
      URL.revokeObjectURL(url);
      setStatus('Your AI-generated MP4 is ready to download.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Video rendering failed. Try again.');
    } finally {
      setIsRendering(false);
    }
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <div className="eyebrow">FRONTEND IN MOTION</div>
          <h1>AI motion video generator</h1>
          <p className="subtitle">Describe the video you want. Gemini directs the visuals and Remotion renders the result.</p>
        </div>
        <div className="brand-mark"><span>MM</span><small>Md Mohiuddin</small></div>
      </header>

      <div className="workspace">
        <section className="panel editor-panel">
          <div className="section-heading"><div><span className="step">01</span><h2>Describe your video</h2></div><span className="format-badge">1080 × 1350 · 4:5</span></div>
          <label>Prompt<textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Describe exactly what you want the video to show…" rows={8} /></label>
          <button className="primary-button" onClick={() => void generate()} disabled={isGenerating || !prompt.trim()}>{isGenerating ? 'Generating the video…' : 'Generate the video'} <span>→</span></button>
          <p className="generated-prompt">Your prompt is sent to Gemini only when you click the button. Nothing is generated while you type.</p>

          <div className="divider" />
          <div className="section-heading compact"><div><span className="step">02</span><h2>Download</h2></div></div>
          <div className="export-card"><strong>Original AI-generated video</strong><span>Render the validated storyboard as an H.264 MP4</span><button className="secondary-button" onClick={() => void downloadVideo()} disabled={!draft.storyboard || isRendering}>{isRendering ? 'Rendering MP4…' : 'Download video'}</button></div>
        </section>

        <section className="panel preview-panel">
          <div className="section-heading"><div><span className="step">PREVIEW</span><h2>Live canvas</h2></div><span className="live-dot">● LIVE</span></div>
          <div className="player-wrap">
            {draft.storyboard ? (
              <Player key={`${draft.prompt}-${draft.motionSeed}`} component={FrontendInMotion} inputProps={inputProps} durationInFrames={draft.durationInSeconds * draft.fps} compositionWidth={draft.width} compositionHeight={draft.height} fps={draft.fps} controls autoPlay loop style={{width: '100%', maxHeight: '70vh', aspectRatio: '4 / 5'}} />
            ) : (
              <div className="preview-empty">{isGenerating ? <><span className="cooking-spinner" aria-hidden="true" /><strong>Something is cooking…</strong><span>Gemini is preparing your motion video.</span></> : <span>Enter a prompt and generate your video to see the preview.</span>}</div>
            )}
          </div>
          <div className="status-row"><span className="status-dot" />{status}</div>
          <div className="tips"><span>Tip</span> Gemini creates the storyboard, the preview renders it locally, and Download video renders the same validated AI plan as an MP4.</div>
        </section>
      </div>
      <footer><span>Prompt → Gemini → preview</span><span>Gemini API key stays on the server</span></footer>
    </main>
  );
}

export default App;
