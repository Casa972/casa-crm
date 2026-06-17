import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listDocuments, deleteDocument } from "../../services/documents.service";

export function useDocuments() {
  return useQuery({
    queryKey: ["documents"],
    queryFn:  listDocuments,
    staleTime: 30_000,
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, storagePath }: { id: string; storagePath: string }) =>
      deleteDocument(id, storagePath),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documents"] }),
  });
}
