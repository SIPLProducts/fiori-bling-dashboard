import { Loader2, Upload } from "lucide-react";

export function UploadExcelButton({ busy, onClick, disabled }: { busy?: string | null; onClick: () => void; disabled?: boolean }) {
  return <button type="button" onClick={onClick} disabled={disabled || !!busy} className="btn-upload inline-flex h-11 items-center gap-2.5 rounded-full border py-1.5 pr-5 pl-1.5 text-left disabled:opacity-70 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
    <span className="grid size-8 place-items-center rounded-full bg-background/25">{busy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}</span>
    <span className="flex flex-col leading-tight"><span className="text-sm font-semibold">{busy ?? "Upload Excel"}</span>{!busy && <span className="text-[10px] opacity-85">Excel .xlsx</span>}</span>
  </button>;
}
