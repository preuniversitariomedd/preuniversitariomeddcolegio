import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useClipboardImage(onUploaded: (url: string) => void) {
  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) return;
        const ext = file.type.split("/")[1] || "png";
        const path = `clipboard/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from("contenido").upload(path, file);
        if (error) return;
        const { data } = supabase.storage.from("contenido").getPublicUrl(path);
        onUploaded(data.publicUrl);
        return;
      }
    }
  }, [onUploaded]);

  return { handlePaste };
}
