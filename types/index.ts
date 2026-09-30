export * from './database';
export interface ActionResult<T = undefined> { success: boolean; message: string; data?: T; fieldErrors?: Record<string, string[]>; }
