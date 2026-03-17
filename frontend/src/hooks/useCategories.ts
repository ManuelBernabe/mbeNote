import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import * as api from "../services/api";
import type { CreateCategoryRequest, UpdateCategoryRequest } from "../types";

const KEYS = {
  all: ["categories"] as const,
};

export function useCategories() {
  return useQuery({
    queryKey: KEYS.all,
    queryFn: api.getCategories,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCategoryRequest) => api.createCategory(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
    },
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryRequest }) =>
      api.updateCategory(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
    },
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteCategory(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
    },
  });
}
