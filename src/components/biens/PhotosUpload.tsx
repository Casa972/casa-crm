import { useState, useRef } from "react";
import { Camera, X, Loader2 } from "lucide-react";
import { supabase } from "../../services/supabase.client";

interface Props {
  bienRef: string;
  photos?: string[];
  onChange: (urls: string[]) => void;
}

export function PhotosUpload({ bienRef, photos = [], onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = async (files: FileList) => {
    setUploading(true);
    const urls: string[] = [...photos];
    for (const file of Array.from(files)) {
      const path = `${bienRef}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      const { error } = await supabase.storage.from("biens-photos").upload(path, file, { upsert: true });
      if (!error) {
        const { data } = supabase.storage.from("biens-photos").getPublicUrl(path);
        urls.push(data.publicUrl);
      }
    }
    onChange(urls);
    setUploading(false);
  };

  const remove = (url: string) => onChange(photos.filter((p) => p !== url));

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {photos.map((url) => (
          <div key={url} className="relative group">
            <img src={url} alt="" className="h-20 w-20 rounded-lg object-cover border border-line" />
            <button
              type="button"
              onClick={() => remove(url)}
              className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-danger text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={10} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-line text-ink-muted hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
        >
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
          <span className="text-[10px]">{uploading ? "Upload..." : "Photo"}</span>
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && upload(e.target.files)}
      />
    </div>
  );
}
