import {describe, expect, it} from 'vitest';
import {createStoryboard, validateStoryboard} from './storyboard';
import {topic} from './topic';

describe('storyboard planning', () => {
  it('creates materially different plans for space and security prompts', () => {
    const space = createStoryboard('A cinematic journey through a futuristic galaxy', topic, 11);
    const security = createStoryboard('Explain how phishing works through a suspicious email', topic, 11);
    expect(space.scenes.map((scene) => scene.visualType)).not.toEqual(security.scenes.map((scene) => scene.visualType));
    expect(space.scenes[0].elements).toContain('planet');
    expect(security.scenes[1].elements).toContain('link');
  });

  it('calculates scene timing and total duration', () => {
    const storyboard = createStoryboard('Explain React state with code', topic, 20);
    expect(storyboard.scenes[0].start).toBe(0);
    expect(storyboard.scenes.at(-1)?.end).toBe(storyboard.settings.durationInSeconds);
    expect(storyboard.settings.durationInSeconds * storyboard.settings.fps).toBe(900);
  });

  it('rejects unsupported visual types', () => {
    const storyboard = createStoryboard('Explain React state', topic, 20);
    storyboard.scenes[0].visualType = 'unsupported' as never;
    expect(() => validateStoryboard(storyboard)).toThrow('Unsupported visual type');
  });

  it('is deterministic for the same prompt and seed', () => {
    expect(createStoryboard('Explain React state', topic, 20)).toEqual(createStoryboard('Explain React state', topic, 20));
  });
});
