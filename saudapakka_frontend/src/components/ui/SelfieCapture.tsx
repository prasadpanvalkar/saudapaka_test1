import { useState, useRef, useCallback, useEffect } from "react";
import { Camera, RefreshCw, XCircle, CheckCircle } from "lucide-react";

interface SelfieCaptureProps {
    onCapture: (file: File) => void;
    onRetake?: () => void;
}

export default function SelfieCapture({ onCapture, onRetake }: SelfieCaptureProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const startCamera = async () => {
        setError(null);
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user" },
                audio: false,
            });
            setStream(mediaStream);
            // srcObject assignment moved to useEffect
        } catch (err) {
            console.error("Camera Error:", err);
            setError("Unable to access camera. Please allow camera permissions.");
        }
    };

    // Fix: Bind stream to video element when it becomes available
    useEffect(() => {
        if (stream && videoRef.current) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach((track) => track.stop());
            setStream(null);
        }
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext("2d");

            if (context) {
                // Ensure dimensions are valid
                if (video.videoWidth === 0 || video.videoHeight === 0) {
                    console.error("Video dimensions are 0");
                    return;
                }

                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;

                // Flip horizontally to match user preview (mirror)
                context.translate(canvas.width, 0);
                context.scale(-1, 1);

                context.drawImage(video, 0, 0, canvas.width, canvas.height);

                canvas.toBlob((blob) => {
                    if (blob) {
                        const file = new File([blob], "selfie.jpg", { type: "image/jpeg" });
                        const url = URL.createObjectURL(blob);
                        setCapturedImage(url);
                        onCapture(file);
                        stopCamera();
                    } else {
                        console.error("Failed to create blob from canvas");
                    }
                }, "image/jpeg", 0.8);
            }
        } else {
            console.error("Video or Canvas ref missing");
        }
    };

    const handleRetake = () => {
        setCapturedImage(null);
        if (onRetake) onRetake();
        startCamera();
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => stopCamera();
    }, []);

    return (
        <div className="flex flex-col items-center gap-4 p-4 border rounded-xl bg-gray-50">

            {error && (
                <div className="text-red-500 text-sm flex items-center gap-2 bg-red-50 p-3 rounded-lg border border-red-100 mb-2">
                    <XCircle className="w-4 h-4" /> {error}
                    <button onClick={startCamera} className="underline text-red-700 ml-2">Retry</button>
                </div>
            )}

            {!capturedImage ? (
                <div className="relative w-full max-w-sm aspect-[4/3] bg-black rounded-lg overflow-hidden shadow-inner flex items-center justify-center">
                    {!stream ? (
                        <div className="text-center">
                            <button
                                onClick={startCamera}
                                className="flex flex-col items-center gap-2 text-gray-400 hover:text-white transition-colors"
                            >
                                <Camera className="w-12 h-12 opacity-50" />
                                <span className="text-sm">Tap to Start Camera</span>
                            </button>
                        </div>
                    ) : (
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover transform scale-x-[-1]" // Mirror effect
                        />
                    )}
                </div>
            ) : (
                <div className="relative w-full max-w-sm aspect-[4/3] rounded-lg overflow-hidden shadow-lg border-2 border-primary-green">
                    <img
                        src={capturedImage}
                        alt="Captured Selfie"
                        className="w-full h-full object-cover transform scale-x-[-1]"
                    />
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
                        <CheckCircle className="w-3 h-3" /> Captured
                    </div>
                </div>
            )}

            {/* Hidden Canvas */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Controls */}
            <div className="flex gap-3">
                {!capturedImage ? (
                    <button
                        onClick={capturePhoto}
                        disabled={!stream}
                        className="flex items-center gap-2 bg-primary-green hover:bg-dark-green text-white px-6 py-2 rounded-full font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        <Camera className="w-5 h-5" />
                        Capture Selfie
                    </button>
                ) : (
                    <button
                        onClick={handleRetake}
                        className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 px-6 py-2 rounded-full font-medium transition-all"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Retake
                    </button>
                )}
            </div>

            <p className="text-xs text-gray-400">
                {capturedImage ? "Selfie ready for submission" : "Please ensure your face is clearly visible"}
            </p>

        </div>
    );
}
