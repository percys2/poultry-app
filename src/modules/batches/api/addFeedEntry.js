import { supabase } from "../../../lib/supabase/client";

export async function addFeedEntry({ batchId, date, feedKg, feedType, cost }) {
  const { error } = await supabase.from("batch_feed").insert({
    batch_id: batchId,
    date,
    feed_kg: feedKg,
    feed_type: feedType,
    cost,
  });

  if (error) throw error;
}
