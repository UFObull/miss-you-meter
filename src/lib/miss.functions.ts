import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

export type MissCounts = { liam_count: number; hope_count: number };

/** Publishable-key client with the new-format-key fetch shim (no bearer JWT). */
function makePublicClient() {
  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

export const getMissCounts = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = makePublicClient();
  const { data, error } = await supabase
    .from("miss_counts")
    .select("liam_count, hope_count")
    .eq("id", 1)
    .maybeSingle();

  if (error) throw error;
  return (data ?? { liam_count: 0, hope_count: 0 }) as MissCounts;
});

export const incrementMiss = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ who: z.enum(["liam", "hope"]) }).parse(input),
  )
  .handler(async ({ data }) => {
    const supabase = makePublicClient();
    const { data: row, error } = await supabase.rpc("increment_count", {
      which: data.who,
    });
    if (error) throw error;
    return row as MissCounts;
  });
