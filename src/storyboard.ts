import type {TopicConfig, Scene} from './topic';

export type VisualType = 'kinetic-typography' | 'code' | 'diagram' | 'data' | 'particle' | 'timeline';
export type MotionType = 'reveal' | 'orbit' | 'draw' | 'drift' | 'slide' | 'pulse' | 'zoom';
export type TransitionType = 'cut' | 'fade' | 'wipe' | 'zoom';

export type ScenePlan = Omit<Scene, 'id' | 'durationInSeconds'> & {
  id: string;
  durationInSeconds: number;
  visualType: VisualType;
  narrativePurpose: string;
  visualDescription: string;
  composition: {
    align: 'center' | 'left' | 'right';
    accent: string;
    scale: number;
    depth: number;
  };
  animation: {
    motion: MotionType;
    intensity: number;
    reveal: 'line' | 'word' | 'shape';
  };
  transitionOut: {type: TransitionType; durationInSeconds: number};
  elements: string[];
};

export type Storyboard = {
  title: string;
  prompt: string;
  creativeDirection: {
    visualStyle: string;
    colorPalette: string[];
    pacing: 'calm' | 'dynamic' | 'cinematic';
    mood: string;
  };
  settings: Pick<TopicConfig, 'fps' | 'width' | 'height'> & {durationInSeconds: number};
  scenes: ScenePlan[];
  seed: number;
};

const visualTypes: VisualType[] = ['kinetic-typography', 'code', 'diagram', 'data', 'particle', 'timeline'];
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function validateStoryboard(storyboard: Storyboard): Storyboard {
  if (!storyboard.scenes.length) throw new Error('Storyboard must contain at least one scene.');
  if (!Number.isFinite(storyboard.settings.fps) || storyboard.settings.fps < 1 || storyboard.settings.fps > 60) {
    throw new Error('Storyboard fps must be between 1 and 60.');
  }
  if (!Number.isFinite(storyboard.settings.durationInSeconds) || storyboard.settings.durationInSeconds < 1 || storyboard.settings.durationInSeconds > 180) {
    throw new Error('Storyboard duration must be between 1 and 180 seconds.');
  }
  let total = 0;
  for (const scene of storyboard.scenes) {
    if (!visualTypes.includes(scene.visualType)) throw new Error(`Unsupported visual type: ${scene.visualType}`);
    if (!Number.isFinite(scene.durationInSeconds) || scene.durationInSeconds <= 0) {
      throw new Error(`Scene ${scene.id} has an invalid duration.`);
    }
    scene.composition.scale = clamp(scene.composition.scale, 0.5, 2);
    scene.animation.intensity = clamp(scene.animation.intensity, 0, 2);
    scene.transitionOut.durationInSeconds = clamp(scene.transitionOut.durationInSeconds, 0, scene.durationInSeconds / 2);
    scene.start = total;
    total += scene.durationInSeconds;
    scene.end = total;
  }
  storyboard.settings.durationInSeconds = total;
  return storyboard;
}

const hash = (value: string) => [...value].reduce((result, character) => ((result * 31) + character.charCodeAt(0)) >>> 0, 17);
const has = (prompt: string, words: string[]) => words.some((word) => prompt.includes(word));

export function createStoryboard(prompt: string, base: TopicConfig, seed = hash(prompt)): Storyboard {
  const normalized = prompt.toLowerCase();
  const isSpace = has(normalized, ['space', 'galaxy', 'planet', 'nebula', 'orbit']);
  const isSecurity = has(normalized, ['phishing', 'cybersecurity', 'security', 'suspicious email', 'attack']);
  const isCode = has(normalized, ['code', 'react', 'javascript', 'state', 'program', 'developer']);
  const palette = isSpace ? ['#07152E', '#5EE7F2', '#8B5CF6'] : isSecurity ? ['#180D1B', '#FB7185', '#F59E0B'] : [base.background, base.colors.blue, base.colors.purple];
  const title = prompt.trim() || base.title;
  const type = isSpace ? 'particle' : isSecurity ? 'diagram' : isCode ? 'code' : visualTypes[seed % visualTypes.length];
  const sceneTypes: VisualType[] = isSpace
    ? ['particle', 'particle', 'diagram', 'kinetic-typography']
    : isSecurity
      ? ['kinetic-typography', 'diagram', 'timeline', 'kinetic-typography']
      : ['kinetic-typography', type, 'diagram', 'kinetic-typography'];
  const titles = isSpace
    ? ['A JOURNEY THROUGH DEEP SPACE', 'WORLDS IN MOTION', 'ORBIT IS A DANCE', 'KEEP LOOKING UP']
    : isSecurity
      ? ['PHISHING LOOKS REAL', 'FOLLOW THE DECEPTIVE LINK', 'BREAK THE ATTACK PATH', 'PAUSE. CHECK. PROTECT.']
      : [title.toUpperCase().slice(0, 55), 'THE CORE IDEA', 'SEE THE CONNECTION', 'PUT IT INTO PRACTICE'];
  const durations = isSpace ? [7, 8, 8, 7] : [5, 8, 9, 8];
  const motions: MotionType[] = isSpace ? ['drift', 'orbit', 'orbit', 'zoom'] : isSecurity ? ['reveal', 'draw', 'slide', 'pulse'] : ['reveal', 'draw', 'slide', 'pulse'];
  const scenes: ScenePlan[] = sceneTypes.map((visualType, index) => ({
    id: `scene-${index + 1}`,
    start: 0,
    end: 0,
    title: titles[index],
    durationInSeconds: durations[index],
    visualType,
    narrativePurpose: index === 0 ? 'Establish the subject and promise' : index === 3 ? 'Resolve the message with a memorable takeaway' : 'Build the narrative with a concrete visual relationship',
    visualDescription: isSpace ? 'Layered celestial objects with depth and camera travel' : isSecurity ? 'A topic-specific threat path with actionable emphasis' : 'Prompt-specific explanation with configurable visual hierarchy',
    composition: {align: index % 2 ? 'left' : 'center', accent: palette[(index + 1) % palette.length], scale: 1 + ((seed + index) % 10) / 100, depth: index % 3},
    animation: {motion: motions[index], intensity: 0.8 + ((seed + index) % 5) / 10, reveal: visualType === 'code' ? 'line' : 'shape'},
    transitionOut: {type: index === 3 ? 'fade' : (['cut', 'wipe', 'zoom'] as TransitionType[])[(seed + index) % 3], durationInSeconds: 0.35},
    elements: isSpace ? ['planet', 'nebula', 'orbit'] : isSecurity ? ['email', 'link', 'warning'] : ['headline', 'concept', 'example'],
  }));
  return validateStoryboard({
    title,
    prompt,
    creativeDirection: {visualStyle: isSpace ? 'cinematic space' : isSecurity ? 'alert editorial' : isCode ? 'technical kinetic' : 'topic-driven motion', colorPalette: palette, pacing: isSpace ? 'cinematic' : 'dynamic', mood: isSecurity ? 'vigilant' : isSpace ? 'wonder' : 'educational'},
    settings: {fps: base.fps, width: base.width, height: base.height, durationInSeconds: 30},
    scenes,
    seed,
  });
}
