import { Request, Response, NextFunction } from 'express';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const { method, url, query, body, params } = req;
  const timestamp = new Date().toISOString();

  // Log at INFO level
  console.log(`[${timestamp}] INFO: ${method} ${url}`);

  // Log parameters at DEBUG level (if any exist)
  const hasParams = Object.keys(params).length > 0;
  const hasQuery = Object.keys(query).length > 0;
  const hasBody = Object.keys(body).length > 0;

  if (hasParams || hasQuery || hasBody) {
    const debugInfo: any = {};
    if (hasParams) debugInfo.params = params;
    if (hasQuery) debugInfo.query = query;
    if (hasBody) debugInfo.body = body;
    
    console.debug(`[${timestamp}] DEBUG: Request Parameters:`, JSON.stringify(debugInfo, null, 2));
  }

  next();
};
