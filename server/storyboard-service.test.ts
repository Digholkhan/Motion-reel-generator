import {GoogleGenAI} from '@google/genai';
import {describe, expect, it} from 'vitest';
import {generateStoryboard} from './storyboard-service';

const validResponse = {
  title: 'React state',
  prompt: 'Explain React state',
  creativeDirection: {visualStyle: 'technical kinetic', colorPalette: ['#080D1C', '#168BFF', '#8B5CF6'], pacing: 'dynamic', mood: 'educational'},
  settings: {fps: 30, width: 1080, height: 1350, durationInSeconds: 2},
  scenes: [{
    id: 'scene-1', start: 0, end: 0, title: 'STATE', durationInSeconds: 2, visualType: 'code',
    narrativePurpose: 'Introduce state', visualDescription: 'Progressive code reveal',
    composition: {align: 'center', accent: '#168BFF', scale: 1, depth: 0},
    animation: {motion: 'reveal', intensity: 1, reveal: 'line'},
    transitionOut: {type: 'fade', durationInSeconds: 0.2}, elements: ['state'],
  }],
  seed: 2,
};

const fakeClient = (text: string) => ({
  models: {generateContent: async () => ({text})},
}) as unknown as GoogleGenAI;

describe('Gemini storyboard service', () => {
  it('accepts and validates structured Gemini JSON', async () => {
    const result = await generateStoryboard({prompt: 'Explain React state', durationInSeconds: 2}, {GEMINI_API_KEY: 'test'}, fakeClient(JSON.stringify(validResponse)));
    expect(result.provider).toBe('gemini');
    expect(result.storyboard.scenes[0].visualType).toBe('code');
    expect(result.storyboard.scenes[0].end).toBe(2);
  });

  it('supports charge-free mock mode and labels it as mock', async () => {
    const result = await generateStoryboard({prompt: 'Explore a futuristic galaxy'}, {STORYBOARD_PROVIDER: 'mock'});
    expect(result.provider).toBe('mock');
    expect(result.storyboard.scenes[0].visualType).toBe('particle');
  });

  it('rejects invalid provider JSON', async () => {
    await expect(generateStoryboard({prompt: 'Explain React state'}, {GEMINI_API_KEY: 'test'}, fakeClient('{invalid'))).rejects.toThrow('invalid JSON');
  });

  it('surfaces missing configuration', async () => {
    await expect(generateStoryboard({prompt: 'Explain React state'}, {})).rejects.toThrow('GEMINI_API_KEY');
  });

  it('retries transient Gemini capacity errors', async () => {
    let attempts = 0;
    const retryingClient = {
      models: {generateContent: async () => {
        attempts += 1;
        if (attempts < 3) {
          const error = new Error('busy') as Error & {status?: number};
          error.status = 503;
          throw error;
        }
        return {text: JSON.stringify(validResponse)};
      }},
    } as unknown as GoogleGenAI;
    const result = await generateStoryboard({prompt: 'Explain React state', durationInSeconds: 2}, {GEMINI_API_KEY: 'test'}, retryingClient);
    expect(result.provider).toBe('gemini');
    expect(attempts).toBe(3);
  });
});
