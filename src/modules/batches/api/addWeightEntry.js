import { supabase } from "../../../lib/supabase/client";

export async function addWeightEntry({ batchId, date, weightAvg }) {
  const { error } = await supabase.from("batch_weights").insert({
    batch_id: batchId,
    date,
    weight_avg: weightAvg,
  });

  if (error) throw error;
}
