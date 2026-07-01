import React from 'react';
import { Download, Award, ShieldCheck, Printer, X, Sparkles } from 'lucide-react';
import { PaymentRecord } from '../types';

interface CertificateViewProps {
  payment: PaymentRecord;
  onClose: () => void;
}

export default function CertificateView({ payment, onClose }: CertificateViewProps) {
  const isMultiple = payment.passType === 'multiple' || payment.amount === '₦100,000';

  const handlePrint = () => {
    // Open the separate clean print page in a new window/tab as requested!
    const url = `${window.location.origin}/print-certificate?phone=${encodeURIComponent(payment.phone)}&paymentId=${encodeURIComponent(payment.id)}`;
    window.open(url, '_blank');
  };

  const holderName = payment.fullName || payment.receiptName.replace(/\..+$/, '').replace(/_/g, ' ') || 'HELOLEX OWNER';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-hidden animate-fade-in">
      {/* Container */}
      <div className="relative w-full max-w-4xl max-h-[calc(100vh-1rem)] sm:max-h-[90vh] bg-zinc-950/95 border border-zinc-900 rounded-2xl shadow-2xl p-4 md:p-6 flex flex-col">
        {/* Actions bar */}
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-zinc-900 no-print flex-shrink-0">
          <div className="flex items-center gap-2">
            {isMultiple ? (
              <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
            ) : (
              <Award className="w-5 h-5 text-purple-400" />
            )}
            <span className="text-xs sm:text-sm font-medium tracking-wider text-zinc-400 font-mono">
              {isMultiple ? 'MULTIPLE GAMES OWNER LICENSE' : 'SINGLE GAME OWNER LICENSE'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              id="btn-print-certificate"
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] sm:text-xs font-mono tracking-wider transition-all border cursor-pointer font-semibold ${
                isMultiple
                  ? 'bg-amber-950/20 text-amber-400 border-amber-500/30 hover:bg-amber-950/50'
                  : 'bg-purple-950/20 text-purple-300 border-purple-500/30 hover:bg-purple-950/50'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              OPEN SEPARATE PRINT PAGE
            </button>
            <button
              onClick={onClose}
              id="btn-close-certificate"
              className="p-1.5 hover:bg-zinc-900 text-zinc-500 hover:text-white rounded-lg transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Container */}
        <div className="flex-grow overflow-y-auto pr-1 space-y-4 min-h-0">
          {/* Certificate Border Area */}
          <div 
            id="certificate-print-area"
            className={`relative w-full aspect-[1.414/1] rounded-xl p-6 sm:p-12 text-center flex flex-col justify-between overflow-hidden border-[8px] sm:border-[12px] transition-all ${
              isMultiple
                ? 'bg-[#120F08] border-amber-500/20 shadow-[0_0_50px_rgba(245,158,11,0.05)]'
                : 'bg-[#0B0C12] border-purple-500/20 shadow-[0_0_50px_rgba(139,92,246,0.05)]'
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

            {/* Header / Brand */}
            <div className="relative z-10 flex flex-col items-center">
              <span className={`text-[8px] sm:text-[10px] font-mono tracking-[0.4em] font-bold uppercase ${isMultiple ? 'text-amber-500' : 'text-purple-400'}`}>
                HELOLEX GAMING OWNERSHIP
              </span>
              <h1 className={`text-base sm:text-3xl font-sans font-black tracking-wide uppercase mt-1 ${isMultiple ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200' : 'text-white'}`}>
                {isMultiple ? 'Multiple Games Ownership License' : 'Game Ownership License'}
              </h1>
              
              {/* Centered brand-aligned License Tier Badge */}
              <div className="mt-1 flex items-center justify-center">
                <span className={`px-3 py-1 rounded-full text-[7px] sm:text-[9px] font-mono tracking-widest uppercase font-black border ${
                  isMultiple 
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' 
                    : 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                }`}>
                  License Tier: {isMultiple ? 'Multiple Game Pass (VIP Lifetime)' : 'Single Game Pass (Standard Lifetime)'}
                </span>
              </div>

              <div className={`w-20 sm:w-32 h-[1px] mx-auto mt-2 ${isMultiple ? 'bg-amber-500/20' : 'bg-purple-500/20'}`} />
            </div>

            {/* Recipient Details */}
            <div className="relative z-10 my-4 space-y-1">
              <span className="text-[8px] sm:text-[9px] font-mono text-zinc-600 uppercase tracking-widest block">
                Conferred to
              </span>
              <h2 className={`text-lg sm:text-2xl font-sans font-black tracking-wide uppercase ${isMultiple ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-yellow-200 to-amber-100' : 'text-white'}`}>
                {holderName}
              </h2>
              <p className="text-[8px] sm:text-[9px] font-mono text-zinc-500">
                Registered Phone ID: <span className={isMultiple ? 'text-amber-500' : 'text-purple-400'}>{payment.phone}</span>
              </p>
            </div>

            {/* Bottom Grid: ID, Seal, Signature */}
            <div className="relative z-10 grid grid-cols-3 items-end gap-2 pt-4 border-t border-zinc-900">
              {/* Metadata */}
              <div className="text-left font-mono text-[8px] sm:text-[10px] text-zinc-500 space-y-1">
                <div>
                  <span className="uppercase tracking-widest block text-[7px] text-zinc-600">Deed Code</span>
                  <span className={`font-bold ${isMultiple ? 'text-amber-400' : 'text-purple-400'}`}>{payment.ownershipId || 'HLX-PENDING'}</span>
                </div>
                <div>
                  <span className="uppercase tracking-widest block text-[7px] text-zinc-600">Date Issued</span>
                  <span className="text-zinc-400">{payment.issueDate || payment.submittedAt.split('T')[0]}</span>
                </div>
              </div>

              {/* Official Seal */}
              <div className="flex flex-col items-center justify-center">
                <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-full p-[1px] flex items-center justify-center ${
                  isMultiple
                    ? 'bg-gradient-to-br from-yellow-300 via-amber-500 to-yellow-600'
                    : 'bg-gradient-to-br from-zinc-300 via-purple-500 to-zinc-500'
                }`}>
                  <div className="w-full h-full rounded-full bg-zinc-950 flex items-center justify-center">
                    {isMultiple ? (
                      <Sparkles className="w-4 h-4 sm:w-6 sm:h-6 text-amber-500" />
                    ) : (
                      <ShieldCheck className="w-4 h-4 sm:w-6 sm:h-6 text-purple-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Authorized signature */}
              <div className="text-right flex flex-col items-end">
                <div className="font-mono text-right mb-0.5">
                  <span className={`text-[10px] sm:text-sm italic font-serif ${isMultiple ? 'text-amber-400' : 'text-purple-400'}`}>
                    HELOLEX LABS
                  </span>
                  <div className="w-16 sm:w-24 h-[1px] bg-zinc-900" />
                </div>
                <span className="text-[6px] sm:text-[8px] font-mono text-zinc-600 uppercase tracking-widest block">
                  Authorized Sign
                </span>
              </div>
            </div>
          </div>

          {/* Info Card - no print */}
          <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl flex items-start gap-2.5 no-print">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-semibold text-zinc-200">Ownership Verified Successfully</h4>
              <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">
                This license is recorded securely under validation hash <span className="font-mono text-zinc-400">{payment.id}</span>. Print or save this document for off-line credentials.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
