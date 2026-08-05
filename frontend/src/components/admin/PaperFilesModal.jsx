import { useState } from "react";
import { X, FileText, Upload, Loader2, Trash2, Save } from "lucide-react";
import { practiceService, uploadService } from "../../services";

// Admin dialog for a "Previous Papers" item: upload the actual question-paper
// PDF and the answer-key PDF (to Cloudinary via /api/upload), and write free-text
// additional information. Students then see these on the paper's start screen.
export default function PaperFilesModal({ item, onClose, onSaved }) {
  const [paperPdfUrl, setPaperPdfUrl] = useState(item?.paperPdfUrl || "");
  const [answerKeyPdfUrl, setAnswerKeyPdfUrl] = useState(item?.answerKeyPdfUrl || "");
  const [additionalInfo, setAdditionalInfo] = useState(item?.additionalInfo || "");
  const [uploading, setUploading] = useState(""); // "paper" | "answer"
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const doUpload = async (which, file) => {
    if (!file) return;
    setUploading(which);
    setMsg("");
    try {
      const res = await uploadService.file(file);
      if (!res?.url) throw new Error("Upload returned no URL.");
      if (which === "paper") setPaperPdfUrl(res.url); else setAnswerKeyPdfUrl(res.url);
    } catch (e) {
      setMsg(e.message || "Upload failed — check the file and that Cloudinary is configured.");
    } finally {
      setUploading("");
    }
  };

  const save = async () => {
    setSaving(true);
    setMsg("");
    try {
      await practiceService.updateItem(item._id, { paperPdfUrl, answerKeyPdfUrl, additionalInfo });
      onSaved?.();
    } catch (e) {
      setMsg(e.message || "Save failed.");
      setSaving(false);
    }
  };

  const FileRow = ({ label, url, which, onClear }) => (
    <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
      <p className="mb-2 text-sm font-semibold">{label}</p>
      {url ? (
        <div className="flex flex-wrap items-center gap-2">
          <a href={url} target="_blank" rel="noreferrer" className="btn-outline py-1.5 text-xs"><FileText className="h-3.5 w-3.5" /> View current PDF</a>
          <button type="button" onClick={onClear} disabled={saving} className="btn-outline py-1.5 text-xs text-rose-600"><Trash2 className="h-3.5 w-3.5" /> Remove</button>
        </div>
      ) : (
        <p className="mb-2 text-xs text-slate-400">No file uploaded yet.</p>
      )}
      <label className="mt-2 inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800">
        {uploading === which ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
        {url ? "Replace PDF" : "Upload PDF"}
        <input type="file" accept="application/pdf,.pdf" className="hidden" disabled={!!uploading || saving} onChange={(e) => { doUpload(which, e.target.files?.[0]); e.target.value = ""; }} />
      </label>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={saving ? undefined : onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg animate-scale-in card p-6">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-bold"><FileText className="h-5 w-5 text-brand-600" /> Paper files &amp; info</h3>
          <button type="button" onClick={onClose} disabled={saving}><X className="h-5 w-5" /></button>
        </div>
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          Attach the actual PDFs for <b>{item?.name}</b>. Students can open them and read the additional information on the paper's start screen.
        </p>

        <div className="space-y-3">
          <FileRow label="Question paper (PDF)" url={paperPdfUrl} which="paper" onClear={() => setPaperPdfUrl("")} />
          <FileRow label="Answer key (PDF)" url={answerKeyPdfUrl} which="answer" onClear={() => setAnswerKeyPdfUrl("")} />
          <div>
            <label className="mb-1 block text-sm font-semibold">Additional information</label>
            <textarea
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              rows={4}
              placeholder="e.g. exam date, total marks, duration, instructions, source…"
              className="input"
            />
          </div>
        </div>

        {msg && <p className="mt-3 text-sm font-medium text-rose-600">{msg}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={saving} className="btn-outline">Cancel</button>
          <button type="button" onClick={save} disabled={saving || !!uploading} className="btn-primary">
            {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : <><Save className="h-4 w-4" /> Save</>}
          </button>
        </div>
      </div>
    </div>
  );
}
