declare module 'common' {
  export function createLogger(serviceName?: string): { info: (msg: string, meta?: object) => void; error: (msg: string, meta?: object) => void; warn: (msg: string, meta?: object) => void };
  export function buildEvent(eventType: string, data: object, metadata?: object, source?: string): { eventId: string; [key: string]: unknown };
  export function parseEvent(message: string): { eventId?: string; data?: unknown } | null;
  export class ApplicationError extends Error {
    statusCode: number;
    constructor(message: string, statusCode?: number);
  }
  export class ValidationError extends ApplicationError {}
  export class NotFoundError extends ApplicationError {}
  export class UnauthorizedError extends ApplicationError {}
  export class ForbiddenError extends ApplicationError {}
}
