import { supabase } from "../../../lib/supabase/client";

export async function addMortalityEntry({ batchId, date, quantity, cause }) {
  const { error } = await supabase.from("batch_mortality").insert({
    batch_id: batchId,
    date,
    dead_quantity: quantity,
    cause,
  });

  if (error) throw error;
}
