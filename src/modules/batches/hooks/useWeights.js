import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase/client";

export function useWeights(batchId) {
  const [weights, setWeights] = useState([]);

  async function load() {
    const { data } = await supabase
      .from("batch_weights")
      .select("*")
      .eq("batch_id", batchId)
      .order("date", { ascending: false });

    setWeights(data || []);
  }

  useEffect(() => {
    load();
  }, [batchId]);

  return { weights, reloadWeights: load };
}
