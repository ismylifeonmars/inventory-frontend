import {
  ApiResponse,
  CategoryRequest,
  LoginRequest,
  ProductRequest,
  RegisterRequest,
  TransactionRequest,
  UpdateUserRequest,
  UserDto,
} from './types';

const TOKEN_KEY = 'ims_auth_token';
const USER_KEY = 'ims_auth_user';

export const getStoredToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
};

export const setStoredToken = (token: string | null) => {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
};

export const getStoredUser = (): UserDto | null => {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const setStoredUser = (user: UserDto | null) => {
  if (typeof window === 'undefined') return;
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
  }
};

// Direct HTTP Request to Spring Boot Backend
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    if (typeof window !== 'undefined' && !endpoint.includes('/auth/login')) {
      setStoredToken(null);
      setStoredUser(null);
    }
  }

  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const errorMsg =
      data?.apiErrorResponse?.message ||
      data?.message ||
      `Request failed with status ${res.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

// Authentication Endpoints
export const authApi = {
  login: async (body: LoginRequest): Promise<ApiResponse> => {
    return request<ApiResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  register: async (body: RegisterRequest): Promise<ApiResponse> => {
    return request<ApiResponse>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
};

// Dashboard Endpoints
export const dashboardApi = {
  getStatistics: async (): Promise<ApiResponse> => {
    return request<ApiResponse>('/api/v1/dashboard/statistics', { method: 'GET' });
  },

  getLowStock: async (): Promise<ApiResponse> => {
    return request<ApiResponse>('/api/v1/dashboard/low-stock', { method: 'GET' });
  },

  getBestSelling: async (): Promise<ApiResponse> => {
    return request<ApiResponse>('/api/v1/dashboard/best-selling', { method: 'GET' });
  },

  getWorstSelling: async (): Promise<ApiResponse> => {
    return request<ApiResponse>('/api/v1/dashboard/worst-selling', { method: 'GET' });
  },
};

// Products Endpoints
export const productsApi = {
  getAll: async (page = 0, size = 10): Promise<ApiResponse> => {
    return request<ApiResponse>(`/api/v1/products?page=${page}&size=${size}`, { method: 'GET' });
  },

  getByName: async (name: string, page = 0, size = 10): Promise<ApiResponse> => {
    return request<ApiResponse>(
      `/api/v1/products/name?name=${encodeURIComponent(name)}&page=${page}&size=${size}`,
      { method: 'GET' }
    );
  },

  getByCategoryName: async (categoryName: string, page = 0, size = 10): Promise<ApiResponse> => {
    return request<ApiResponse>(
      `/api/v1/products/category-name?categoryName=${encodeURIComponent(categoryName)}&page=${page}&size=${size}`,
      { method: 'GET' }
    );
  },

  getById: async (id: string): Promise<ApiResponse> => {
    return request<ApiResponse>(`/api/v1/products/${id}`, { method: 'GET' });
  },

  create: async (body: ProductRequest): Promise<ApiResponse> => {
    return request<ApiResponse>('/api/v1/products', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  update: async (id: string, body: ProductRequest): Promise<ApiResponse> => {
    return request<ApiResponse>(`/api/v1/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  delete: async (id: string): Promise<ApiResponse> => {
    return request<ApiResponse>(`/api/v1/products/${id}`, { method: 'DELETE' });
  },
};

// Categories Endpoints
export const categoriesApi = {
  getAll: async (): Promise<ApiResponse> => {
    return request<ApiResponse>('/api/v1/categories', { method: 'GET' });
  },

  getById: async (id: string): Promise<ApiResponse> => {
    return request<ApiResponse>(`/api/v1/categories/${id}`, { method: 'GET' });
  },

  create: async (body: CategoryRequest): Promise<ApiResponse> => {
    return request<ApiResponse>('/api/v1/categories', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  update: async (id: string, body: CategoryRequest): Promise<ApiResponse> => {
    return request<ApiResponse>(`/api/v1/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  delete: async (id: string): Promise<ApiResponse> => {
    return request<ApiResponse>(`/api/v1/categories/${id}`, { method: 'DELETE' });
  },
};

// Transactions Endpoints
export const transactionsApi = {
  create: async (body: TransactionRequest): Promise<ApiResponse> => {
    return request<ApiResponse>('/api/v1/transactions', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  getAll: async (page = 0, size = 10): Promise<ApiResponse> => {
    return request<ApiResponse>(`/api/v1/transactions?page=${page}&size=${size}`, { method: 'GET' });
  },

  getById: async (id: string): Promise<ApiResponse> => {
    return request<ApiResponse>(`/api/v1/transactions/${id}`, { method: 'GET' });
  },

  getByType: async (type: string, page = 0, size = 10): Promise<ApiResponse> => {
    return request<ApiResponse>(
      `/api/v1/transactions/transaction-type?transactionType=${encodeURIComponent(type)}&page=${page}&size=${size}`,
      { method: 'GET' }
    );
  },

  getBySaleType: async (saleType: string, page = 0, size = 10): Promise<ApiResponse> => {
    return request<ApiResponse>(
      `/api/v1/transactions/sale-type?saleType=${encodeURIComponent(saleType)}&page=${page}&size=${size}`,
      { method: 'GET' }
    );
  },

  delete: async (id: string): Promise<ApiResponse> => {
    return request<ApiResponse>(`/api/v1/transactions/${id}`, { method: 'DELETE' });
  },
};

// Users Endpoints
export const usersApi = {
  getAll: async (): Promise<ApiResponse> => {
    return request<ApiResponse>('/api/v1/users', { method: 'GET' });
  },

  getById: async (id: string): Promise<ApiResponse> => {
    return request<ApiResponse>(`/api/v1/users/${id}`, { method: 'GET' });
  },

  update: async (id: string, body: UpdateUserRequest): Promise<ApiResponse> => {
    return request<ApiResponse>(`/api/v1/users/update/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  delete: async (id: string): Promise<ApiResponse> => {
    return request<ApiResponse>(`/api/v1/users/${id}`, { method: 'DELETE' });
  },
};
