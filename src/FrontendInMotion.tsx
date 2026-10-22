import React from 'react';
import {AbsoluteFill, Audio, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import type {TopicConfig} from './topic';
import {createStoryboard, type ScenePlan} from './storyboard';

const font = 'Arial, Helvetica, sans-serif';
const mono = '"Cascadia Code", "SFMono-Regular", Consolas, monospace';
const clamp = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};

function SceneRenderer({scene, topic, localFrame}: {scene: ScenePlan; topic: TopicConfig; localFrame: number}) {
  const {fps} = useVideoConfig();
  const progress = interpolate(localFrame, [0, Math.max(1, scene.durationInSeconds * fps * 0.28)], [0, 1], clamp);
  const exit = interpolate(localFrame, [Math.max(1, scene.durationInSeconds * fps - scene.transitionOut.durationInSeconds * fps), scene.durationInSeconds * fps], [1, 0], clamp);
  const angle = scene.animation.motion === 'orbit' ? localFrame * 2.2 : scene.animation.motion === 'drift' ? Math.sin(localFrame / 18) * 10 : 0;
  const offset = scene.animation.motion === 'slide' ? interpolate(localFrame, [0, 25], [120, 0], clamp) : interpolate(localFrame, [0, 25], [45, 0], clamp);
  const accent = scene.composition.accent;
  const isParticle = scene.visualType === 'particle';
  const isDiagram = scene.visualType === 'diagram' || scene.visualType === 'timeline';
  const lines = topic.javascriptCode.split('\n').slice(0, 5);
  return (
    <div style={{position: 'absolute', inset: 0, opacity: exit, textAlign: scene.composition.align, transform: `translateX(${scene.composition.align === 'left' ? offset : 0}px) scale(${0.96 + progress * 0.04})`, padding: '150px 80px'}}>
      {isParticle && <div style={{position: 'absolute', inset: -200, background: `radial-gradient(circle at 30% 30%, ${accent}66, transparent 20%), radial-gradient(circle at 70% 70%, ${topic.colors.purple}55, transparent 24%)`, transform: `rotate(${angle}deg)`}} />}
      <div style={{position: 'relative', zIndex: 1}}>
        <div style={{fontFamily: mono, letterSpacing: 4, fontSize: 18, color: accent, fontWeight: 800, marginBottom: 24}}>SCENE {scene.id.replace('scene-', '')} / {scene.visualType.toUpperCase()}</div>
        <div style={{fontSize: 62, lineHeight: 1.05, fontWeight: 900, maxWidth: 880, color: topic.colors.white, transform: `translateY(${offset}px)`, opacity: progress}}>{scene.title}</div>
        {scene.visualType === 'code' && <div style={{marginTop: 70, maxWidth: 850, padding: 28, border: `1px solid ${accent}88`, borderRadius: 18, background: '#0D1428', color: '#DCE7FA', fontFamily: mono, fontSize: 21, lineHeight: 1.55, textAlign: 'left'}}>{lines.map((line, index) => <div key={`${line}-${index}`} style={{opacity: interpolate(localFrame, [index * 10, index * 10 + 18], [0, 1], clamp)}}><span style={{color: accent, marginRight: 18}}>{String(index + 1).padStart(2, '0')}</span>{line}</div>)}</div>}
        {isDiagram && <div style={{display: 'flex', justifyContent: scene.composition.align, alignItems: 'center', gap: 24, marginTop: 85, transform: `translateX(${Math.sin(localFrame / 16) * 8}px)`}}>{scene.elements.map((element, index) => <React.Fragment key={element}><div style={{width: 170, minHeight: 100, display: 'grid', placeItems: 'center', padding: 18, border: `2px solid ${index % 2 ? topic.colors.purple : accent}`, borderRadius: scene.visualType === 'timeline' ? 14 : 70, color: topic.colors.white, fontWeight: 800, background: '#0D1428', opacity: interpolate(localFrame, [index * 12, index * 12 + 22], [0, 1], clamp), transform: `scale(${spring({frame: localFrame - index * 10, fps, config: {damping: 14}})})`}}>{element.toUpperCase()}</div>{index < scene.elements.length - 1 && <div style={{fontSize: 38, color: accent, opacity: progress}}>-&gt;</div>}</React.Fragment>)}</div>}
        {scene.visualType === 'kinetic-typography' && <div style={{display: 'flex', justifyContent: scene.composition.align, gap: 18, marginTop: 80}}>{scene.elements.map((element, index) => <div key={element} style={{padding: '20px 28px', borderRadius: scene.composition.depth ? 18 : 99, border: `2px solid ${index % 2 ? topic.colors.purple : accent}`, color: topic.colors.white, fontFamily: mono, fontWeight: 800, transform: `translateY(${Math.sin((localFrame + index * 20) / 16) * scene.animation.intensity * 8}px) rotate(${angle / 8}deg)`, opacity: interpolate(localFrame, [index * 9, index * 9 + 20], [0, 1], clamp)}}>{element.toUpperCase()}</div>)}</div>}
        {isParticle && <div style={{marginTop: 85, fontFamily: mono, color: topic.colors.muted, fontSize: 22}}>Depth {scene.composition.depth + 1} / Camera {scene.animation.motion}</div>}
      </div>
    </div>
  );
}

export const FrontendInMotion: React.FC<{topic: TopicConfig}> = ({topic}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const storyboard = createStoryboard(topic.prompt || topic.title, topic, topic.motionSeed);
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
      <div style={{position: 'absolute', bottom: 46, left: 70, right: 70, display: 'flex', justifyContent: 'space-between', color: topic.colors.muted, fontFamily: mono, fontSize: 17, letterSpacing: 1}}><span>{topic.series}</span><span>By {topic.creator}</span></div>
    </AbsoluteFill>
  );
};
