import React from 'react';
import {AbsoluteFill, Audio, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import type {TopicConfig} from './topic';
import {createStoryboard, type ScenePlan} from './storyboard';

const font = 'Arial, Helvetica, sans-serif';
const mono = '"Cascadia Code", "SFMono-Regular", Consolas, monospace';
const clamp = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};

function SceneRenderer({scene, topic, localFrame}: {scene: ScenePlan; topic: TopicConfig; localFrame: number}) {
  const {fps} = useVideoConfig();
  const durationFrames = Math.max(1, Math.round(scene.durationInSeconds * fps));
  const progress = interpolate(localFrame, [0, Math.max(1, durationFrames * 0.28)], [0.18, 1], clamp);
  const exitStart = Math.max(0, Math.min(durationFrames - 1, durationFrames - Math.round(scene.transitionOut.durationInSeconds * fps)));
  const exit = interpolate(localFrame, [exitStart, durationFrames], [1, 0], clamp);
  const angle = scene.animation.motion === 'orbit' ? localFrame * 2.2 : scene.animation.motion === 'drift' ? Math.sin(localFrame / 18) * 10 : 0;
  const offset = scene.animation.motion === 'slide' ? interpolate(localFrame, [0, 25], [120, 0], clamp) : interpolate(localFrame, [0, 25], [45, 0], clamp);
  const accent = scene.composition.accent;
  const layout = scene.composition.layout || (scene.visualType === 'code' ? 'editor' : scene.visualType === 'particle' ? 'orbit' : scene.visualType === 'diagram' ? 'network' : scene.visualType === 'timeline' ? 'timeline' : 'center-stack');
  const isParticle = scene.visualType === 'particle';
  const isDiagram = scene.visualType === 'diagram' || scene.visualType === 'timeline';
  const lines = topic.javascriptCode.split('\n').slice(0, 5);
  const split = layout === 'split-screen';
  const panelStyle = {padding: 26, border: `1px solid ${accent}88`, borderRadius: 18, background: '#0D1428', boxShadow: `0 20px 60px ${accent}18`};
  return (
    <div style={{position: 'absolute', inset: 0, opacity: exit, textAlign: scene.composition.align, transform: `translateX(${scene.composition.align === 'left' ? offset : 0}px) scale(${0.96 + progress * 0.04})`, padding: split ? '120px 70px' : '150px 80px'}}>
      {isParticle && <div style={{position: 'absolute', inset: -200, background: `radial-gradient(circle at 30% 30%, ${accent}66, transparent 20%), radial-gradient(circle at 70% 70%, ${topic.colors.purple}55, transparent 24%)`, transform: `rotate(${angle}deg) scale(${1 + scene.composition.depth * 0.08})`}} />}
      <div style={{position: 'relative', zIndex: 1}}>
        <div style={{fontFamily: mono, letterSpacing: 2, fontSize: 17, color: accent, fontWeight: 700, marginBottom: 24}}>{scene.narrativePurpose}</div>
        {split ? <div style={{display: 'grid', gridTemplateColumns: '0.8fr 1.2fr', gap: 42, alignItems: 'center'}}>
          <div><div style={{fontSize: 48, lineHeight: 1.05, fontWeight: 900, color: topic.colors.white, opacity: progress}}>{scene.title}</div><div style={{marginTop: 28, color: topic.colors.muted, fontSize: 22}}>{scene.visualDescription}</div></div>
          <div style={{...panelStyle, minHeight: 320}}>{scene.elements.map((element, index) => <div key={`${element}-${index}`} style={{padding: '16px 20px', marginBottom: 12, borderLeft: `4px solid ${index % 2 ? topic.colors.purple : accent}`, color: topic.colors.white, opacity: interpolate(localFrame, [index * 10, index * 10 + 20], [0, 1], clamp), transform: `translateX(${interpolate(localFrame, [index * 10, index * 10 + 20], [40, 0], clamp)}px)`}}>{element.toUpperCase()}</div>)}</div>
        </div> : <div style={{fontSize: layout === 'editor' ? 52 : 62, lineHeight: 1.05, fontWeight: 900, maxWidth: 880, color: topic.colors.white, transform: `translateY(${offset}px)`, opacity: progress}}>{scene.title}</div>}
        {scene.visualType === 'code' && <div style={{...panelStyle, marginTop: 70, maxWidth: 850, color: '#DCE7FA', fontFamily: mono, fontSize: 21, lineHeight: 1.55, textAlign: 'left'}}><div style={{display: 'flex', gap: 8, marginBottom: 22}}>{[accent, topic.colors.purple, '#F59E0B'].map((color) => <span key={color} style={{width: 12, height: 12, borderRadius: 99, background: color}} />)}</div>{lines.map((line, index) => <div key={`${line}-${index}`} style={{opacity: interpolate(localFrame, [index * 10, index * 10 + 18], [0, 1], clamp), background: index === Math.floor(progress * lines.length) ? `${accent}18` : 'transparent'}}><span style={{color: accent, marginRight: 18}}>{String(index + 1).padStart(2, '0')}</span>{line}</div>)}</div>}
        {isDiagram && <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: scene.composition.align, alignItems: 'center', gap: 18, marginTop: 85, transform: layout === 'network' ? `rotate(${Math.sin(localFrame / 24) * 1.5}deg)` : `translateX(${Math.sin(localFrame / 16) * 8}px)`}}>{scene.elements.map((element, index) => <React.Fragment key={`${element}-${index}`}><div style={{width: layout === 'network' ? 145 : 170, minHeight: layout === 'timeline' ? 74 : 100, display: 'grid', placeItems: 'center', padding: 18, border: `2px solid ${index % 2 ? topic.colors.purple : accent}`, borderRadius: layout === 'timeline' ? 14 : layout === 'network' ? 12 : 70, color: topic.colors.white, fontWeight: 800, background: '#0D1428', opacity: interpolate(localFrame, [index * 12, index * 12 + 22], [0.2, 1], clamp), transform: `scale(${spring({frame: localFrame - index * 10, fps, config: {damping: 14}})})`}}>{element.toUpperCase()}</div>{index < scene.elements.length - 1 && <div style={{fontSize: 38, color: accent, opacity: progress}}>{layout === 'network' ? '->' : '-&gt;'}</div>}</React.Fragment>)}</div>}
        {scene.visualType === 'data' && <div style={{...panelStyle, display: 'flex', alignItems: 'end', gap: 18, height: 270, marginTop: 70}}>{scene.elements.map((element, index) => <div key={`${element}-${index}`} style={{flex: 1, height: `${35 + ((index * 17 + scene.composition.depth * 11) % 55)}%`, background: `linear-gradient(180deg, ${accent}, ${topic.colors.purple})`, borderRadius: '10px 10px 2px 2px', opacity: progress, transform: `scaleY(${spring({frame: localFrame - index * 8, fps, config: {damping: 15}})})`, transformOrigin: 'bottom'}}><span style={{display: 'block', transform: 'translateY(-28px)', color: topic.colors.muted, fontSize: 14}}>{element}</span></div>)}</div>}
        {scene.visualType === 'kinetic-typography' && <div style={{display: 'flex', justifyContent: scene.composition.align, gap: 18, marginTop: 80}}>{scene.elements.map((element, index) => <div key={`${element}-${index}`} style={{padding: '20px 28px', borderRadius: layout === 'split-screen' ? 16 : scene.composition.depth ? 18 : 99, border: `2px solid ${index % 2 ? topic.colors.purple : accent}`, color: topic.colors.white, fontFamily: mono, fontWeight: 800, transform: `translateY(${Math.sin((localFrame + index * 20) / 16) * scene.animation.intensity * 8}px) rotate(${angle / 8}deg)`, opacity: interpolate(localFrame, [index * 9, index * 9 + 20], [0.2, 1], clamp)}}>{element.toUpperCase()}</div>)}</div>}
        {isParticle && <div style={{marginTop: 85, fontFamily: mono, color: topic.colors.muted, fontSize: 22}}>Depth {scene.composition.depth + 1} / Camera {scene.animation.motion}</div>}
      </div>
    </div>
  );
}

export const FrontendInMotion: React.FC<{topic: TopicConfig}> = ({topic}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const storyboard = topic.storyboard || createStoryboard(topic.prompt || topic.title, topic, topic.motionSeed);
  const seconds = frame / fps;
  const sceneIndex = storyboard.scenes.findIndex((scene) => seconds >= scene.start && seconds < scene.end);
  const activeScene = storyboard.scenes[Math.max(0, sceneIndex)];
  const localFrame = Math.max(0, frame - Math.round(activeScene.start * fps));
  const drift = Math.sin((frame + storyboard.seed) / 28) * 12;
  return (
    <AbsoluteFill style={{background: topic.background, color: topic.colors.white, fontFamily: font, overflow: 'hidden'}}>
      {topic.audio.musicPath ? <Audio src={topic.audio.musicPath} volume={0.22} /> : null}
      <AbsoluteFill style={{background: `radial-gradient(circle at ${35 + drift}% 25%, ${activeScene.composition.accent}30, transparent 30%), linear-gradient(135deg, ${topic.background}, #050812)`}} />
      <SceneRenderer scene={activeScene} topic={topic} localFrame={localFrame} />
    </AbsoluteFill>
  );
};
