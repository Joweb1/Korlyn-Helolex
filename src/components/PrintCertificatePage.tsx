import React from 'react';
import { PaymentRecord, UserAccount } from '../types';
import { Award, Printer, ShieldCheck, Sparkles, Download, Loader2, AlertTriangle, X, ExternalLink } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface PrintCertificatePageProps {
  payment: PaymentRecord | undefined;
  user: UserAccount | undefined;
}

export default function PrintCertificatePage({ payment, user }: PrintCertificatePageProps) {
  const isMultiple = payment?.passType === 'multiple' || user?.passType === 'multiple';
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [showSandboxNotice, setShowSandboxNotice] = React.useState(false);
  
  // Define metadata variables at the top to avoid any scoping or TDZ issues
  const holderName = user?.fullName || payment?.receiptName.replace(/\..+$/, '').replace(/_/g, ' ') || 'HELOLEX OWNER';
  const holderPhone = user?.phone || payment?.phone || '';
  const deedId = payment?.ownershipId || 'HLX-ALLOCATION-PENDING';
  const issueDate = payment?.issueDate || payment?.submittedAt?.split('T')[0] || new Date().toISOString().split('T')[0];

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('certificate-print-layout');
    if (!element) return;

    try {
      setIsDownloading(true);
      setShowSandboxNotice(false);

      // Render element as high-quality canvas
      const canvas = await html2canvas(element, {
        scale: 2, // Scale 2 is highly optimized and crisp without memory/canvas limits
        useCORS: true, // Use CORS to resolve font & stylesheet loading security policies
        allowTaint: false, // Disallow tainted canvas to ensure export via toDataURL is authorized
        backgroundColor: isMultiple ? '#120F08' : '#0B0C12', // Match certificate background
        logging: false,
        ignoreElements: (el) => {
          // Exclude any glowing or animated borders, and any non-print interactive items
          return el.classList.contains('no-print');
        }
      });

      const imgData = canvas.toDataURL('image/png', 1.0);

      // Set standard A4 size landscape (297mm x 210mm)
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Perfect fit inside landscape A4 sheet
      pdf.addImage(imgData, 'PNG', 0, 0, 297, 210);
      pdf.save(`HELOLEX-Gaming-License-${deedId}.pdf`);
    } catch (error) {
      console.error('PDF Generation failed:', error);
      setShowSandboxNotice(true);
    } finally {
      setIsDownloading(false);
    }
  };

  if (!user && !payment) {
    return (
      <div className="min-h-screen bg-[#05070B] flex flex-col items-center justify-center text-center p-6 text-zinc-400">
        <Award className="w-12 h-12 text-zinc-600 mb-4 animate-bounce" />
        <h1 className="text-xl font-bold text-white uppercase tracking-wider">No Certificate Found</h1>
        <p className="text-xs font-mono mt-2 max-w-sm leading-relaxed">
          We couldn't locate an ownership license linked with those parameters. Please verify the link or log in to your owner dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-4 md:p-8 overflow-x-hidden font-sans select-text relative">
      
      {/* Sandbox Notice Overlay Modal */}
      {showSandboxNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md no-print">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Top red warning line */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-500 via-amber-500 to-red-500" />
            
            <button 
              onClick={() => setShowSandboxNotice(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-200 transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start gap-4 mt-2">
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-sans tracking-tight">
                  Direct PDF Download Blocked
                </h3>
                <p className="text-xs font-mono text-zinc-500 mt-0.5">
                  Browser Sandboxing Restriction
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-4 text-sm font-mono text-zinc-400">
              <p className="leading-relaxed text-xs">
                You are currently viewing this application inside a sandboxed preview iframe. 
                Browsers strictly block automated file downloads within sandbox containers to protect user security.
              </p>

              <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-xl p-4 space-y-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-[10px] font-black text-purple-400 shrink-0 mt-0.5">1</div>
                  <div>
                    <span className="font-bold text-zinc-200 block mb-0.5">Use "PRINT / SAVE AS PDF" (Recommended)</span>
                    <span className="text-zinc-400 leading-normal">
                      Click the <strong className="text-zinc-200">PRINT / SAVE AS PDF</strong> button. When the browser print window opens, set the Destination printer to <strong className="text-purple-400">Save as PDF</strong>. This compiles a pristine vector PDF!
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-[10px] font-black text-amber-400 shrink-0 mt-0.5">2</div>
                  <div>
                    <span className="font-bold text-zinc-200 block mb-0.5">Open in New Tab</span>
                    <span className="text-zinc-400 leading-normal">
                      Click the <strong className="text-zinc-200">Open in new tab</strong> icon at the top-right corner of your AI Studio workspace. In a standard tab, the <strong className="text-amber-400">DOWNLOAD DIRECT PDF</strong> button will work perfectly!
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 font-mono text-xs">
              <button
                onClick={() => setShowSandboxNotice(false)}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-all font-bold cursor-pointer"
              >
                Dismiss
              </button>
              <button
                onClick={() => {
                  setShowSandboxNotice(false);
                  handlePrint();
                }}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg shadow-purple-500/10 font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Open Print Engine</span>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Centered Actions Container (Direct download and print options side-by-side) */}
      <div className="w-full max-w-5xl mb-6 flex flex-wrap gap-3 justify-end no-print">
        <button
          onClick={handleDownloadPDF}
          disabled={isDownloading}
          id="btn-trigger-download"
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-mono font-bold tracking-wider transition-all shadow-lg hover:scale-[1.02] active:scale-95 cursor-pointer disabled:opacity-50 disabled:pointer-events-none ${
            isMultiple
              ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-amber-500/5'
              : 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-purple-500/5'
          }`}
        >
          {isDownloading ? (
            <>
              <Loader2 className="w-4.5 h-4.5 animate-spin" />
              <span>COMPILING PDF...</span>
            </>
          ) : (
            <>
              <Download className="w-4.5 h-4.5" />
              <span>DOWNLOAD DIRECT PDF</span>
            </>
          )}
        </button>

        <button
          onClick={handlePrint}
          id="btn-trigger-print"
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-mono font-bold tracking-wider transition-all shadow-lg hover:scale-[1.02] active:scale-95 cursor-pointer ${
            isMultiple
              ? 'bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-white shadow-amber-500/10'
              : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-purple-500/10'
          }`}
        >
          <Printer className="w-4.5 h-4.5" />
          <span>PRINT / SAVE AS PDF</span>
        </button>
      </div>

      {/* Printable Certificate Page container (A4 landscape ratio 1.414:1) */}
      <div 
        id="certificate-print-layout"
        className={`w-full max-w-5xl aspect-[1.414/1] rounded-2xl relative shadow-2xl p-8 sm:p-14 text-center flex flex-col justify-between overflow-hidden border-[12px] transition-all duration-500 ${
          isMultiple
            ? 'bg-[#120F08] border-amber-500/20 shadow-amber-500/10 animate-glow-multiple'
            : 'bg-[#0B0C12] border-purple-500/20 shadow-purple-500/10 animate-glow-single'
        }`}
      >
        {/* Ambient inner gradient */}
        <div className={`absolute inset-0 opacity-15 pointer-events-none ${
          isMultiple 
            ? 'bg-[radial-gradient(circle_at_center,_rgba(245,158,11,0.1)_0%,_transparent_70%)]' 
            : 'bg-[radial-gradient(circle_at_center,_rgba(147,51,234,0.1)_0%,_transparent_70%)]'
        }`} />

        {/* Vintage borders */}
        <div className={`absolute inset-2 border m-1 pointer-events-none rounded ${isMultiple ? 'border-amber-500/10' : 'border-purple-500/10'}`} />
        <div className={`absolute inset-4 border m-1 pointer-events-none rounded ${isMultiple ? 'border-amber-500/5' : 'border-purple-500/5'}`} />

        {/* Corner decorations */}
        <div className={`absolute top-0 left-0 w-6 h-6 border-t-[2px] border-l-[2px] m-4 pointer-events-none ${isMultiple ? 'border-amber-500/30' : 'border-purple-500/30'}`} />
        <div className={`absolute top-0 right-0 w-6 h-6 border-t-[2px] border-r-[2px] m-4 pointer-events-none ${isMultiple ? 'border-amber-500/30' : 'border-purple-500/30'}`} />
        <div className={`absolute bottom-0 left-0 w-6 h-6 border-b-[2px] border-l-[2px] m-4 pointer-events-none ${isMultiple ? 'border-amber-500/30' : 'border-purple-500/30'}`} />
        <div className={`absolute bottom-0 right-0 w-6 h-6 border-b-[2px] border-r-[2px] m-4 pointer-events-none ${isMultiple ? 'border-amber-500/30' : 'border-purple-500/30'}`} />

        {/* Huge Watermark Letter "H" */}
        <div className={`absolute inset-0 flex items-center justify-center opacity-[0.01] select-none pointer-events-none text-[18rem] font-black ${isMultiple ? 'text-amber-500' : 'text-purple-500'}`}>
          H
        </div>

        {/* Animated Moving Border Line/Circuit Effect (visible only on screen, hidden on print) */}
        <div className="absolute inset-0 pointer-events-none rounded-2xl overflow-hidden no-print z-20">
          <div className={`absolute top-0 left-0 h-[3px] bg-gradient-to-r from-transparent ${isMultiple ? 'via-amber-400' : 'via-purple-400'} to-transparent animate-border-top`} style={{ width: '35%' }} />
          <div className={`absolute top-0 right-0 w-[3px] bg-gradient-to-b from-transparent ${isMultiple ? 'via-amber-400' : 'via-purple-400'} to-transparent animate-border-right`} style={{ height: '35%' }} />
          <div className={`absolute bottom-0 right-0 h-[3px] bg-gradient-to-l from-transparent ${isMultiple ? 'via-amber-400' : 'via-purple-400'} to-transparent animate-border-bottom`} style={{ width: '35%' }} />
          <div className={`absolute bottom-0 left-0 w-[3px] bg-gradient-to-t from-transparent ${isMultiple ? 'via-amber-400' : 'via-purple-400'} to-transparent animate-border-left`} style={{ height: '35%' }} />
        </div>

        {/* Header / Brand */}
        <div className="relative z-10 flex flex-col items-center">
          <span id="cert-brand-text" className={`text-[10px] sm:text-[12px] font-mono tracking-[0.4em] font-bold uppercase ${isMultiple ? 'text-amber-500' : 'text-purple-400'}`}>
            HELOLEX GAMING OWNERSHIP
          </span>
          <h1 id="cert-title" className={`text-base sm:text-4xl font-sans font-black tracking-wide uppercase mt-1 ${isMultiple ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200' : 'text-white'}`}>
            {isMultiple ? 'Multiple Games Ownership License' : 'Game Ownership License'}
          </h1>
          
          {/* Centered brand-aligned License Tier Badge */}
          <div className="mt-1.5 flex items-center justify-center">
            <span id="cert-tier-badge" className={`px-4 py-1.5 rounded-full text-[9px] sm:text-[11px] font-mono tracking-widest uppercase font-black border ${
              isMultiple 
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' 
                : 'bg-purple-500/10 text-purple-400 border-purple-500/30'
            }`}>
              License Tier: {isMultiple ? 'Multiple Game Pass (VIP Lifetime)' : 'Single Game Pass (Standard Lifetime)'}
            </span>
          </div>

          <div className={`w-24 sm:w-36 h-[1px] mx-auto mt-2.5 ${isMultiple ? 'bg-amber-500/20' : 'bg-purple-500/20'}`} />
        </div>

        {/* Recipient Details */}
        <div className="relative z-10 my-4 space-y-1.5">
          <span id="cert-conferred-label" className="text-[10px] sm:text-[11px] font-mono text-zinc-600 uppercase tracking-widest block">
            Conferred to
          </span>
          <h2 id="cert-holder-name" className={`text-xl sm:text-3xl font-sans font-black tracking-wide uppercase ${isMultiple ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-yellow-200 to-amber-100' : 'text-white'}`}>
            {holderName}
          </h2>
          <p id="cert-id-key" className="text-[10px] sm:text-[11px] font-mono text-zinc-500">
            Registered Phone ID: <span className={isMultiple ? 'text-amber-500' : 'text-purple-400'}>{holderPhone}</span>
          </p>
        </div>

        {/* Bottom Grid: ID, Seal, Signature */}
        <div className="relative z-10 grid grid-cols-3 items-end gap-2 pt-6 border-t border-zinc-900">
          {/* Metadata */}
          <div id="cert-metadata-col" className="text-left font-mono text-[10px] sm:text-[12px] text-zinc-500 space-y-1">
            <div>
              <span className="uppercase tracking-widest block text-[8px] text-zinc-600">Deed Code</span>
              <span className={`font-bold ${isMultiple ? 'text-amber-400' : 'text-purple-400'}`}>{deedId}</span>
            </div>
            <div>
              <span className="uppercase tracking-widest block text-[8px] text-zinc-600">Date Issued</span>
              <span className="text-zinc-400">{issueDate}</span>
            </div>
          </div>

          {/* Official Seal */}
          <div className="flex flex-col items-center justify-center">
            <div id="cert-seal-box" className={`w-14 h-14 sm:w-20 sm:h-20 rounded-full p-[1px] flex items-center justify-center ${
              isMultiple
                ? 'bg-gradient-to-br from-yellow-300 via-amber-500 to-yellow-600'
                : 'bg-gradient-to-br from-zinc-300 via-purple-500 to-zinc-500'
            }`}>
              <div className="w-full h-full rounded-full bg-zinc-950 flex items-center justify-center">
                {isMultiple ? (
                  <Sparkles className="w-6 h-6 sm:w-10 sm:h-10 text-amber-500" />
                ) : (
                  <ShieldCheck className="w-6 h-6 sm:w-10 sm:h-10 text-purple-400" />
                )}
              </div>
            </div>
          </div>

          {/* Authorized signature */}
          <div id="cert-signature-col" className="text-right flex flex-col items-end">
            <div className="font-mono text-right mb-0.5">
              <span id="cert-signature-name" className={`text-[12px] sm:text-lg italic font-serif ${isMultiple ? 'text-amber-400' : 'text-purple-400'}`}>
                HELOLEX LABS
              </span>
              <div id="cert-signature-line" className="w-24 sm:w-36 h-[1px] bg-zinc-900" />
            </div>
            <span id="cert-signature-label" className="text-[8px] sm:text-[10px] font-mono text-zinc-600 uppercase tracking-widest block">
              Authorized Sign
            </span>
          </div>
        </div>
      </div>

      {/* Styled Printable rules to prevent blank print screens and enforce readability */}
      <style>{`
        /* Interactive Screen Animations for Premium Edge Glow */
        @keyframes edgeGlowMultiple {
          0%, 100% {
            box-shadow: 0 0 15px rgba(245, 158, 11, 0.15), inset 0 0 15px rgba(245, 158, 11, 0.05);
            border-color: rgba(245, 158, 11, 0.25);
          }
          50% {
            box-shadow: 0 0 35px rgba(245, 158, 11, 0.45), inset 0 0 25px rgba(245, 158, 11, 0.15);
            border-color: rgba(245, 158, 11, 0.5);
          }
        }

        @keyframes edgeGlowSingle {
          0%, 100% {
            box-shadow: 0 0 15px rgba(139, 92, 246, 0.15), inset 0 0 15px rgba(139, 92, 246, 0.05);
            border-color: rgba(139, 92, 246, 0.25);
          }
          50% {
            box-shadow: 0 0 35px rgba(139, 92, 246, 0.45), inset 0 0 25px rgba(139, 92, 246, 0.15);
            border-color: rgba(139, 92, 246, 0.5);
          }
        }

        /* Screen Keyframes for Edge Line Moving Circuit */
        @keyframes borderTop {
          0% { left: -35%; }
          100% { left: 100%; }
        }
        @keyframes borderRight {
          0% { top: -35%; }
          100% { top: 100%; }
        }
        @keyframes borderBottom {
          0% { right: -35%; }
          100% { right: 100%; }
        }
        @keyframes borderLeft {
          0% { bottom: -35%; }
          100% { bottom: 100%; }
        }

        .animate-border-top {
          animation: borderTop 5s linear infinite;
        }
        .animate-border-right {
          animation: borderRight 5s linear infinite;
          animation-delay: 1.25s;
        }
        .animate-border-bottom {
          animation: borderBottom 5s linear infinite;
          animation-delay: 2.5s;
        }
        .animate-border-left {
          animation: borderLeft 5s linear infinite;
          animation-delay: 3.75s;
        }

        .animate-glow-multiple {
          animation: edgeGlowMultiple 4s ease-in-out infinite;
        }

        .animate-glow-single {
          animation: edgeGlowSingle 4s ease-in-out infinite;
        }

        @media print {
          /* Force page-adjust settings for background colors and gradients */
          html, body, #root, main, .min-h-screen {
            display: block !important;
            background-color: #05070B !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 297mm !important;
            height: 210mm !important;
            min-height: 0 !important;
            position: relative !important; /* Establishes the absolute coordinate frame to guarantee absolute centering */
            overflow: hidden !important;
          }

          /* Force hide any elements with the no-print class from taking up layout flow space */
          .no-print {
            display: none !important;
          }
          
          /* Hide all other elements safely using visibility to prevent layout breakage */
          body * {
            visibility: hidden !important;
          }
          
          #certificate-print-layout {
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            position: absolute !important;
            left: 50% !important;
            top: 50% !important;
            transform: translate(-50%, -50%) !important; /* Perfect absolute centering inside A4 landscape boundaries */
            width: 277mm !important; /* Slightly smaller than 297mm to prevent horizontal clipping */
            height: 190mm !important; /* Leaves plenty of safety space to avoid bottom cutting */
            box-sizing: border-box !important;
            border: 11px solid ${isMultiple ? '#f59e0b' : '#8b5cf6'} !important;
            background-color: ${isMultiple ? '#120F08' : '#0B0C12'} !important;
            border-radius: 8px !important;
            box-shadow: none !important;
            margin: 0 !important;
            padding: 30px 45px !important; /* Elegant tighter padding for perfect A4 landscape fitting */
            page-break-inside: avoid !important;
            visibility: visible !important;
          }

          /* Force high-contrast visibility for all nested details on dark paper */
          #certificate-print-layout * {
            visibility: visible !important;
            background-image: initial !important;
            text-shadow: none !important;
          }

          /* Micro-borders and ambient radial styling under webkit-adjust */
          #certificate-print-layout .absolute {
            position: absolute !important;
          }

          /* Adjust headings and space to safely prevent overflow */
          #certificate-print-layout h1#cert-title {
            font-size: 34pt !important;
            margin-bottom: 8px !important;
            letter-spacing: 0.08em !important;
          }

          #certificate-print-layout h2#cert-holder-name {
            font-size: 58pt !important;
            margin-top: 10px !important;
            margin-bottom: 10px !important;
            line-height: 1.15 !important;
          }

          #certificate-print-layout p {
            font-size: 13.5pt !important;
            line-height: 1.5 !important;
          }

          /* Top header tiny tracking labels */
          #certificate-print-layout #cert-brand-text {
            font-size: 14pt !important;
            letter-spacing: 0.45em !important;
            display: inline-block !important;
          }

          /* Increase the Tier level badge size */
          #certificate-print-layout #cert-tier-badge {
            font-size: 13.5pt !important;
            padding: 8px 22px !important;
            border-radius: 9999px !important;
            display: inline-block !important;
          }

          /* "Conferred and Conceded To" label */
          #certificate-print-layout #cert-conferred-label {
            font-size: 12.5pt !important;
            display: block !important;
            margin-bottom: 6px !important;
          }

          /* Account Registration ID Key text */
          #certificate-print-layout #cert-id-key {
            font-size: 13.5pt !important;
          }

          /* Bottom Row items metadata */
          #certificate-print-layout #cert-metadata-col {
            font-size: 13.5pt !important;
            line-height: 1.5 !important;
          }

          #certificate-print-layout #cert-metadata-col .uppercase {
            font-size: 11pt !important;
            margin-bottom: 4px !important;
            display: block !important;
          }

          /* Official Seal resizing */
          #certificate-print-layout #cert-seal-box {
            width: 104px !important;
            height: 104px !important;
          }

          #certificate-print-layout #cert-seal-box svg {
            width: 48px !important;
            height: 48px !important;
          }

          #certificate-print-layout #cert-seal-box span {
            font-size: 10pt !important;
            letter-spacing: 0.15em !important;
            margin-top: 6px !important;
          }

          /* Authorized Signature */
          #certificate-print-layout #cert-signature-col {
            font-size: 13.5pt !important;
          }

          #certificate-print-layout #cert-signature-name {
            font-size: 24pt !important;
          }

          #certificate-print-layout #cert-signature-line {
            width: 180px !important;
            margin-top: 6px !important;
          }

          #certificate-print-layout #cert-signature-label {
            font-size: 11pt !important;
            margin-top: 6px !important;
            display: block !important;
          }

          /* Keep standard text colors visible against dark backgrounds */
          #certificate-print-layout .text-white {
            color: #ffffff !important;
            -webkit-text-fill-color: #ffffff !important;
          }
          #certificate-print-layout .text-zinc-100 {
            color: #f4f4f5 !important;
            -webkit-text-fill-color: #f4f4f5 !important;
          }
          #certificate-print-layout .text-zinc-300 {
            color: #d4d4d8 !important;
            -webkit-text-fill-color: #d4d4d8 !important;
          }
          #certificate-print-layout .text-zinc-400 {
            color: #a1a1aa !important;
            -webkit-text-fill-color: #a1a1aa !important;
          }
          #certificate-print-layout .text-zinc-500 {
            color: #71717a !important;
            -webkit-text-fill-color: #71717a !important;
          }
          #certificate-print-layout .text-zinc-600 {
            color: #52525b !important;
            -webkit-text-fill-color: #52525b !important;
          }

          /* Ensure proper gold/amber highlights */
          #certificate-print-layout .text-amber-400 {
            color: #fbbf24 !important;
            -webkit-text-fill-color: #fbbf24 !important;
          }
          #certificate-print-layout .text-amber-500 {
            color: #f59e0b !important;
            -webkit-text-fill-color: #f59e0b !important;
          }
          #certificate-print-layout .bg-amber-500\\/10 {
            background-color: rgba(245, 158, 11, 0.15) !important;
          }
          #certificate-print-layout .border-amber-500\\/30 {
            border-color: rgba(245, 158, 11, 0.4) !important;
          }

          /* Ensure proper purple/violet highlights */
          #certificate-print-layout .text-purple-400 {
            color: #c084fc !important;
            -webkit-text-fill-color: #c084fc !important;
          }
          #certificate-print-layout .text-purple-500 {
            color: #a855f7 !important;
            -webkit-text-fill-color: #a855f7 !important;
          }
          #certificate-print-layout .bg-purple-500\\/10 {
            background-color: rgba(168, 85, 247, 0.15) !important;
          }
          #certificate-print-layout .border-purple-500\\/30 {
            border-color: rgba(168, 85, 247, 0.4) !important;
          }

          /* Fallback colors for gradient headings to be highly readable */
          #certificate-print-layout h2.text-transparent {
            color: ${isMultiple ? '#fef08a' : '#ffffff'} !important;
            -webkit-text-fill-color: ${isMultiple ? '#fef08a' : '#ffffff'} !important;
            background: none !important;
          }
          #certificate-print-layout h1.text-transparent {
            color: ${isMultiple ? '#fef08a' : '#ffffff'} !important;
            -webkit-text-fill-color: ${isMultiple ? '#fef08a' : '#ffffff'} !important;
            background: none !important;
          }

          /* Seal container inner background color override */
          #certificate-print-layout .bg-zinc-950 {
            background-color: #05070B !important;
          }

          /* Frame and Corner decorations borders force */
          #certificate-print-layout .border-amber-500\\/10,
          #certificate-print-layout .border-amber-500\\/5 {
            border-color: rgba(245, 158, 11, 0.2) !important;
          }
          #certificate-print-layout .border-purple-500\\/10,
          #certificate-print-layout .border-purple-500\\/5 {
            border-color: rgba(168, 85, 247, 0.2) !important;
          }
          #certificate-print-layout .border-t-\\[3px\\] {
            border-top-width: 3px !important;
          }
          #certificate-print-layout .border-b-\\[3px\\] {
            border-bottom-width: 3px !important;
          }
          #certificate-print-layout .border-l-\\[3px\\] {
            border-left-width: 3px !important;
          }
          #certificate-print-layout .border-r-\\[3px\\] {
            border-right-width: 3px !important;
          }

          @page {
            size: landscape;
            margin: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
