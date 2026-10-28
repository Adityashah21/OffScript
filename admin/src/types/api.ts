export * from './models';

export interface ApiSuccessResponse<T> {
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    pages?: number;
    statusCounts?: Record<string, number>;
  };
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
  code?: string;
}

export interface ApiErrorResponse {
  error: string;
  message?: string;
  statusCode?: number;
  details?: ApiErrorDetail[];
}

export interface AdminUser {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

export interface LoginResponse {
  token: string;
  user: AdminUser;
}
