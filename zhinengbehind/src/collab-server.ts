import { setupWSConnection } from 'y-websocket/bin/utils';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';

const server = http.createServer();
const wss = new WebSocketServer({ server });

wss.on('connection', (conn: WebSocket, req: http.IncomingMessage) => {
  // 从 URL 中提取文档名称（这里简单使用 case_id）
  const docName = req.url?.split('/').pop() || 'default';
  setupWSConnection(conn, req as any, { docName });
  console.log(`Collab client connected for doc: ${docName}`);
});

server.listen(3002, () => {
  console.log('Yjs WebSocket server running on ws://localhost:3002');
});
