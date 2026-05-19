import express from 'express';
import heroImagesRouter from './routes/heroImages';

const app = express();
app.use(express.json());

console.log('strictRouting:', app.get('strict routing'));
console.log('caseSensitive:', app.get('case sensitive'));

app.use('/api', heroImagesRouter);

app.get('/api/debug', (_req, res) => {
  // Print the full stack
  const printLayer = (layer: any, idx: number) => {
    const info: any = { idx };
    if (layer.route) {
      info.type = 'route';
      info.path = layer.route.path;
      info.methods = Object.keys(layer.route.methods);
    } else if (layer.name === 'router') {
      info.type = 'router';
      info.regexp = layer.regexp?.toString()?.slice(0, 80);
      info.handleKeys = layer.handle ? Object.keys(layer.handle) : [];
      info.handleStackLength = layer.handle?.stack?.length;
    } else if (layer.name === '_mount') {
      info.type = 'mount';
      info.regexp = layer.regexp?.toString()?.slice(0, 80);
    } else {
      info.type = 'middleware';
      info.name = layer.name;
      info.regexp = layer.regexp?.toString()?.slice(0, 80);
    }
    return info;
  };
  
  const stackInfo = app._router.stack.map(printLayer);
  res.json({ stack: stackInfo });
});

const PORT = 4054;
const server = app.listen(PORT, () => {
  console.log('Test server on', PORT);
  
  const http = require('http');
  
  const debugReq = http.request({ hostname: 'localhost', port: PORT, path: '/api/debug', method: 'GET' }, (r: any) => {
    let data = '';
    r.on('data', (c: any) => data += c);
    r.on('end', () => {
      const parsed = JSON.parse(data);
      console.log('Stack layers:', JSON.stringify(parsed.stack, null, 2));
      
      const heroReq = http.request({ hostname: 'localhost', port: PORT, path: '/api/hero-images', method: 'GET' }, (r2: any) => {
        let data2 = '';
        r2.on('data', (c: any) => data2 += c);
        r2.on('end', () => {
          console.log('GET /api/hero-images ->', r2.statusCode, data2);
          server.close(() => process.exit(0));
        });
      });
      heroReq.end();
    });
  });
  debugReq.end();
});
