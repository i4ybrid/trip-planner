import { Express } from 'express';

export function setupSwagger(app: Express) {
  // Swagger documentation - requires swagger-jsdoc and swagger-ui-express
  // Install: npm install swagger-jsdoc swagger-ui-express
  app.get('/api-docs', (req, res) => {
    res.json({ message: 'Swagger docs not configured' });
  });
  
  app.get('/api-docs.json', (req, res) => {
    res.json({ openapi: '3.0.0', info: { title: 'TripPlanner API', version: '1.0.0' } });
  });
}

export default setupSwagger;
