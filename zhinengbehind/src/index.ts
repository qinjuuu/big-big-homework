import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { casesRouter } from './routes/cases';
import { disclosuresRouter } from './routes/disclosures';
import { writingsRouter } from './routes/writings';
import { reviewsRouter } from './routes/reviews';
import { statsRouter } from './routes/stats';
import { authRouter } from './routes/auth';
import { collabRouter } from './routes/collab';
import { aiRouter } from './routes/ai';
import { terminologyRouter } from './routes/terminology';
import { usersRouter } from './routes/users';
import { rolesRouter } from './routes/roles';
import { patentEvaluateRouter } from './routes/patent-evaluate';
import { claimsTemplateRouter } from './routes/claims-templates';
import { disclosureTemplateRouter } from './routes/disclosure-templates';
import { createWebSocketServer } from './services/websocket';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = Number(process.env.PORT) || 3001;

// CORS 配置 - 允许本地开发的所有端口
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // 允许没有 origin 的请求（如移动应用、curl 等）
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:3002',
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1 || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// API 路由
app.use('/api/auth', authRouter);
app.use('/api/cases', casesRouter);
app.use('/api/disclosures', disclosuresRouter);
app.use('/api/writings', writingsRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api', statsRouter);
app.use('/api/collab', collabRouter);
app.use('/api/ai', aiRouter);
app.use('/api/terminology', terminologyRouter);
app.use('/api/users', usersRouter);
app.use('/api/roles', rolesRouter);
app.use('/api/patent-evaluate', patentEvaluateRouter);
app.use('/api/claims-templates', claimsTemplateRouter);
app.use('/api/disclosure-templates', disclosureTemplateRouter);

// 健康检查
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const server = app.listen(PORT, () => {
  console.log(`VAST Backend running on http://localhost:${PORT}`);
});

// 启动 WebSocket 协作编辑服务
createWebSocketServer(server);
