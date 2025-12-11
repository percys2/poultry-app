import { supabase } from "../../../lib/supabase/client";

export async function addExpenseEntry({ batchId, date, amount, category, description }) {
  const { error } = await supabase.from("batch_expenses").insert({
    batch_id: batchId,
    date,
    amount,
    category,
    description,
  });

  if (error) throw error;
}
