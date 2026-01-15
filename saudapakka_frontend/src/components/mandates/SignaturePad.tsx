"use client";

import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Eraser, Check } from 'lucide-react';

interface SignaturePadProps {
    onEnd: (file: File | null) => void;
}

const SignaturePad: React.FC<SignaturePadProps> = ({ onEnd }) => {
    const sigPad = useRef<any>(null);
    const [isEmpty, setIsEmpty] = useState(true);

    const clear = () => {
        sigPad.current?.clear();
        setIsEmpty(true);
        onEnd(null);
    };

    const save = () => {
        if (sigPad.current?.isEmpty()) return;

        // Convert to blob/file
        sigPad.current?.getCanvas().toBlob((blob: Blob | null) => {
            if (blob) {
                const file = new File([blob], "signature.png", { type: "image/png" });
                onEnd(file);
            }
        });
    };

    return (
        <div className="space-y-4">
            <div className="border-2 border-gray-200 rounded-xl bg-gray-50 p-1">
                <div className="bg-white rounded-lg overflow-hidden relative group border border-gray-100 shadow-sm">
                    <SignatureCanvas
                        ref={sigPad}
                        penColor="black"
                        canvasProps={{
                            className: 'w-full h-56 cursor-crosshair bg-white'
                        }}
                        onBegin={() => setIsEmpty(false)}
                    />
                    {isEmpty && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="text-gray-300 text-lg font-medium">Sign Here</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex justify-between items-center px-1">
                <button
                    onClick={(e) => { e.preventDefault(); clear(); }}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                    <Eraser className="w-4 h-4" />
                    Clear
                </button>
                <button
                    onClick={(e) => { e.preventDefault(); save(); }}
                    disabled={isEmpty}
                    className="flex items-center gap-2 px-6 py-2 text-sm font-bold text-white bg-primary-green hover:bg-dark-green rounded-lg shadow-md shadow-green-900/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95"
                >
                    <Check className="w-4 h-4" />
                    Confirm Signature
                </button>
            </div>
        </div>
    );
};

export default SignaturePad;
