import { NextFunction, Request, Response } from 'express';
import { ZodType } from 'zod';

type RequestSegment = 'body' | 'params' | 'query';

export const validate = <T>(schema: ZodType<T>, segment: RequestSegment = 'body') => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.parse(req[segment]);
    req[segment] = parsed as Request[RequestSegment];
    next();
  };
};
