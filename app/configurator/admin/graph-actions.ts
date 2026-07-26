'use server'

import { catalog } from "@/lib/catalog-client"

// Graph maintenance from the admin UI now goes through the Catalog (it owns the graph),
// so pandc no longer imports lib/graph-db / dgraph at runtime.
async function graphOp(op: "drop-data" | "drop-all" | "set-schema"): Promise<void> {
  await catalog.post("/admin/graph", { op })
}

export async function dropData(): Promise<void> { await graphOp("drop-data") }
export async function dropAll(): Promise<void> { await graphOp("drop-all") }
export async function setSchema(): Promise<void> { await graphOp("set-schema") }
