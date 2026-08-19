import type { listarCobranzaMensual } from "@/lib/services/collection";

export type CollectionReceipt = Awaited<
  ReturnType<typeof listarCobranzaMensual>
>["receipts"][number];
