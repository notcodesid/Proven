import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

type Parts = 'body' | 'params' | 'query';

export const validateRequest = (
  schemaOrMap: z.ZodType<any> | Partial<Record<Parts, z.ZodType<any>>>
) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (schemaOrMap instanceof z.ZodType) {
      await schemaOrMap.parseAsync(req.body);
    } else {
      if (schemaOrMap.body) await schemaOrMap.body.parseAsync(req.body);
      if (schemaOrMap.params) await schemaOrMap.params.parseAsync(req.params);
      if (schemaOrMap.query) await schemaOrMap.query.parseAsync(req.query);
    }
    return next();
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error,
    });
    return;
  }
};