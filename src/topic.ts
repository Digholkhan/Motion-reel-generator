export type Scene = {
  id?: string;
  start: number;
  end: number;
  title: string;
  durationInSeconds?: number;
  visualType?: import('./storyboard').VisualType;
};

export type TopicConfig = {
  title: string;
  prompt?: string;
  durationInSeconds: number;
  fps: number;
  width: number;
  height: number;
  background: string;
  colors: {blue: string; purple: string; white: string; muted: string};
  creator: string;
  series: string;
  tagline: string;
  logoText: string;
  visualLabels: string[];
  motionSeed: number;
  visualVariant: 'orbit' | 'cards' | 'waves' | 'focus';
  scenes: Scene[];
  htmlCode: string;
  cssCode: string;
  javascriptCode: string;
  quiz: {question: string; options: string[]; answer: string};
  caption: string;
  hashtags: string[];
  audio: {musicPath?: string; typingPath?: string; clickPath?: string; whooshPath?: string};
};

export const topic: TopicConfig = {
  title: 'HTML vs CSS vs JavaScript',
  durationInSeconds: 30,
  fps: 30,
  width: 1080,
  height: 1350,
  background: '#080D1C',
  colors: {blue: '#168BFF', purple: '#8B5CF6', white: '#F8FAFC', muted: '#94A3B8'},
  creator: 'Md Mohiuddin',
  series: 'Frontend in Motion',
  tagline: 'Learn. Build. Grow.',
  logoText: 'MM',
  visualLabels: ['HTML', 'CSS', 'JS'],
  motionSeed: 17,
  visualVariant: 'orbit',
  scenes: [
    {start: 0, end: 3, title: 'A WEBSITE HAS 3 SUPERPOWERS'},
    {start: 3, end: 9, title: 'HTML = STRUCTURE'},
    {start: 9, end: 15, title: 'CSS = STYLE'},
    {start: 15, end: 21, title: 'JAVASCRIPT = INTERACTION'},
    {start: 21, end: 25, title: 'STRUCTURE + STYLE + INTERACTION'},
    {start: 25, end: 28, title: 'QUIZ'},
    {start: 28, end: 30, title: 'FRONTEND IN MOTION'},
  ],
  htmlCode: '<h1>Welcome</h1>\n<p>Learn frontend.</p>\n<button>Start learning</button>',
  cssCode: 'button {\n  background: linear-gradient(90deg, #168BFF, #8B5CF6);\n  border-radius: 12px;\n  color: white;\n}',
  javascriptCode: "const button = document.querySelector('button');\nbutton.addEventListener('click', () => {\n  button.textContent = 'You clicked!';\n});",
  quiz: {
    question: 'Which technology adds interactivity?',
    options: ['A. HTML', 'B. CSS', 'C. JavaScript'],
    answer: 'C. JavaScript',
  },
  caption: 'HTML builds it. CSS styles it. JavaScript brings it to life. Which superpower are you learning today?',
  hashtags: ['#FrontendInMotion', '#HTML', '#CSS', '#JavaScript', '#WebDevelopment'],
  audio: {},
};
