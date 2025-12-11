import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase/client";

export function useFeed(batchId) {
  const [feed, setFeed] = useState([]);

  async function load() {
    const { data } = await supabase
      .from("batch_feed")
      .select("*")
      .eq("batch_id", batchId)
      .order("date", { ascending: false });

    setFeed(data || []);
  }

  useEffect(() => {
    load();
  }, [batchId]);

  return { feed, reloadFeed: load };
}
