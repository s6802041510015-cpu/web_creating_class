import { useEffect, useState } from "react";
import { Code2, Lightbulb, Play, RotateCcw } from "lucide-react";

type Props = {
  code: string;
  onChange: (value: string) => void;
  fileName: string;
  onReset?: () => void;
  onInternalLink?: (fileName: string) => boolean;
  hint?: boolean;
};

export function HtmlWorkspace({
  code,
  onChange,
  fileName,
  onReset,
  onInternalLink,
  hint = false,
}: Props) {
  const [view, setView] = useState<"code" | "preview">("code");
  const [preview, setPreview] = useState(code);
  const [previewVersion, setPreviewVersion] = useState(0);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setPreview(code), 350);
    return () => window.clearTimeout(timer);
  }, [code]);

  function run() {
    setPreview(code);
    setPreviewVersion((value) => value + 1);
    setView("preview");
  }

  function connectPreviewLinks(frame: HTMLIFrameElement) {
    if (!onInternalLink) return;
    const doc = frame.contentDocument;
    doc?.addEventListener("click", (event) => {
      const anchor = (event.target as Element).closest?.("a");
      const href = anchor?.getAttribute("href");
      if (href && onInternalLink(href)) event.preventDefault();
    });
  }

  return (
    <div className="lab-shell">
      <div className="lab-toolbar">
        <div className="lab-toolbar__file">
          <Code2 size={18} /> {fileName}
        </div>
        <div className="lab-toolbar__actions">
          <button type="button" onClick={run} aria-label="Run preview">
            <Play size={16} /> Run
          </button>
          {onReset && (
            <button type="button" onClick={onReset} aria-label="Reset code">
              <RotateCcw size={16} /> Reset
            </button>
          )}
          {hint && (
            <button
              type="button"
              onClick={() => setShowHint((value) => !value)}
              aria-expanded={showHint}
              aria-label="Hint"
            >
              <Lightbulb size={16} /> Hint
            </button>
          )}
        </div>
      </div>
      {showHint && <div className="lab-hint">Hint จะเพิ่มในขั้นถัดไป</div>}
      <div className="lab-tabs" role="tablist" aria-label="มุมมอง Code Lab">
        <button
          role="tab"
          aria-selected={view === "code"}
          className={view === "code" ? "active" : ""}
          onClick={() => setView("code")}
          type="button"
        >
          CODE
        </button>
        <button
          role="tab"
          aria-selected={view === "preview"}
          className={view === "preview" ? "active" : ""}
          onClick={() => setView("preview")}
          type="button"
        >
          PREVIEW
        </button>
      </div>
      <div className="lab-panels">
        <section
          className={`lab-panel lab-panel--code ${view === "code" ? "lab-panel--visible" : ""}`}
          aria-label="HTML editor"
        >
          <div className="lab-panel__heading">
            <span>CODE</span>
            <small>HTML</small>
          </div>
          <label className="sr-only" htmlFor={`editor-${fileName}`}>
            แก้ไข HTML ใน {fileName}
          </label>
          <textarea
            id={`editor-${fileName}`}
            className="html-editor"
            value={code}
            onChange={(event) => onChange(event.target.value)}
            spellCheck={false}
          />
        </section>
        <section
          className={`lab-panel lab-panel--preview ${view === "preview" ? "lab-panel--visible" : ""}`}
          aria-label="HTML preview"
        >
          <div className="lab-panel__heading">
            <span>PREVIEW</span>
            <small>แสดงผล HTML</small>
          </div>
          <iframe
            key={previewVersion}
            className="html-preview-frame"
            title={`ผลลัพธ์ ${fileName}`}
            sandbox={onInternalLink ? "allow-same-origin" : ""}
            referrerPolicy="no-referrer"
            srcDoc={preview}
            onLoad={(event) => connectPreviewLinks(event.currentTarget)}
          />
        </section>
      </div>
    </div>
  );
}
