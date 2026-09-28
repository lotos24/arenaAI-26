import { WebWorkerMLCEngineHandler } from '@mlc-ai/web-llm';

// The model runs off the main thread so typing and animations stay smooth while it generates.
const handler = new WebWorkerMLCEngineHandler();
self.onmessage = (message: MessageEvent) => { handler.onmessage(message); };
