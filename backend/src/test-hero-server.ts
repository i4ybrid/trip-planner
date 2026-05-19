import express from 'express';
import heroImagesRouter from './routes/heroImages';

const app = express();
app.use(express.json());
app.use('/api', heroImagesRouter);

const server = app.listen(4035, async () => {
  console.log('Server on 4035');
  
  // Get token from running server on 4033
  const loginReq = await new Promise<any>((res) => {
    const http = require('http');
    const req = http.request({ hostname: 'localhost', port: 4033, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } }, (r: any) => {
      let data = '';
      r.on('data', (c: any) => data += c);
      r.on('end', () => res(JSON.parse(data)));
    });
    req.write(JSON.stringify({ email: 'test-qa-hero@example.com', password: 'password123' }));
    req.end();
  });
  
  const token = loginReq.data?.token;
  console.log('Token:', token ? 'yes' : 'no');
  
  // Try the hero images router directly on 4035
  const heroRes = await new Promise<any>((res) => {
    const http = require('http');
    const req = http.request({ hostname: 'localhost', port: 4035, path: '/api/hero-images', method: 'GET', headers: { 'Authorization': `Bearer ${token}` } }, (r: any) => {
      let data = '';
      r.on('data', (c: any) => data += c);
      r.on('end', () => res({ status: r.statusCode, body: data }));
    });
    req.end();
  });
  
  console.log('GET /api/hero-images ->', heroRes.status, heroRes.body);
  
  server.close(() => {
    process.exit(0);
  });
});
