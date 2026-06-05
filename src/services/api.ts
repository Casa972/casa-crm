import { supabase } from "./supabase.client";
import type { TableName } from "../types/database";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly table: string,
    readonly operation: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const api = {
  async list<TRow>(table: TableName, filter?: Record<string, string>): Promise<TRow[]> {
    let query = supabase.from(table).select("*");
    if (filter) {
      for (const [col, val] of Object.entries(filter)) query = query.eq(col, val);
    }
    const { data, error } = await query;
    if (error) throw new ApiError(`Lecture impossible (${table})`, table, "list", error);
    return (data ?? []) as TRow[];
  },

  async insert<TRow extends object>(table: TableName, row: Partial<TRow>): Promise<TRow> {
    const { data, error } = await supabase.from(table).insert(row).select().single();
    if (error) throw new ApiError(`Création impossible (${table})`, table, "insert", error);
    return data as TRow;
  },

  async update<TRow extends object>(table: TableName, id: string, patch: Partial<TRow>): Promise<TRow> {
    const { data, error } = await supabase.from(table).update(patch).eq("id", id).select().single();
    if (error) throw new ApiError(`Mise à jour impossible (${table})`, table, "update", error);
    return data as TRow;
  },

  async remove(table: TableName, id: string): Promise<void> {
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) throw new ApiError(`Suppression impossible (${table})`, table, "remove", error);
  },

  async upsertMany<TRow extends object>(table: TableName, rows: Partial<TRow>[]): Promise<TRow[]> {
    if (rows.length === 0) return [];
    const { data, error } = await supabase
      .from(table)
      .upsert(rows, { onConflict: "id" })
      .select();
    if (error) throw new ApiError(`Upsert impossible (${table})`, table, "upsertMany", error);
    return (data ?? []) as TRow[];
  },
};
