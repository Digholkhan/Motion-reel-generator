import {generateStoryboard} from '../../server/storyboard-service';

type ApiRequest = {method?: string; headers: Record<string, string | string[] | undefined>; body?: unknown};
type ApiResponse = {setHeader: (name: string, value: string) => void; status: (code: number) => ApiResponse; json: (body: unknown) => void};

export default async function handler(request: ApiRequest, response: ApiResponse) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({error: 'Method not allowed.'});
  }
  try {
    const contentLength = Number(request.headers['content-length'] || 0);
    if (contentLength > 20000) return response.status(413).json({error: 'Request body is too large.'});
    const result = await generateStoryboard(request.body as Parameters<typeof generateStoryboard>[0], process.env);
    return response.status(200).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Storyboard generation failed.';
    const status = message.includes('not configured') ? 503 : message.includes('required') || message.includes('must be') ? 400 : 502;
    return response.status(status).json({error: message});
  }
}
