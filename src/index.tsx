import {registerRoot, Composition} from 'remotion';
import {FrontendInMotion} from './FrontendInMotion';
import {topic} from './topic';

export const RemotionRoot = () => (
  <Composition
    id="FrontendInMotionEpisode01"
    component={FrontendInMotion}
    durationInFrames={topic.durationInSeconds * topic.fps}
    fps={topic.fps}
    width={topic.width}
    height={topic.height}
    defaultProps={{topic}}
  />
);

registerRoot(RemotionRoot);
