import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';
import {randomUUID} from 'node:crypto';
import {mkdir, rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {validateStoryboard, type Storyboard} from '../src/storyboard';
import {topic as defaultTopic, type TopicConfig} from '../src/topic';

let bundlePromise: Promise<string> | undefined;

const getBundle = () => {
  bundlePromise ??= bundle({
    entryPoint: path.resolve(process.cwd(), 'src/index.tsx'),
    webpackOverride: (config) => config,
  });
  return bundlePromise;
};

const topicFor = (storyboard: Storyboard): TopicConfig => ({
  ...defaultTopic,
  title: storyboard.title,
  prompt: storyboard.prompt,
  storyboard: validateStoryboard(storyboard),
  durationInSeconds: storyboard.settings.durationInSeconds,
  fps: storyboard.settings.fps,
  width: storyboard.settings.width,
  height: storyboard.settings.height,
  motionSeed: storyboard.seed,
});

export async function renderStoryboardVideo(storyboard: Storyboard): Promise<{filePath: string; fileName: string}> {
  const validated = validateStoryboard(storyboard);
  const serveUrl = await getBundle();
  const composition = await selectComposition({
    serveUrl,
    id: 'FrontendInMotionEpisode01',
    inputProps: {topic: topicFor(validated)},
  });
  const outputDirectory = path.join(os.tmpdir(), 'frontend-in-motion-renders');
  const fileName = `frontend-in-motion-${randomUUID()}.mp4`;
  const filePath = path.join(outputDirectory, fileName);
  await mkdir(outputDirectory, {recursive: true});
  try {
    await renderMedia({
      composition,
      serveUrl,
      codec: 'h264',
      outputLocation: filePath,
      inputProps: {topic: topicFor(validated)},
      audioCodec: 'aac',
    });
    return {filePath, fileName};
  } catch (error) {
    await rm(filePath, {force: true});
    throw error;
  }
}
