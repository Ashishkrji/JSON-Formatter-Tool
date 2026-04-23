/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Settings, HelpCircle, AlignLeft, Minimize, CheckCircle2, 
  Upload, Download, Copy, Trash2, Code, Braces, ArrowLeftRight,
  AlertCircle
} from 'lucide-react';

export default function App() {
  const [inputJson, setInputJson] = useState<string>('{\n  "paste": "your json here"\n}');
  const [outputJson, setOutputJson] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Focus effect to parse on paste can be handled by just letting standard onChange work,
  // but we can add a specific onPaste handler if we want auto-format.

  const handleFormat = () => {
    if (!inputJson.trim()) {
      setOutputJson('');
      setIsValid(null);
      setError(null);
      return;
    }
    try {
      const parsed = JSON.parse(inputJson);
      setOutputJson(JSON.stringify(parsed, null, 2));
      setIsValid(true);
      setError(null);
    } catch (e: any) {
      setIsValid(false);
      setError(e.message || 'Invalid JSON');
    }
  };

  const handleMinify = () => {
    if (!inputJson.trim()) return;
    try {
      const parsed = JSON.parse(inputJson);
      setOutputJson(JSON.stringify(parsed));
      setIsValid(true);
      setError(null);
    } catch (e: any) {
      setIsValid(false);
      setError(e.message || 'Invalid JSON');
    }
  };

  const handleValidate = () => {
    if (!inputJson.trim()) return;
    try {
      JSON.parse(inputJson);
      setIsValid(true);
      setError(null);
    } catch (e: any) {
      setIsValid(false);
      setError(e.message || 'Invalid JSON');
    }
  };

  const handleTextToJson = () => {
    if (!inputJson.trim()) return;

    const trimmed = inputJson.trim();
    let result;

    try {
      // 1. First off: Try strict JSON parse 
      result = JSON.parse(trimmed);
    } catch (e) {
      try {
        // 2. Try loose JS object to JSON repair (adds quotes to keys, fixes single quotes)
        const fixedStr = trimmed
          .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?\s*:/g, '"$2":') // Quote unquoted keys
          .replace(/:\s*'([^']*)'/g, ': "$1"') // Replace single quoted values
          .replace(/,(\s*[}\]])/g, '$1'); // Remove trailing commas
        result = JSON.parse(fixedStr);
      } catch (e2) {
        // 3. Simple Text Fallback
        const lines = trimmed.split('\n').filter(l => l.trim().length > 0);
        if (lines.length > 1) {
          // Multiple lines -> Array of strings
          result = lines.map(l => l.trim());
        } else {
          // Single line -> Object wrap
          result = { text: trimmed };
        }
      }
    }

    setOutputJson(JSON.stringify(result, null, 2));
    setIsValid(true);
    setError(null);
  };

  const handleClear = () => {
    setInputJson('');
    setOutputJson('');
    setIsValid(null);
    setError(null);
  };

  const handleCopy = () => {
    if (outputJson) {
      navigator.clipboard.writeText(outputJson);
    }
  };

  const handleCopyInput = () => {
    if (inputJson) {
      navigator.clipboard.writeText(inputJson);
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setInputJson(content);
      // Auto format on upload
      try {
        const parsed = JSON.parse(content);
        setOutputJson(JSON.stringify(parsed, null, 2));
        setIsValid(true);
        setError(null);
      } catch (err: any) {
        setIsValid(false);
        setError(err.message || 'Invalid JSON');
      }
    };
    reader.readAsText(file);
    // Reset input so the same file can be uploaded again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleDownload = () => {
    if (!outputJson && !inputJson) return;
    
    // If output is generated, download that, otherwise download input
    const contentToDownload = outputJson || inputJson;
    
    const blob = new Blob([contentToDownload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'formatted.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getLineNumbers = (text: string) => {
    return text.split('\n').map((_, i) => i + 1).join('\n');
  };

  return (
    <div className="bg-[#0f172a] text-[#e2e8f0] min-h-screen flex flex-col font-sans">
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
        <div className="flex justify-between items-center px-4 md:px-6 h-16">
          <div className="flex items-center gap-8">
            <h1 className="text-xl font-bold tracking-tighter text-[#38bdf8]">
              JSON DevTool
            </h1>
            <nav className="hidden md:flex gap-6 items-center">
              <a href="#" className="text-[#38bdf8] border-b-2 border-[#38bdf8] pb-1 font-medium text-sm">Formatter</a>
              <a href="#" className="text-slate-400 hover:text-slate-200 transition-colors duration-150 font-medium text-sm">Validator</a>
              <a href="#" className="text-slate-400 hover:text-slate-200 transition-colors duration-150 font-medium text-sm">Documentation</a>
            </nav>
          </div>
          <div className="flex gap-4 items-center">
             <button onClick={triggerFileUpload} className="text-slate-400 hover:text-slate-200 transition-colors px-3 py-1.5 rounded-md border border-slate-800 hover:bg-slate-800/50 hidden sm:block text-sm font-medium">
               Upload
             </button>
             <button onClick={handleDownload} className="bg-[#38bdf8] text-[#0f172a] hover:bg-sky-300 font-medium px-4 py-1.5 rounded-md transition-colors shadow-[0_0_15px_rgba(56,189,248,0.2)] text-sm">
               Download
             </button>
             <input type="file" accept=".json" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
          </div>
        </div>
      </header>

      <main className="flex-grow flex flex-col lg:flex-row p-4 md:p-6 gap-4 md:gap-6 overflow-hidden">
        {/* Editor Toolbar (Mobile) */}
        <div className="lg:hidden flex flex-wrap gap-2 items-center bg-[#1e293b] p-2 rounded-xl border border-slate-800">
           <button onClick={handleFormat} className="flex-1 min-w-[100px] flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-[#38bdf8] px-3 py-2 rounded-lg text-sm font-medium transition-colors" title="Strict JSON Formatter">
              <AlignLeft size={16} /> Format
           </button>
           <button onClick={handleTextToJson} className="flex-1 min-w-[100px] flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-purple-400 px-3 py-2 rounded-lg text-sm font-medium transition-colors" title="Convert Plain Text or JS Object to JSON">
               <ArrowLeftRight size={16} /> Convert
           </button>
           <button onClick={handleMinify} className="flex-1 min-w-[100px] flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-[#38bdf8] px-3 py-2 rounded-lg text-sm font-medium transition-colors" title="Minify JSON">
              <Minimize size={16} /> Minify
           </button>
           <button onClick={handleValidate} className="flex-1 min-w-[100px] flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-[#38bdf8] px-3 py-2 rounded-lg text-sm font-medium transition-colors" title="Validate JSON">
              <CheckCircle2 size={16} /> Validate
           </button>
           <div className="w-px h-6 bg-slate-700 mx-1"></div>
           <button onClick={handleClear} className="px-3 py-2 text-rose-400 hover:bg-slate-800 rounded-lg transition-colors" title="Clear">
             <Trash2 size={16} />
           </button>
        </div>

        {/* Input Panel */}
        <div className="flex-1 flex flex-col bg-[#1e293b] rounded-xl border border-slate-800 shadow-lg overflow-hidden min-h-[400px]">
          <div className="bg-slate-800/50 px-4 py-3 flex justify-between items-center border-b border-slate-800">
            <span className="font-semibold text-slate-400 flex items-center gap-2 text-sm tracking-wide">
              <Code size={16} /> INPUT JSON
            </span>
            <div className="flex gap-2">
              <button onClick={handleCopyInput} className="text-slate-500 hover:text-[#38bdf8] p-1 rounded transition-colors" title="Copy Input">
                 <Copy size={16} />
              </button>
              <button onClick={handleClear} className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors" title="Clear">
                 <Trash2 size={16} />
              </button>
            </div>
          </div>
          <div className="flex-grow flex relative">
            <div className="w-12 bg-slate-900/50 text-slate-600 text-right pr-3 py-4 font-mono select-none border-r border-slate-800 text-sm overflow-hidden whitespace-pre pointer-events-none">
              {getLineNumbers(inputJson)}
            </div>
            <textarea 
              value={inputJson}
              onChange={(e) => setInputJson(e.target.value)}
              className="flex-grow bg-transparent text-[#e2e8f0] font-mono p-4 w-full h-full min-h-[300px] resize-none outline-none focus:ring-1 focus:ring-[#38bdf8]/50 text-sm leading-relaxed whitespace-pre"
              placeholder='{"paste": "your json here"}'
              spellCheck="false"
            />
          </div>
        </div>

        {/* Action Buttons (Desktop) */}
        <div className="hidden lg:flex flex-col justify-center items-center gap-3">
          <button onClick={handleFormat} className="w-12 h-12 flex items-center justify-center bg-[#1e293b] hover:bg-slate-800 text-[#38bdf8] border border-slate-700 hover:border-[#38bdf8] hover:shadow-[0_0_10px_rgba(56,189,248,0.2)] rounded-lg transition-all duration-200 active:scale-95 group" title="Format JSON">
            <AlignLeft size={20} className="group-hover:scale-110 transition-transform" />
          </button>
          <button onClick={handleTextToJson} className="w-12 h-12 flex items-center justify-center bg-[#1e293b] hover:bg-slate-800 text-purple-400 border border-slate-700 hover:border-purple-400 hover:shadow-[0_0_10px_rgba(192,132,252,0.2)] rounded-lg transition-all duration-200 active:scale-95 group" title="Auto-Convert Plain Text or JS Object to JSON">
            <ArrowLeftRight size={20} className="group-hover:scale-110 transition-transform" />
          </button>
          <button onClick={handleMinify} className="w-12 h-12 flex items-center justify-center bg-[#1e293b] hover:bg-slate-800 text-[#38bdf8] border border-slate-700 hover:border-[#38bdf8] hover:shadow-[0_0_10px_rgba(56,189,248,0.2)] rounded-lg transition-all duration-200 active:scale-95 group" title="Minify JSON">
            <Minimize size={20} className="group-hover:scale-110 transition-transform" />
          </button>
          <button onClick={handleValidate} className="w-12 h-12 flex items-center justify-center bg-[#1e293b] hover:bg-slate-800 text-[#38bdf8] border border-slate-700 hover:border-[#38bdf8] hover:shadow-[0_0_10px_rgba(56,189,248,0.2)] rounded-lg transition-all duration-200 active:scale-95 group" title="Validate JSON">
            <CheckCircle2 size={20} className="group-hover:scale-110 transition-transform" />
          </button>
        </div>

        {/* Output Panel */}
        <div className="flex-1 flex flex-col bg-[#1e293b] rounded-xl border border-slate-800 shadow-lg overflow-hidden min-h-[400px]">
          <div className="bg-slate-800/50 px-4 py-3 flex justify-between items-center border-b border-slate-800">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-slate-400 flex items-center gap-2 text-sm tracking-wide">
                <Braces size={16} /> FORMATTED OUTPUT
              </span>
              {isValid === true && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  VALID JSON
                </span>
              )}
              {isValid === false && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  INVALID JSON
                </span>
              )}
            </div>
            <button onClick={handleCopy} className="text-slate-500 hover:text-[#38bdf8] p-1 rounded transition-colors" title="Copy Output">
               <Copy size={16} />
            </button>
          </div>
          
          <div className="flex-grow flex relative bg-slate-900/30">
            {error ? (
              <div className="p-6 text-rose-400 font-mono text-sm break-all overflow-y-auto flex flex-col gap-2 w-full">
                <div className="flex items-center gap-2 text-rose-500 font-bold mb-2">
                   <AlertCircle size={18} /> JSON Parsing Error
                </div>
                <div className="bg-rose-500/10 p-4 rounded border border-rose-500/20 text-rose-300">
                  {error}
                </div>
                <div className="text-slate-400 mt-4 text-xs font-sans">
                  The input provided does not appear to be valid JSON. Please check for syntax issues such as missing quotes, trailing commas, or unescaped characters.
                </div>
              </div>
            ) : (
              <>
                <div className="w-12 bg-slate-900/50 text-slate-600 text-right pr-3 py-4 font-mono select-none border-r border-slate-800 text-sm overflow-hidden whitespace-pre pointer-events-none">
                  {getLineNumbers(outputJson || '\n')}
                </div>
                <textarea 
                  value={outputJson}
                  readOnly
                  className="flex-grow bg-transparent text-[#e2e8f0] font-mono p-4 w-full h-full min-h-[300px] resize-none outline-none focus:ring-1 focus:ring-[#38bdf8]/50 text-sm leading-relaxed whitespace-pre"
                  placeholder="Result will appear here..."
                  spellCheck="false"
                />
              </>
            )}
          </div>
          
          <div className="bg-slate-900/80 px-4 py-2 border-t border-slate-800 flex justify-between items-center">
            <span className="text-slate-500 text-xs">
               Length: {outputJson ? outputJson.length : 0} chars
            </span>
            <span className="text-slate-500 text-xs">
               Size: {outputJson ? new Blob([outputJson]).size : 0} Bytes
            </span>
          </div>
        </div>
      </main>

      <footer className="mt-auto px-6 py-8 border-t border-slate-800/50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
          <p>&copy; 2024 JSON DevTool. High-performance JSON workflows.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Github</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

