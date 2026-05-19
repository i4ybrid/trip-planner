import express from 'express';
import heroImagesRouter from './routes/heroImages';

const app = express();
app.use(express.json());

// Debug: dump all registered routes on startup
const printRoutes = (layer, prefix = '') => {
  if (layer.route) {
    console.log(`ROUTE: ${prefix}${layer.route.path} [${Object.keys(layer.route.methods).join(',')}]`);
  } else if (layer.name === 'router') {
    const subPrefix = prefix + (layer.regexp?.toString() || '');
    layer.handle?.stack?.forEach(l => printRoutes(l, subPrefix));
  } else if (layer.name === '_mount') {
    const subPrefix = prefix + (layer.regexp?.toString() || '');
    layer.handle?.stack?.forEach(l => printRoutes(l, subPrefix));
  }
};

app.use('/api', heroImagesRouter);

const server = app.listen(4001, () => {
  console.log('=== REGISTERED ROUTES ===');
  app._router.stack.forEach(l => printRoutes(l, '/'));
  console.log('=== END ROUTES ===');
  server.close();
  process.exit(0);
});
