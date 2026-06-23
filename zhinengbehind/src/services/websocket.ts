import { WebSocketServer, WebSocket } from 'ws';
import pool from '../db/connection';

interface CollaborativeDoc {
  id: number;
  case_id: string;
  doc_type: string;
  content: string;
  version: number;
  activeUsers: number;
}

interface WSClient extends WebSocket {
  userId?: string;
  userName?: string;
  docId?: number;
  caseId?: string;
  docType?: string;
}

interface OperationMessage {
  type: 'join' | 'leave' | 'operation' | 'cursor' | 'sync' | 'presence';
  docId?: number;
  caseId?: string;
  docType?: string;
  userId?: string;
  userName?: string;
  content?: string;
  operation?: {
    type: 'insert' | 'delete' | 'retain';
    position: number;
    content?: string;
    length?: number;
  };
  cursor?: {
    position: number;
    selection?: { start: number; end: number };
  };
  timestamp?: number;
}

// 内存中存储文档内容（生产环境应使用Redis）
const docCache: Map<number, CollaborativeDoc> = new Map();
const docClients: Map<number, Set<WSClient>> = new Map();
const maxUsersPerDoc = 30;

export function createWebSocketServer(server: any) {
  const wss = new WebSocketServer({ server, path: '/ws/collaborate' });

  wss.on('connection', (ws: WSClient) => {
    console.log('[WebSocket] New client connected');

    ws.on('message', async (data) => {
      try {
        const message: OperationMessage = JSON.parse(data.toString());
        await handleMessage(ws, message);
      } catch (err) {
        console.error('[WebSocket] Message parse error:', err);
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      }
    });

    ws.on('close', () => {
      handleDisconnect(ws);
    });

    ws.on('error', (err) => {
      console.error('[WebSocket] Client error:', err);
    });
  });

  console.log('[WebSocket] Collaborative editing server initialized');
  return wss;
}

async function handleMessage(ws: WSClient, msg: OperationMessage) {
  switch (msg.type) {
    case 'join':
      await handleJoin(ws, msg);
      break;
    case 'leave':
      handleLeave(ws);
      break;
    case 'operation':
      await handleOperation(ws, msg);
      break;
    case 'cursor':
      handleCursor(ws, msg);
      break;
    case 'sync':
      await handleSync(ws, msg);
      break;
    default:
      ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }));
  }
}

async function handleJoin(ws: WSClient, msg: OperationMessage) {
  const { docId, caseId, docType, userId, userName } = msg;
  
  if (!caseId || !docType) {
    ws.send(JSON.stringify({ type: 'error', message: 'Missing caseId or docType' }));
    return;
  }

  ws.userId = userId || 'anonymous';
  ws.userName = userName || 'Anonymous';
  ws.caseId = caseId;
  ws.docType = docType;

  let doc: CollaborativeDoc | undefined;

  // 如果传了docId，直接使用
  if (docId) {
    ws.docId = docId;
    doc = docCache.get(docId);
    if (!doc) {
      // 从数据库加载
      const [rows] = await pool.query(
        'SELECT * FROM sys_collaborative_doc WHERE id = ?',
        [docId]
      );
      const dbDoc = (rows as any[])[0];
      if (dbDoc) {
        doc = {
          id: dbDoc.id,
          case_id: dbDoc.case_id,
          doc_type: dbDoc.doc_type,
          content: dbDoc.doc_content || '',
          version: dbDoc.version || 1,
          activeUsers: dbDoc.active_users || 0
        };
        docCache.set(docId, doc);
      }
    }
  }

  // 如果没有找到文档，按caseId+docType查找或创建
  if (!doc) {
    const [rows] = await pool.query(
      'SELECT * FROM sys_collaborative_doc WHERE case_id = ? AND doc_type = ?',
      [caseId, docType]
    );
    const dbDoc = (rows as any[])[0];
    if (dbDoc) {
      ws.docId = dbDoc.id;
      doc = {
        id: dbDoc.id,
        case_id: dbDoc.case_id,
        doc_type: dbDoc.doc_type,
        content: dbDoc.doc_content || '',
        version: dbDoc.version || 1,
        activeUsers: dbDoc.active_users || 0
      };
      docCache.set(dbDoc.id, doc);
    } else {
      // 创建新文档
      const [result] = await pool.query(
        'INSERT INTO sys_collaborative_doc (case_id, doc_type, doc_content, version, max_users) VALUES (?, ?, ?, 1, 30)',
        [caseId, docType, '']
      );
      const newId = (result as any).insertId;
      ws.docId = newId;
      doc = {
        id: newId,
        case_id: caseId,
        doc_type: docType,
        content: '',
        version: 1,
        activeUsers: 0
      };
      docCache.set(newId, doc);
    }
  }

  if (!doc) {
    ws.send(JSON.stringify({ type: 'error', message: 'Failed to create or load document' }));
    return;
  }

  // 检查在线用户数
  const clients = docClients.get(doc.id) || new Set();
  if (clients.size >= maxUsersPerDoc) {
    ws.send(JSON.stringify({ type: 'error', message: 'Document reached max user limit (30)' }));
    return;
  }

  clients.add(ws);
  docClients.set(doc.id, clients);
  doc.activeUsers = clients.size;

  // 更新数据库活跃用户数
  await pool.query(
    'UPDATE sys_collaborative_doc SET active_users = ? WHERE id = ?',
    [clients.size, doc.id]
  );

  // 发送当前文档内容给新用户
  ws.send(JSON.stringify({
    type: 'init',
    docId: doc.id,
    content: doc.content,
    version: doc.version,
    userCount: clients.size
  }));

  // 广播用户加入通知
  broadcastToDoc(doc.id, {
    type: 'presence',
    event: 'join',
    userId: ws.userId,
    userName: ws.userName,
    userCount: clients.size
  }, ws);

  // 发送当前在线用户列表
  const users: Array<{ userId: string; userName: string }> = [];
  clients.forEach((client) => {
    if (client.userId && client.userName) {
      users.push({ userId: client.userId, userName: client.userName });
    }
  });
  
  ws.send(JSON.stringify({
    type: 'users',
    users: users
  }));
}

function handleLeave(ws: WSClient) {
  handleDisconnect(ws);
}

async function handleOperation(ws: WSClient, msg: OperationMessage) {
  if (!ws.docId || !msg.operation) return;

  const doc = docCache.get(ws.docId);
  if (!doc) return;

  const op = msg.operation;
  let content = doc.content;

  // 应用操作
  if (op.type === 'insert' && op.content !== undefined) {
    const pos = Math.min(op.position, content.length);
    content = content.slice(0, pos) + op.content + content.slice(pos);
  } else if (op.type === 'delete' && op.length !== undefined) {
    const pos = Math.min(op.position, content.length);
    content = content.slice(0, pos) + content.slice(pos + op.length);
  }

  doc.content = content;
  doc.version += 1;

  // 保存操作记录到数据库
  await pool.query(
    `INSERT INTO sys_collaborative_operation 
     (doc_id, user_id, user_name, operation_type, position, content, length) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      ws.docId, ws.userId || 'anonymous', ws.userName || 'Anonymous',
      op.type, op.position, op.content || null, op.length || null
    ]
  );

  // 广播操作给其他用户
  broadcastToDoc(ws.docId, {
    type: 'operation',
    operation: op,
    userId: ws.userId,
    userName: ws.userName,
    version: doc.version,
    timestamp: Date.now()
  }, ws);

  // 定期保存到数据库（每10个版本保存一次）
  if (doc.version % 10 === 0) {
    await pool.query(
      'UPDATE sys_collaborative_doc SET doc_content = ?, version = ? WHERE id = ?',
      [doc.content, doc.version, doc.id]
    );
  }
}

function handleCursor(ws: WSClient, msg: OperationMessage) {
  if (!ws.docId) return;

  broadcastToDoc(ws.docId, {
    type: 'cursor',
    userId: ws.userId,
    userName: ws.userName,
    cursor: msg.cursor,
    timestamp: Date.now()
  }, ws);
}

async function handleSync(ws: WSClient, msg: OperationMessage) {
  if (!ws.docId) return;

  const doc = docCache.get(ws.docId);
  if (!doc) return;

  ws.send(JSON.stringify({
    type: 'sync',
    content: doc.content,
    version: doc.version
  }));

  // 保存到数据库
  await pool.query(
    'UPDATE sys_collaborative_doc SET doc_content = ?, version = ? WHERE id = ?',
    [doc.content, doc.version, ws.docId]
  );
}

function handleDisconnect(ws: WSClient) {
  if (!ws.docId) return;

  const clients = docClients.get(ws.docId);
  if (clients) {
    clients.delete(ws);
    const doc = docCache.get(ws.docId);
    if (doc) {
      doc.activeUsers = clients.size;
      
      // 更新数据库
      pool.query(
        'UPDATE sys_collaborative_doc SET active_users = ? WHERE id = ?',
        [clients.size, ws.docId]
      ).catch(console.error);
    }

    // 广播用户离开
    broadcastToDoc(ws.docId, {
      type: 'presence',
      event: 'leave',
      userId: ws.userId,
      userName: ws.userName,
      userCount: clients.size
    }, ws);

    if (clients.size === 0) {
      // 保存文档到数据库并清理缓存
      if (doc) {
        pool.query(
          'UPDATE sys_collaborative_doc SET doc_content = ?, version = ? WHERE id = ?',
          [doc.content, doc.version, ws.docId]
        ).catch(console.error);
      }
      docClients.delete(ws.docId);
      docCache.delete(ws.docId);
    }
  }
}

function broadcastToDoc(docId: number, message: any, exclude?: WSClient) {
  const clients = docClients.get(docId);
  if (!clients) return;

  const msgStr = JSON.stringify(message);
  clients.forEach((client) => {
    if (client !== exclude && client.readyState === WebSocket.OPEN) {
      client.send(msgStr);
    }
  });
}

// 获取文档历史操作
export async function getDocOperations(docId: number, limit = 100): Promise<any[]> {
  const [rows] = await pool.query(
    `SELECT * FROM sys_collaborative_operation 
     WHERE doc_id = ? ORDER BY operation_time DESC LIMIT ?`,
    [docId, limit]
  );
  return rows as any[];
}

// 获取文档版本历史
export async function getDocVersions(docId: number): Promise<any[]> {
  const [rows] = await pool.query(
    `SELECT id, version, operation_time as save_time, 
     (SELECT COUNT(*) FROM sys_collaborative_operation WHERE doc_id = ?) as operation_count
     FROM sys_collaborative_doc WHERE id = ?`,
    [docId, docId]
  );
  return rows as any[];
}
