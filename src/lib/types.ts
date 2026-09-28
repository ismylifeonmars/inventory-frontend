export type UserRole = 'ADMIN' | 'USER';
export type SaleType = 'MPESA' | 'CASH';
export type TransactionType = 'Sale' | 'Purchase';

export interface UserDto {
  id: string;
  email: string;
  name: string;
  role: UserRole | string;
  phoneNumber: string;
  createdAt?: string;
  transactionsCount?: number;
}

export interface CategoryDto {
  id: string;
  name: string;
  productSize: number;
}

export interface ProductDto {
  id: string;
  name: string;
  stockQuantity: number;
  description: string;
  unitPrice: number;
  createdAt?: string;
  categoryName: string;
  transactionLinesCount: number;
}

export interface TransactionDto {
  id: string;
  transactionType: string;
  saleType: string;
  totalAmount: number;
  createdAt: string;
  transactionLinesCount: number;
  email: string;
}

export interface TransactionLineDto {
  id: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  productId: string;
  productName?: string;
  transactionId?: string;
}

export interface TransactionDtoSecond {
  id: string;
  transactionType: string;
  saleType: string;
  totalAmount: number;
  createdAt: string;
  transactionLines: TransactionLineDto[];
  email: string;
}

export interface DashboardResponse {
  stockValue: number;
  totalSalesPerDay: number;
  totalCashSalesPerDay: number;
  totalMpesaSalesPerDay: number;
}

export interface PaginationResponse {
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface ApiResponse<T = unknown> {
  status: number;
  message: string;
  authResponse?: {
    token: string;
    expiryDateMillis: number;
  };
  paginationResponse?: PaginationResponse;
  user?: UserDto;
  users?: UserDto[];
  category?: CategoryDto;
  categories?: CategoryDto[];
  product?: ProductDto;
  products?: ProductDto[];
  transactionDto?: TransactionDto;
  transactionDtoSecond?: TransactionDtoSecond;
  transactions?: TransactionDto[];
  dashboardResponse?: DashboardResponse;
  apiErrorResponse?: {
    status: number;
    message: string;
  };
}

// Request types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  role: string;
  phoneNumber: string;
  password: string;
}

export interface CategoryRequest {
  name: string;
}

export interface ProductRequest {
  name: string;
  stockQuantity: number;
  description: string;
  categoryName: string;
  unitPrice: number;
}

export interface TransactionLineRequest {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface TransactionRequest {
  transactionType: string;
  saleType: string;
  email: string;
  transactionLineRequests: TransactionLineRequest[];
}

export interface UpdateUserRequest {
  name: string;
  email: string;
  phoneNumber: string;
}
