import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { userApi } from "./user.api";
import {
  AssignRolePayload,
  AssignWarehousePayload,
  CreateUserPayload,
  UpdateUserPayload,
  UserQueryParams,
} from "./user.types";

export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (params?: UserQueryParams) => [...userKeys.all, params] as const,
  details: () => [...userKeys.all, "detail"] as const,
  detail: (id: string) => ["user", id] as const,
};

export function useUsers(params?: UserQueryParams) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => userApi.getUsers(params),
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => userApi.getUserById(id),
    enabled: Boolean(id),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateUserPayload | FormData) =>
      userApi.createUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateUserPayload | FormData;
    }) => userApi.updateUser(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      queryClient.invalidateQueries({
        queryKey: userKeys.detail(variables.id),
      });
    },
  });
}

export function useBlockUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => userApi.blockUser(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      queryClient.invalidateQueries({ queryKey: userKeys.detail(id) });
    },
  });
}

export function useUnblockUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => userApi.unblockUser(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      queryClient.invalidateQueries({ queryKey: userKeys.detail(id) });
    },
  });
}

export function useAssignRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AssignRolePayload }) =>
      userApi.assignRole(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      queryClient.invalidateQueries({
        queryKey: userKeys.detail(variables.id),
      });
    },
  });
}

export function useAssignWarehouse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: AssignWarehousePayload;
    }) => userApi.assignWarehouse(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      queryClient.invalidateQueries({
        queryKey: userKeys.detail(variables.id),
      });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => userApi.deleteUser(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      queryClient.invalidateQueries({ queryKey: userKeys.detail(id) });
    },
  });
}
