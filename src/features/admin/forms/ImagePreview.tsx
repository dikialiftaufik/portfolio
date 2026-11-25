import { useCallback } from 'react';

interface Props {
  file: File;
  className: string;
  /** The browser could not decode the picked file. */
  onError: () => void;
}

/** Local preview of a picked file. The object URL lives exactly as long as it is shown. */
export function ImagePreview({ file, className, onError }: Props) {
  const attach = useCallback(
    (img: HTMLImageElement | null) => {
      if (!img) return;
      const url = URL.createObjectURL(file);
      img.src = url;
      return () => URL.revokeObjectURL(url);
    },
    [file],
  );
  return <img ref={attach} alt="Preview" className={className} onError={onError} />;
}
