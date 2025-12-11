import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase/client";

export function useMortality(batchId) {
  const [mortality, setMortality] = useState([]);

  async function load() {
    const { data } = await supabase
      .from("batch_mortality")
      .select("*")
      .eq("batch_id", batchId)
      .order("date", { ascending: false });

    setMortality(data || []);
  }

  useEffect(() => {
    load();
  }, [batchId]);

  return { mortality, reloadMortality: load };
}
