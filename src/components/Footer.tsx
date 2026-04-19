export default function Footer() {
  return (
    <footer className="col-span-full bg-bg border-t border-border flex items-center justify-between px-4 font-mono text-[10px] text-text-dim">
      <div>
        <span className="w-1.5 h-1.5 bg-accent rounded-full inline-block mr-1.5 animate-pulse"></span>
        OPENCV.JS_WORKER: READY | LATENCY: 2ms | <span className="opacity-70 ml-2">SHORTCUT: ESC TO DESELECT</span>
      </div>
      <div>
        RODRIGUES_TRANSFORM: COMPLETED | MATRIX_4X4: VALID
      </div>
    </footer>
  );
}
