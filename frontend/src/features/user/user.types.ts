export type Role =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "WAREHOUSE_MANAGER"
  | "PROCUREMENT"
  | "STAFF"
  | "FINANCE";

export type UserStatus = "ACTIVE" | "BLOCKED" | "DELETED";

export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  role: Role;
  status: UserStatus;
  warehouseId: string | null;
  warehouse?: {
    id: string;
    code: string;
    name: string;
    status?: string;
  } | null;
  needPasswordChange: boolean;
  isDeleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  role: Role;
  image?: File | null;
}


export interface UpdateUserPayload {
  name?: string;
  role?: Role;
  status?: UserStatus;
  image?: File | null;
}

export interface AssignRolePayload {
  role: Role;
}

export interface AssignWarehousePayload {
  warehouseId: string;
}

export interface UserQueryParams {
  page?: number;
  limit?: number;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  role?: Role;
  status?: UserStatus;
  isDeleted?: boolean | string;
  emailVerified?: boolean | string;
  needPasswordChange?: boolean | string;
  createdAt?: string;
  updatedAt?: string;
  id?: string;
  email?: string;
  name?: string;
  fields?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface UserListResponse {
  success: boolean;
  message: string;
  meta: ApiMeta;
  data: User[];
}
