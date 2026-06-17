import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listDocuments, deleteDocument, updateDocument } from "../../services/documents.service";

export function useDocuments() {
  return useQuery({
    queryKey: ["documents"],
    queryFn:  listDocuments,
    staleTime: 30_000,
  });
}

export function useUpdateDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Parameters<typeof updateDocument>[1] }) =>
      updateDocument(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documents"] }),
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) =>
      deleteDocument(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documents"] }),
  });
}
