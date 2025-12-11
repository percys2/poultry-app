import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase/client";

export function useExpenses(batchId) {
  const [expenses, setExpenses] = useState([]);

  async function load() {
    const { data } = await supabase
      .from("batch_expenses")
      .select("*")
      .eq("batch_id", batchId)
      .order("date", { ascending: false });

    setExpenses(data || []);
  }

  useEffect(() => {
    load();
  }, [batchId]);

  return { expenses, reloadExpenses: load };
}
