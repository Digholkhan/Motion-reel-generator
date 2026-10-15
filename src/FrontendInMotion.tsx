import React from 'react';
import {AbsoluteFill, Audio, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import type {TopicConfig} from './topic';

const font = 'Arial, Helvetica, sans-serif';
const mono = '"Cascadia Code", "SFMono-Regular", Consolas, monospace';

const clamp = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};
const fade = (frame: number, start: number, end: number) => interpolate(frame, [start, end], [0, 1], clamp);
const rise = (frame: number, start: number, end: number) => interpolate(frame, [start, end], [50, 0], clamp);

function CodeBlock({code, color}: {code: string; color: string}) {
  return <div style={{background: '#0D1428', border: `1px solid ${color}55`, borderRadius: 18, padding: '22px 24px', color: '#DCE7FA', fontFamily: mono, fontSize: 21, lineHeight: 1.55, whiteSpace: 'pre-wrap', boxShadow: `0 0 35px ${color}18`}}>{code}</div>;
}

function Website({styled, clicked, compact = false, topic}: {styled: boolean; clicked?: boolean; compact?: boolean; topic: TopicConfig}) {
  const label = topic.visualLabels[0] || topic.title;
  return <div style={{width: compact ? 440 : 590, padding: compact ? 22 : 32, background: styled ? '#111D3A' : '#F8FAFC', color: styled ? '#F8FAFC' : '#172033', borderRadius: styled ? 24 : 5, border: styled ? '1px solid #168BFF77' : '1px solid #CBD5E1', boxShadow: styled ? '0 0 45px #168BFF28' : 'none', fontFamily: font}}>
    <div style={{fontSize: compact ? 28 : 38, fontWeight: 800, marginBottom: 12}}>{label}</div>
    <div style={{fontSize: compact ? 17 : 22, opacity: styled ? 0.7 : 1, marginBottom: 23}}>Learn by building.</div>
    <div style={{display: 'inline-block', padding: styled ? '14px 25px' : '10px 16px', borderRadius: styled ? 12 : 3, color: '#fff', fontWeight: 700, background: styled ? `linear-gradient(90deg, ${topic.colors.blue}, ${topic.colors.purple})` : '#64748B'}}>{clicked ? 'You clicked!' : 'Start learning'}</div>
  </div>;
}

function Brand({topic}: {topic: TopicConfig}) {
  return <div style={{position: 'absolute', bottom: 46, left: 70, right: 70, display: 'flex', justifyContent: 'space-between', color: '#94A3B8', fontFamily: mono, fontSize: 17, letterSpacing: 1}}><span>{topic.series}</span><span>By {topic.creator}</span></div>;
}

function SceneHeader({eyebrow, title, color, opacity = 1}: {eyebrow: string; title: string; color: string; opacity?: number}) {
  return <div style={{opacity, textAlign: 'center', fontFamily: font}}>
    <div style={{color, fontFamily: mono, fontSize: 19, letterSpacing: 4, fontWeight: 700, marginBottom: 24}}>{eyebrow}</div>
    <div style={{color: '#F8FAFC', fontSize: 61, lineHeight: 1.05, fontWeight: 900, letterSpacing: -2}}>{title}</div>
  </div>;
}

export const FrontendInMotion: React.FC<{topic: TopicConfig}> = ({topic}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const layoutScale = topic.height / 1920;
  const seconds = frame / fps;
  const seed = topic.motionSeed || 1;
  const pulse = 0.92 + Math.sin((frame + seed) / (6 + seed % 5)) * 0.04;
  const drift = Math.sin((frame + seed) / 24) * (10 + seed % 18);
  const scene = (start: number, end: number) => seconds >= start && seconds < end;
  const glow = `radial-gradient(circle at ${35 + Math.sin((frame + seed) / 40) * 12}% ${25 + Math.cos((frame + seed) / 50) * 8}%, ${topic.colors.blue}35 0%, transparent 34%), radial-gradient(circle at 80% 70%, ${topic.colors.purple}28 0%, transparent 30%)`;

  return <AbsoluteFill style={{background: topic.background, color: topic.colors.white, fontFamily: font, overflow: 'hidden'}}>
    {topic.audio.musicPath ? <Audio src={topic.audio.musicPath} volume={0.22} /> : null}
    <AbsoluteFill style={{backgroundImage: glow}} />
    <div style={{position: 'absolute', inset: 0, opacity: 0.2, backgroundImage: `linear-gradient(${topic.colors.blue}18 1px, transparent 1px), linear-gradient(90deg, ${topic.colors.blue}18 1px, transparent 1px)`, backgroundSize: `${70 + seed % 30}px ${70 + seed % 30}px`, transform: `translate(${drift}px, ${(frame % 80) * 0.35}px)`}} />
    <div style={{position: 'relative', width: 1080, height: 1920, transform: `scale(${layoutScale})`, transformOrigin: 'top left', padding: '135px 70px'}}>
      {scene(0, 3) && <div style={{height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 80}}>
        <SceneHeader eyebrow={topic.series.toUpperCase()} title={topic.scenes[0].title} color={topic.colors.blue} />
        <div style={{display: 'flex', gap: 18, marginTop: 145, transform: `scale(${pulse})`}}>
          {topic.visualLabels.map((label, i) => {
            const color = i === 0 ? topic.colors.blue : i === 1 ? topic.colors.purple : topic.colors.white;
            return <div key={label} style={{width: 190, height: 210, borderRadius: 22, border: `2px solid ${color}`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, fontWeight: 900, boxShadow: `0 0 40px ${color}55`, opacity: fade(frame, i * 12, 35 + i * 5), transform: `translateY(${rise(frame, i * 8, 35 + i * 5)}px) rotate(${Math.sin((frame + seed + i * 20) / 20) * 3}deg)`}}>{label}</div>;
          })}
        </div>
      </div>}
      {scene(3, 9) && <div style={{paddingTop: 45, opacity: fade(frame, 90, 105)}}>
        <SceneHeader eyebrow="01 / THE BUILDING BLOCK" title="HTML = STRUCTURE" color="#FF6B6B" />
        <div style={{display: 'flex', flexDirection: 'column', gap: 28, marginTop: 70, alignItems: 'center'}}>
          <Website styled={false} topic={topic} />
          <CodeBlock code={topic.htmlCode} color={topic.colors.blue} />
        </div>
      </div>}
      {scene(9, 15) && <div style={{paddingTop: 45, opacity: fade(frame, 270, 285)}}>
        <SceneHeader eyebrow="02 / THE VISUAL LAYER" title="CSS = STYLE" color={topic.colors.purple} />
        <div style={{display: 'flex', flexDirection: 'column', gap: 28, marginTop: 70, alignItems: 'center'}}>
          <Website styled topic={topic} />
          <CodeBlock code={topic.cssCode} color={topic.colors.purple} />
        </div>
      </div>}
      {scene(15, 21) && <div style={{paddingTop: 45, opacity: fade(frame, 450, 465)}}>
        <SceneHeader eyebrow="03 / MAKE IT RESPOND" title="JAVASCRIPT = INTERACTION" color={topic.colors.blue} />
        <div style={{display: 'flex', flexDirection: 'column', gap: 28, marginTop: 55, alignItems: 'center'}}>
          <div style={{position: 'relative'}}><Website styled clicked={seconds > 18.2} topic={topic} /><div style={{position: 'absolute', left: seconds > 18.2 ? 390 : 250, top: seconds > 18.2 ? 155 : 178, fontSize: 50, transform: `scale(${spring({frame: frame - 500, fps, config: {damping: 12}})})`}}>⌁</div></div>
          <CodeBlock code={topic.javascriptCode} color={topic.colors.blue} />
        </div>
      </div>}
      {scene(21, 25) && <div style={{paddingTop: 180, textAlign: 'center', opacity: fade(frame, 630, 645)}}>
        <div style={{fontFamily: mono, color: topic.colors.blue, fontSize: 20, letterSpacing: 4, marginBottom: 36}}>THE COMPLETE PICTURE</div>
        <div style={{fontSize: 59, fontWeight: 900, lineHeight: 1.15}}>STRUCTURE<br/><span style={{color: topic.colors.purple}}>+</span> STYLE <span style={{color: topic.colors.purple}}>+</span><br/><span style={{color: topic.colors.blue}}>INTERACTION</span></div>
        <div style={{display: 'flex', justifyContent: 'center', gap: 18, marginTop: 90}}>{['HTML', 'CSS', 'JS'].map((x, i) => <div key={x} style={{padding: '18px 30px', borderRadius: 99, border: `1px solid ${[ '#FF6B6B', topic.colors.purple, topic.colors.blue][i]}`, color: [ '#FF6B6B', topic.colors.purple, topic.colors.blue][i], fontFamily: mono, fontWeight: 700}}>{x}</div>)}</div>
      </div>}
      {scene(25, 28) && <div style={{paddingTop: 115, opacity: fade(frame, 750, 765)}}>
        <SceneHeader eyebrow="QUICK CHECK" title={topic.quiz.question} color={topic.colors.purple} />
        <div style={{display: 'flex', flexDirection: 'column', gap: 22, margin: '85px auto 0', width: 650}}>{topic.quiz.options.map((option, i) => <div key={option} style={{padding: '23px 30px', borderRadius: 16, border: `2px solid ${option === topic.quiz.answer && seconds > 27 ? topic.colors.blue : '#273653'}`, background: option === topic.quiz.answer && seconds > 27 ? '#168BFF22' : '#0D1428', color: option === topic.quiz.answer && seconds > 27 ? '#fff' : '#CBD5E1', fontSize: 29, fontWeight: 700, transform: `translateX(${interpolate(frame, [750 + i * 10, 775 + i * 10], [80, 0], clamp)}px)`, opacity: fade(frame, 750 + i * 10, 775 + i * 10)}}>{option}{option === topic.quiz.answer && seconds > 27 && <span style={{float: 'right', color: topic.colors.blue}}>✓</span>}</div>)}</div>
      </div>}
      {scene(28, 30) && <div style={{height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', textAlign: 'center', opacity: fade(frame, 840, 855)}}>
        <div style={{width: 180, height: 180, display: 'grid', placeItems: 'center', borderRadius: 48, border: `3px solid ${topic.colors.blue}`, boxShadow: `0 0 55px ${topic.colors.blue}66`, fontSize: 48, fontWeight: 900, letterSpacing: -3, background: `linear-gradient(135deg, ${topic.colors.blue}, ${topic.colors.purple})`, WebkitBackgroundClip: 'text', color: 'transparent', transform: `rotate(${interpolate(frame, [840, 900], [0, 360], clamp)}deg) scale(${interpolate(frame, [840, 870, 900], [0.5, 1.08, 1], clamp)})`}}>{topic.logoText}</div>
        <div style={{fontSize: 70, fontWeight: 900, letterSpacing: -3, background: `linear-gradient(90deg, ${topic.colors.blue}, ${topic.colors.purple})`, WebkitBackgroundClip: 'text', color: 'transparent'}}>Frontend<br/>in Motion</div>
        <div style={{fontFamily: mono, fontSize: 25, marginTop: 35, color: '#CBD5E1'}}>By {topic.creator}</div>
        <div style={{fontSize: 22, color: '#94A3B8', marginTop: 95}}>Comment your answer and follow for more.</div>
        <div style={{marginTop: 45, width: 100, height: 8, borderRadius: 8, background: 'linear-gradient(90deg, #168BFF, #8B5CF6)', transform: `scaleX(${interpolate(frame, [840, 890], [0, 1], clamp)})`}} />
      </div>}
      <Brand topic={topic} />
    </div>
  </AbsoluteFill>;
};
