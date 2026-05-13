import { HttpErrorResponse } from '@angular/common/http';

export function getApiErrorMessage(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    const body = err.error as { message?: string; code?: string } | undefined;
    if (body?.message) {
      return body.message;
    }
    return err.message || `HTTP ${err.status}`;
  }
  return 'Something went wrong';
}
