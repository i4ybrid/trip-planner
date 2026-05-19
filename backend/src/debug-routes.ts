import express from 'express';
import heroImagesRouter from './routes/heroImages';

const app = express();
app.use(express.json());

app.use('/api', heroImagesRouter);

app.get('/api/debug-routes', (_req, res) => {
  const routes: string[] = [];
  const printRoutes = (layer: any, prefix = '') => {
    if (layer.route) {
      routes.push(`ROUTE: ${prefix}${layer.route.path} [${Object.keys(layer.route.methods).join(',')}]`);
    } else if (layer.name === 'router') {
      const subPrefix = prefix + (layer.regexp?.toString() || '');
      layer.handle?.stack?.forEach((l: any) => printRoutes(l, subPrefix));
    } else if (layer.name === '_mount') {
      const subPrefix = prefix + (layer.regexp?.toString() || '');
      layer.handle?.stack?.forEach((l: any) => printRoutes(l, subPrefix));
    }
  };
  
  app._router.stack.forEach((l: any) => printRoutes(l, '/'));
  res.json({ routes, count: routes.length });
});

const server = app.listen(4002, () => {
  console.log('Debug server listening on port 4002');
  // Give time for the server to be ready
  setTimeout(() => {
    server.close();
    process.exit(0);
  }, 100);
});
