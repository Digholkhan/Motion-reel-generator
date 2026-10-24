import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import {rm} from 'node:fs/promises';
import {generateStoryboard, MAX_BODY_BYTES} from './storyboard-service';
import {renderStoryboardVideo} from './video-render-service';

const app = express();
const port = Number(process.env.API_PORT || 8787);
const allowedOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

app.disable('x-powered-by');
app.use(cors({origin: allowedOrigin}));
app.use(express.json({limit: MAX_BODY_BYTES}));
app.use(rateLimit({windowMs: 60_000, limit: 10, standardHeaders: 'draft-7', legacyHeaders: false, message: {error: 'Too many storyboard requests. Please wait a minute.'}}));

app.post('/api/storyboard/generate', async (request, response) => {
  try {
    const result = await generateStoryboard(request.body, process.env);
    response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Storyboard generation failed.';
    const status = message.includes('required') || message.includes('must be') || message.includes('non-empty') ? 400 : message.includes('not configured') ? 503 : 502;
    response.status(status).json({error: message});
  }
});

app.post('/api/video/render', async (request, response) => {
  try {
    if (!request.body?.storyboard) throw new Error('A validated storyboard is required.');
    const {filePath, fileName} = await renderStoryboardVideo(request.body.storyboard);
    response.download(filePath, fileName, (error) => {
      void rm(filePath, {force: true});
      if (error && !response.headersSent) response.status(500).json({error: 'Video download failed.'});
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Video rendering failed.';
    const status = message.includes('required') || message.includes('invalid') || message.includes('Unsupported') ? 400 : 502;
    response.status(status).json({error: message});
  }
});

app.use((_request, response) => response.status(404).json({error: 'Not found.'}));
app.listen(port, () => console.log(`Storyboard API listening on http://localhost:${port}`));
