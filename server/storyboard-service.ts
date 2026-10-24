import {GoogleGenAI, Type} from '@google/genai';
import {createStoryboard, validateStoryboard, type Storyboard} from '../src/storyboard';
import {topic as defaultTopic} from '../src/topic';

export type StoryboardRequest = {
  prompt: string;
  durationInSeconds?: number;
  fps?: number;
  width?: number;
  height?: number;
  visualStyle?: string;
  instructions?: string;
  previousStoryboard?: Pick<Storyboard, 'title' | 'creativeDirection' | 'scenes'>;
};

export type StoryboardProvider = 'gemini' | 'mock';
export const MAX_BODY_BYTES = 20000;
const MAX_PROMPT_LENGTH = 8000;
const MAX_INSTRUCTIONS_LENGTH = 4000;
const MAX_SCENES = 12;
const DEFAULT_MODEL = 'gemini-3.5-flash-lite';

const sceneSchema = {
  type: Type.OBJECT,
  properties: {
    id: {type: Type.STRING},
    start: {type: Type.NUMBER},
    end: {type: Type.NUMBER},
    title: {type: Type.STRING},
    durationInSeconds: {type: Type.NUMBER},
    visualType: {type: Type.STRING, enum: ['kinetic-typography', 'code', 'diagram', 'data', 'particle', 'timeline']},
    narrativePurpose: {type: Type.STRING},
    visualDescription: {type: Type.STRING},
    composition: {type: Type.OBJECT, properties: {
      align: {type: Type.STRING, enum: ['center', 'left', 'right']},
      layout: {type: Type.STRING, enum: ['center-stack', 'split-screen', 'editor', 'orbit', 'network', 'timeline', 'dashboard']},
      accent: {type: Type.STRING},
      scale: {type: Type.NUMBER},
      depth: {type: Type.NUMBER},
    }, required: ['align', 'layout', 'accent', 'scale', 'depth']},
    animation: {type: Type.OBJECT, properties: {
      motion: {type: Type.STRING, enum: ['reveal', 'orbit', 'draw', 'drift', 'slide', 'pulse', 'zoom']},
      intensity: {type: Type.NUMBER},
      reveal: {type: Type.STRING, enum: ['line', 'word', 'shape']},
    }, required: ['motion', 'intensity', 'reveal']},
    transitionOut: {type: Type.OBJECT, properties: {
      type: {type: Type.STRING, enum: ['cut', 'fade', 'wipe', 'zoom']},
      durationInSeconds: {type: Type.NUMBER},
    }, required: ['type', 'durationInSeconds']},
    elements: {type: Type.ARRAY, items: {type: Type.STRING}},
  },
  required: ['id', 'title', 'durationInSeconds', 'visualType', 'narrativePurpose', 'visualDescription', 'composition', 'animation', 'transitionOut', 'elements'],
};

export const storyboardSchema = {
  type: Type.OBJECT,
  properties: {
    title: {type: Type.STRING},
    prompt: {type: Type.STRING},
    creativeDirection: {type: Type.OBJECT, properties: {
      visualStyle: {type: Type.STRING},
      colorPalette: {type: Type.ARRAY, items: {type: Type.STRING}},
      pacing: {type: Type.STRING, enum: ['calm', 'dynamic', 'cinematic']},
      mood: {type: Type.STRING},
    }, required: ['visualStyle', 'colorPalette', 'pacing', 'mood']},
    settings: {type: Type.OBJECT, properties: {
      fps: {type: Type.NUMBER},
      width: {type: Type.NUMBER},
      height: {type: Type.NUMBER},
      durationInSeconds: {type: Type.NUMBER},
    }, required: ['fps', 'width', 'height', 'durationInSeconds']},
    scenes: {type: Type.ARRAY, items: sceneSchema},
    seed: {type: Type.INTEGER},
  },
  required: ['title', 'prompt', 'creativeDirection', 'settings', 'scenes', 'seed'],
};

const systemPrompt = `You are the Creative Director for a Remotion motion-video renderer.
Return only JSON matching the supplied schema. Do not return markdown, HTML, JavaScript, URLs, or executable code.
Interpret the user's prompt literally and build a distinct visual treatment around its subject, requested actions, setting, tone, and sequence. Do not reuse a generic educational reel, title-first sequence, four-scene structure, stock labels, or unrelated branding.
Choose topic-specific visual types, narrative progression, composition, motion, transitions, and elements. Scene titles and elements must describe the requested subject, not generic placeholders.
The renderer supports kinetic-typography, code, diagram, data, particle, and timeline. The visual instructions must affect the rendered scene, not only its text.
Use 1-${MAX_SCENES} scenes; choose the count and ordering from the prompt instead of defaulting to four scenes. Keep the requested visual style and explicit constraints higher priority than generic creativity.
Use a stable integer seed derived from the prompt.`;

export const assertRequest = (request: StoryboardRequest) => {
  if (!request || typeof request.prompt !== 'string' || !request.prompt.trim()) throw new Error('A non-empty prompt is required.');
  if (request.prompt.length > MAX_PROMPT_LENGTH) throw new Error(`Prompt must be ${MAX_PROMPT_LENGTH} characters or fewer.`);
  if (request.instructions && request.instructions.length > MAX_INSTRUCTIONS_LENGTH) throw new Error(`Instructions must be ${MAX_INSTRUCTIONS_LENGTH} characters or fewer.`);
  if ((request.durationInSeconds ?? 30) < 1 || (request.durationInSeconds ?? 30) > 180) throw new Error('Duration must be between 1 and 180 seconds.');
  if ((request.fps ?? 30) < 1 || (request.fps ?? 30) > 60) throw new Error('FPS must be between 1 and 60.');
  for (const value of [request.width ?? 1080, request.height ?? 1350]) {
    if (!Number.isInteger(value) || value < 256 || value > 4096) throw new Error('Video dimensions must be integers between 256 and 4096.');
  }
};

const fitDuration = (storyboard: Storyboard, durationInSeconds: number) => {
  const sourceDuration = storyboard.scenes.reduce((total, scene) => total + scene.durationInSeconds, 0);
  if (!Number.isFinite(sourceDuration) || sourceDuration <= 0) throw new Error('The AI storyboard has no usable scene duration.');
  const scale = durationInSeconds / sourceDuration;
  return {...storyboard, settings: {...storyboard.settings, durationInSeconds}, scenes: storyboard.scenes.map((scene) => ({...scene, durationInSeconds: scene.durationInSeconds * scale}))};
};

const mockStoryboard = (request: StoryboardRequest) => createStoryboard(request.prompt, {
  ...defaultTopic,
  fps: request.fps ?? defaultTopic.fps,
  width: request.width ?? defaultTopic.width,
  height: request.height ?? defaultTopic.height,
}, 17);

const wait = (milliseconds: number) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

const promptFor = (request: StoryboardRequest) => JSON.stringify({
  prompt: request.prompt,
  settings: {durationInSeconds: request.durationInSeconds ?? 30, fps: request.fps ?? 30, width: request.width ?? 1080, height: request.height ?? 1350},
  visualStyle: request.visualStyle || 'Choose the most suitable style for the topic.',
  instructions: request.instructions || '',
  previousStoryboard: request.previousStoryboard || null,
});

export async function generateStoryboard(request: StoryboardRequest, env: NodeJS.ProcessEnv, client?: GoogleGenAI): Promise<{storyboard: Storyboard; provider: StoryboardProvider; model: string}> {
  assertRequest(request);
  const model = env.GEMINI_MODEL || DEFAULT_MODEL;
  if ((env.STORYBOARD_PROVIDER || 'gemini') === 'mock') {
    return {storyboard: validateStoryboard(fitDuration(mockStoryboard(request), request.durationInSeconds ?? 30)), provider: 'mock', model: 'local-deterministic'};
  }
  if (!env.GEMINI_API_KEY) throw new Error('Gemini storyboard generation is not configured. Set GEMINI_API_KEY on the server.');
  const gemini = client || new GoogleGenAI({apiKey: env.GEMINI_API_KEY});
  try {
    let response;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        response = await gemini.models.generateContent({
          model,
          contents: `${systemPrompt}\n\nRequest:\n${promptFor(request)}`,
          config: {responseMimeType: 'application/json', responseJsonSchema: storyboardSchema, temperature: 0.8, abortSignal: AbortSignal.timeout(30000)},
        });
        break;
      } catch (error) {
        const status = error instanceof Error && 'status' in error ? (error as {status?: number}).status : undefined;
        if ((status !== 429 && status !== 503) || attempt === 2) throw error;
        await wait(700 * (attempt + 1));
      }
    }
    if (!response) throw new Error('Gemini did not return a response.');
    if (!response.text) throw new Error('Gemini returned an empty storyboard.');
    const storyboard = fitDuration(JSON.parse(response.text) as Storyboard, request.durationInSeconds ?? 30);
    if (storyboard.scenes.length > MAX_SCENES) throw new Error(`Gemini storyboard contains more than ${MAX_SCENES} scenes.`);
    return {storyboard: validateStoryboard(storyboard), provider: 'gemini', model};
  } catch (error) {
    if (error instanceof SyntaxError) throw new Error('Gemini returned invalid JSON.');
    throw error;
  }
}
