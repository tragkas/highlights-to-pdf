
import React, { useState } from 'react';
import { AppState, ExtractionResult } from './types';
import { extractHighlightsLocally } from './services/pdfService';
import { jsPDF } from 'jspdf';
import { 
  FileUp, 
  Download, 
  Copy, 
  Check, 
  AlertCircle, 
  Loader2, 
  FileText, 
  Trash2,
  ShieldCheck,
  Zap,
  FileDown,
  Coffee
} from 'lucide-react';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [fileName, setFileName] = useState<string>('');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Please upload a valid PDF file.');
      setState(AppState.ERROR);
      return;
    }

    setFileName(file.name);
    setState(AppState.PROCESSING);
    setError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const data = await extractHighlightsLocally(arrayBuffer);
      setResult(data);
      setState(AppState.SUCCESS);
    } catch (err: any) {
      console.error(err);
      setError('Failed to parse PDF. Ensure the file contains a text layer.');
      setState(AppState.ERROR);
    }
  };

  const handleDownloadTxt = () => {
    if (!result) return;
    const content = result.highlights
      .map(h => `[Page ${h.page}] ${h.text}`)
      .join('\n\n---\n\n');
    
    const blob = new Blob([`EXTRACTED HIGHLIGHTS: ${fileName}\n\n${content}`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName.replace('.pdf', '')}_highlights.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPdf = () => {
    if (!result) return;
    
    const doc = new jsPDF();
    let y = 20;
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const contentWidth = pageWidth - (margin * 2);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(51, 65, 85);
    doc.text('Extracted Highlights', margin, y);
    y += 10;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Source: ${fileName}`, margin, y);
    y += 15;
    
    doc.setTextColor(30, 41, 59);
    
    result.highlights.forEach((h) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(99, 102, 241); // indigo-500
      doc.text(`PAGE ${h.page || '?'}:`, margin, y);
      y += 6;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(51, 65, 85);
      const textLines = doc.splitTextToSize(h.text, contentWidth);
      
      if (y + (textLines.length * 6) > 280) {
        doc.addPage();
        y = 20;
      }
      
      doc.text(textLines, margin, y);
      y += (textLines.length * 6) + 12;
    });
    
    doc.save(`${fileName.replace('.pdf', '')}_highlights.pdf`);
  };

  const handleCopy = () => {
    if (!result) return;
    const content = result.highlights.map(h => h.text).join('\n\n');
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    setState(AppState.IDLE);
    setResult(null);
    setError(null);
    setFileName('');
  };

  return (
    <div className="min-h-screen bg-[#fdfdfd] text-slate-700 selection:bg-indigo-100 selection:text-indigo-900">
      <nav className="sticky top-0 z-50 glass-effect">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-xl font-semibold text-slate-800 tracking-tight">
              Highlights to Pdf
            </span>
          </div>
          <div className="flex items-center gap-4">
            {state === AppState.SUCCESS && (
              <button 
                onClick={reset}
                className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                Clear
              </button>
            )}
            <a 
              href="https://georgiostragkas.gumroad.com/coffee" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-sm font-medium transition-colors border border-indigo-100"
            >
              <Coffee className="w-4 h-4" />
              <span>Buy me a coffee</span>
            </a>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-16">
        {state === AppState.IDLE && (
          <div className="text-center animate-in fade-in slide-in-from-bottom-6 duration-700">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-slate-900 leading-tight">
              Convert your PDF highlights <br/> into <span className="text-indigo-600">clean notes</span>.
            </h1>
            <p className="text-lg text-slate-500 mb-12 max-w-2xl mx-auto leading-relaxed">
              Drop your highlighted PDF below to extract every snippet locally.
            </p>
            
            <div className="max-w-xl mx-auto">
              <label className="flex flex-col items-center justify-center w-full h-72 border border-slate-200 rounded-3xl bg-white hover:bg-slate-50 hover:border-indigo-300 transition-all cursor-pointer group shadow-sm">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <div className="p-4 bg-indigo-50 rounded-2xl mb-5 group-hover:scale-105 transition-transform duration-300">
                    <FileUp className="w-9 h-9 text-indigo-500" />
                  </div>
                  <p className="mb-2 text-lg font-medium text-slate-800 tracking-tight">Select your highlighted PDF</p>
                  <p className="text-sm text-slate-400">Processing happens entirely on your device</p>
                </div>
                <input type="file" className="hidden" accept="application/pdf" onChange={handleFileUpload} />
              </label>
            </div>
          </div>
        )}

        {state === AppState.PROCESSING && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
            <h2 className="text-2xl font-semibold mt-8 text-slate-900">Processing Document</h2>
            <p className="text-slate-500 mt-2">Reconstructing text snippets from spatial coordinates...</p>
          </div>
        )}

        {state === AppState.ERROR && (
          <div className="max-w-lg mx-auto bg-white border border-red-100 rounded-3xl p-10 text-center shadow-sm">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-5" />
            <h2 className="text-xl font-semibold text-slate-900 mb-3">Unable to process PDF</h2>
            <p className="text-slate-500 mb-8 leading-relaxed">{error}</p>
            <button onClick={reset} className="px-8 py-2.5 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors">
              Try Another File
            </button>
          </div>
        )}

        {state === AppState.SUCCESS && result && (
          <div className="animate-in fade-in zoom-in-95 duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 text-indigo-500">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">Extraction Complete</span>
                </div>
                <h1 className="text-3xl font-bold text-slate-900 truncate mb-1" title={fileName}>
                  {fileName}
                </h1>
                <p className="text-slate-500 font-medium">
                  {result.highlights.length} highlight{result.highlights.length === 1 ? '' : 's'} identified.
                </p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <button 
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-600 hover:border-indigo-500 hover:text-indigo-600 transition-all"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied' : 'Copy Text'}
                </button>
                <button 
                  onClick={handleDownloadTxt}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-600 hover:border-indigo-500 hover:text-indigo-600 transition-all"
                >
                  <Download className="w-4 h-4" />
                  TXT
                </button>
                <button 
                  onClick={handleDownloadPdf}
                  className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
                >
                  <FileDown className="w-4 h-4" />
                  Export as PDF
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {result.highlights.length > 0 ? (
                result.highlights.map((highlight, idx) => (
                  <div 
                    key={idx} 
                    className="bg-white p-8 rounded-3xl border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:border-indigo-200 transition-colors"
                  >
                    <div className="flex justify-between items-start gap-6">
                      <p className="text-slate-700 leading-relaxed text-lg font-normal whitespace-pre-wrap">
                        {highlight.text}
                      </p>
                      {highlight.page && (
                        <span className="shrink-0 px-2.5 py-1 bg-slate-50 text-slate-400 text-[10px] font-bold rounded-lg tracking-wider border border-slate-100">
                          P.{highlight.page}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200">
                  <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-400 max-w-xs mx-auto text-sm leading-relaxed">
                    We scanned the document's metadata and visual coordinates but found no active highlights.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="mt-24 border-t border-slate-100 py-12 bg-white/50">
        <div className="max-w-5xl mx-auto px-6 flex flex-col items-center text-center">
          <p className="text-slate-400 text-sm mb-1 font-medium">
            Supports only PDF in English - Private PDF Extraction
          </p>
          <p className="text-slate-300 text-[11px] uppercase tracking-widest font-bold">
            © {new Date().getFullYear()} Highlights to Pdf
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
