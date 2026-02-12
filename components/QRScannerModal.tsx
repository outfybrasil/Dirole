import React, { useEffect, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { triggerHaptic } from '../services/mockService';

interface QRScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onScan: (decodedText: string) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({ isOpen, onClose, onScan }) => {
    const [scanError, setScanError] = useState<string | null>(null);
    // const scannerRef = React.useRef<Html5Qrcode | null>(null); // Removed in favor of local variable in useEffect

    useEffect(() => {
        let isMounted = true;
        let scannerInstance: Html5Qrcode | null = null;
        let isScanning = false;

        if (!isOpen) return;

        const startScanner = async () => {
            // Wait for modal animation/DOM
            await new Promise(r => setTimeout(r, 500));
            if (!isMounted) return;

            try {
                // Ensure element exists
                if (!document.getElementById("reader")) {
                    console.warn("Reader element not found");
                    return;
                }

                const scanner = new Html5Qrcode("reader");
                scannerInstance = scanner;

                await scanner.start(
                    { facingMode: "environment" },
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                        aspectRatio: 1.0,
                    },
                    (decodedText) => {
                        if (!isMounted) return;
                        triggerHaptic();
                        onScan(decodedText);
                        // Cleanup is handled by the useEffect return or manual close
                    },
                    (errorMessage) => {
                        // ignore
                    }
                );
                isScanning = true;
            } catch (err) {
                if (isMounted) {
                    console.warn("Start failed", err);
                    setScanError("Erro ao iniciar câmera. Verifique as permissões.");
                }
            }
        };

        startScanner();

        return () => {
            isMounted = false;
            if (scannerInstance) {
                // Only stop if we actually started successfully
                if (isScanning) {
                    scannerInstance.stop().then(() => {
                        return scannerInstance?.clear();
                    }).catch(err => {
                        console.warn("Cleanup error", err);
                        // Force clear if stop fails
                        try { scannerInstance?.clear(); } catch (e) { }
                    });
                } else {
                    // If we didn't start, just clear
                    try { scannerInstance.clear(); } catch (e) { }
                }
            }
        };
    }, [isOpen, onScan]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[700] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-md mx-4 bg-[#0f0518] rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col">

                {/* Header */}
                <div className="p-6 flex justify-between items-center border-b border-white/5 bg-white/5">
                    <h3 className="text-white font-black text-lg uppercase tracking-wider italic">Scanner QR</h3>
                    <button
                        onClick={() => { triggerHaptic(); onClose(); }}
                        className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white active:scale-95 transition-all"
                    >
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                {/* Scanner Area */}
                <div className="p-6 flex-1 flex flex-col items-center justify-center min-h-[400px]">
                    <div id="reader" className="w-full overflow-hidden rounded-2xl border-2 border-dirole-primary/50 shadow-[0_0_30px_rgba(139,92,246,0.2)] bg-black h-[300px]">
                        {!scanError && <div className="p-10 text-center text-slate-500 h-full flex items-center justify-center">Iniciando câmera...</div>}
                    </div>
                    {scanError && (
                        <div className="text-red-500 font-bold mt-4 text-center text-sm">{scanError}</div>
                    )}
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-6 text-center">
                        Aponte a câmera para um código QR
                    </p>
                </div>

            </div>
            <style>{`
                video {
                    object-fit: cover !important;
                    border-radius: 12px;
                    width: 100% !important;
                    height: 100% !important;
                }
            `}</style>
        </div>
    );
};
