import React, {useEffect, useMemo, useState} from 'react';
import {Player} from '@remotion/player';
import {FrontendInMotion} from '../FrontendInMotion';
import {topic as initialTopic, type TopicConfig} from '../topic';
import {createStoryboard} from '../storyboard';

const cloneTopic = (): TopicConfig => ({
  ...initialTopic,
  colors: {...initialTopic.colors},
  scenes: initialTopic.scenes.map((scene) => ({...scene})),
  quiz: {...initialTopic.quiz, options: [...initialTopic.quiz.options]},
  hashtags: [...initialTopic.hashtags],
  audio: {...initialTopic.audio},
});

const autoPromptForTitle = (title: string) =>
  `Teach beginner frontend developers about ${title.trim()} in a clear 30-second educational lesson.`;

const hashTitle = (value: string) =>
  [...value].reduce((hash, character) => ((hash * 31) + character.charCodeAt(0)) >>> 0, 7);

const hashPrompt = (title: string, prompt: string) =>
  hashTitle(`${title}|${prompt}|${Date.now()}|${Math.random()}`);

const paletteFor = (seed: number) => {
  const palettes = [
    {blue: '#168BFF', purple: '#8B5CF6', background: '#080D1C'},
    {blue: '#00D4A8', purple: '#F59E0B', background: '#071614'},
    {blue: '#FF5C8A', purple: '#A855F7', background: '#180A19'},
    {blue: '#22D3EE', purple: '#6366F1', background: '#07131C'},
  ];
  return palettes[seed % palettes.length];
};

const variants = ['orbit', 'cards', 'waves', 'focus'] as const;

const shortLabel = (value: string) => value.replace(/[^a-z0-9 ]/gi, '').trim().split(/\s+/).slice(0, 2).map((word) => word.slice(0, 5)).join(' ').toUpperCase() || 'TOPIC';

const titleFromPrompt = (prompt: string, fallbackTitle = initialTopic.title) => {
  const cleaned = prompt.replace(/\s+/g, ' ').trim();
  if (!cleaned) return fallbackTitle.trim() || initialTopic.title;
  const match = cleaned.match(/\b(?:about|on|explaining)\s+(.+)/i) ?? cleaned.match(/^teach(?: me)?\s+(.+)/i);
  return (match?.[1] ?? cleaned).replace(/[.!?]+$/, '').slice(0, 80);
};

const topicFromPrompt = (prompt: string, fallbackTitle: string, base: TopicConfig): TopicConfig => {
  const next = cloneTopic();
  const title = prompt.trim() ? titleFromPrompt(prompt, fallbackTitle) : fallbackTitle.trim() || initialTopic.title;
  const storyboard = createStoryboard(prompt.trim() || title, base);
  next.title = title;
  next.prompt = prompt.trim() || title;
  const seed = hashPrompt(title, prompt);
  const palette = paletteFor(seed);
  next.motionSeed = seed;
  next.visualVariant = variants[seed % variants.length];
  next.colors = {...next.colors, blue: palette.blue, purple: palette.purple};
  next.background = palette.background;
  next.logoText = shortLabel(title).replace(/\s/g, '').slice(0, 4);
  const labels = shortLabel(title).split(' ');
  next.visualLabels = [labels[0] || 'TOPIC', labels[1] || 'IDEA', ['BUILD', 'MAKE', 'SHARE', 'GROW'][seed % 4]];
  next.series = base.series;
  next.creator = base.creator;
  next.tagline = base.tagline;
  next.audio = {...base.audio};
  next.scenes = storyboard.scenes;
  const examples = [
    ['Explore', 'Practice', 'Share'],
    ['Notice', 'Connect', 'Create'],
    ['Plan', 'Build', 'Improve'],
    ['Read', 'Try', 'Repeat'],
  ][seed % 4];
  next.htmlCode = `<section class="lesson">\n  <h1>${next.title}</h1>\n  <button>${examples[0]}</button>\n</section>`;
  next.cssCode = `.lesson {\n  background: linear-gradient(135deg, ${palette.blue}, ${palette.purple});\n  border-radius: ${12 + (seed % 16)}px;\n  padding: ${16 + (seed % 18)}px;\n}`;
  next.javascriptCode = `const action = document.querySelector('button');\naction.addEventListener('click', () => {\n  action.textContent = '${examples[1]} complete!';\n});`;
  next.quiz = {
    question: `What is the best first step for ${next.title}?`,
    options: [`A. ${examples[0]}`, `B. ${examples[1]}`, `C. ${examples[2]}`],
    answer: `C. ${examples[2]}`,
  };
  next.caption = `${next.title}. ${examples.join(', ')} and keep moving forward.`;
  next.hashtags = [`#FrontendInMotion`, `#${next.title.replace(/[^a-z0-9]/gi, '')}`, '#WebDevelopment'];
  return next;
};

const topicFromTitleOrPrompt = (title: string, prompt: string, base: TopicConfig) =>
  topicFromPrompt(prompt.trim(), title, base);

function App() {
  const [draft, setDraft] = useState<TopicConfig>(cloneTopic);
  const [titleInput, setTitleInput] = useState(initialTopic.title);
  const [prompt, setPrompt] = useState('');
  const [musicName, setMusicName] = useState('');
  const [musicUrl, setMusicUrl] = useState<string>();
  const [status, setStatus] = useState('Ready to preview');

  useEffect(() => () => {
    if (musicUrl) URL.revokeObjectURL(musicUrl);
  }, [musicUrl]);

  const inputProps = useMemo(() => ({topic: draft}), [draft]);

  const update = <K extends keyof TopicConfig>(key: K, value: TopicConfig[K]) => {
    setDraft((current) => ({...current, [key]: value}));
  };

  useEffect(() => {
    const title = titleInput.trim();
    if (!title) {
      setStatus('Add a topic title to generate a lesson.');
      return;
    }
    setStatus('Generating lesson preview…');
    const timer = window.setTimeout(() => {
      setDraft((current) => topicFromTitleOrPrompt(title, prompt, current));
      setStatus(prompt.trim() ? 'New lesson generated from your prompt.' : 'New lesson generated from your title.');
    }, 450);
    return () => window.clearTimeout(timer);
  }, [titleInput, prompt]);

  const handlePrompt = () => {
    if (!titleInput.trim() && !prompt.trim()) {
      setStatus('Write a title or lesson prompt first.');
      return;
    }
    setDraft(topicFromTitleOrPrompt(titleInput || initialTopic.title, prompt, draft));
    setStatus(prompt.trim() ? 'New lesson generated from your prompt.' : 'New lesson generated from your title.');
  };

  const handleMusic = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('audio/')) {
      setStatus('Please choose an audio file.');
      return;
    }
    if (musicUrl) URL.revokeObjectURL(musicUrl);
    const url = URL.createObjectURL(file);
    setMusicUrl(url);
    setMusicName(file.name);
    update('audio', {...draft.audio, musicPath: url});
    setStatus('Music added to the live preview.');
  };

  const downloadConfig = () => {
    const exportTopic: TopicConfig = {
      ...draft,
      audio: {
        ...draft.audio,
        ...(draft.audio.musicPath?.startsWith('blob:') ? {musicPath: undefined} : {}),
      },
    };
    const blob = new Blob([JSON.stringify(exportTopic, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'frontend-in-motion-topic.json';
    anchor.click();
    URL.revokeObjectURL(url);
    setStatus('Topic configuration downloaded.');
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <div className="eyebrow">FRONTEND IN MOTION</div>
          <h1>Educational reel generator</h1>
          <p className="subtitle">Build a clean 4:5 Facebook post video from one topic or prompt.</p>
        </div>
        <div className="brand-mark"><span>MM</span><small>Md Mohiuddin</small></div>
      </header>

      <div className="workspace">
        <section className="panel editor-panel">
          <div className="section-heading"><div><span className="step">01</span><h2>Lesson setup</h2></div><span className="format-badge">1080 × 1350 · 4:5</span></div>
          <label>Topic title<input value={titleInput} onChange={(event) => setTitleInput(event.target.value)} /></label>
          <label>Prompt <span className="label-help">optional · auto-created from title when empty</span><textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder={autoPromptForTitle(titleInput || initialTopic.title)} rows={4} /></label>
          <button className="primary-button" onClick={handlePrompt}>Generate from prompt <span>→</span></button>
          <p className="generated-prompt"><span>Generated lesson prompt:</span> {prompt.trim() || autoPromptForTitle(titleInput || initialTopic.title)} · New motion direction on every generation</p>
          <div className="field-grid">
            <label>Series<input value={draft.series} onChange={(event) => update('series', event.target.value)} /></label>
            <label>Creator<input value={draft.creator} onChange={(event) => update('creator', event.target.value)} /></label>
          </div>
          <label>Opening headline<input value={draft.scenes[0].title} onChange={(event) => update('scenes', draft.scenes.map((scene, index) => index === 0 ? {...scene, title: event.target.value} : scene))} /></label>

          <div className="divider" />
          <div className="section-heading compact"><div><span className="step">02</span><h2>Sound</h2></div><span className="optional">optional</span></div>
          <label className="upload-box">
            <input type="file" accept="audio/*" onChange={handleMusic} />
            <span className="upload-icon">♪</span>
            <span><strong>{musicName || 'Upload licensed background music'}</strong><small>MP3, WAV, M4A · used in preview and local render</small></span>
            <span className="upload-action">Choose</span>
          </label>
          <p className="notice">Only use music you own or have licensed. Browser uploads are local previews; production rendering needs the audio file available to the render worker.</p>

          <div className="divider" />
          <div className="section-heading compact"><div><span className="step">03</span><h2>Export</h2></div></div>
          <div className="export-card"><strong>Facebook feed post</strong><span>H.264 MP4 · 30 sec · 30 fps · 1080 × 1350</span><button className="secondary-button" onClick={downloadConfig}>Save topic JSON</button></div>
        </section>

        <section className="panel preview-panel">
          <div className="section-heading"><div><span className="step">PREVIEW</span><h2>Live canvas</h2></div><span className="live-dot">● LIVE</span></div>
          <div className="player-wrap">
            <Player component={FrontendInMotion} inputProps={inputProps} durationInFrames={draft.durationInSeconds * draft.fps} compositionWidth={draft.width} compositionHeight={draft.height} fps={draft.fps} controls style={{width: '100%', maxHeight: '70vh', aspectRatio: '4 / 5'}} />
          </div>
          <div className="status-row"><span className="status-dot" />{status}</div>
          <div className="tips"><span>Tip</span> Every generation creates fresh lesson copy, colors, layout, and animation direction. Export the JSON to render that exact version with Remotion.</div>
        </section>
      </div>
      <footer><span>{draft.series} · {draft.tagline}</span><span>Runs locally in your browser · No API key required</span></footer>
    </main>
  );
}

export default App;
