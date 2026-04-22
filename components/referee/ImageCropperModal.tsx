import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import getCroppedImg from '@/lib/cropImage';
import { X, Check } from 'lucide-react';

interface ImageCropperModalProps {
    imageSrc: string;
    onCropComplete: (croppedBlob: Blob) => void;
    onClose: () => void;
}

export function ImageCropperModal({ imageSrc, onCropComplete, onClose }: ImageCropperModalProps) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    const onCropCompleteCallback = useCallback((croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const showCroppedImage = useCallback(async () => {
        try {
            if (!imageSrc || !croppedAreaPixels) return;
            const croppedImageBlob = await getCroppedImg(
                imageSrc,
                croppedAreaPixels,
                0 // rotation
            );
            if (croppedImageBlob) {
                onCropComplete(croppedImageBlob);
            }
        } catch (e) {
            console.error(e);
        }
    }, [imageSrc, croppedAreaPixels, onCropComplete]);

    return (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
            <div className="relative w-full max-w-2xl bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl border border-zinc-700/50 p-6 mx-4">

                <h3 className="text-xl font-bold text-white mb-6 text-center tracking-tight">
                    Fotoğrafı Ortalayın
                </h3>

                <div className="relative w-full h-[60vh] sm:h-[400px] rounded-2xl overflow-hidden bg-black/50 border border-zinc-800">
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        cropShape="round"
                        showGrid={false}
                        onCropChange={setCrop}
                        onCropComplete={onCropCompleteCallback}
                        onZoomChange={setZoom}
                    />
                </div>

                <div className="mt-8 mb-4">
                    <div className="flex items-center gap-4 text-zinc-400 text-sm font-medium">
                        <span>Uzak</span>
                        <input
                            type="range"
                            value={zoom}
                            min={1}
                            max={3}
                            step={0.1}
                            aria-labelledby="Zoom"
                            onChange={(e) => {
                                setZoom(Number(e.target.value))
                            }}
                            className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-white"
                        />
                        <span>Yakın</span>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 mt-8">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl text-zinc-300 font-semibold hover:bg-zinc-800 hover:text-white transition-colors"
                    >
                        İptal
                    </button>
                    <button
                        onClick={showCroppedImage}
                        className="px-6 py-2.5 rounded-xl bg-white text-black font-bold hover:bg-zinc-200 transition-colors flex items-center gap-2"
                    >
                        Uygula <Check className="w-4 h-4" />
                    </button>
                </div>

                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-full transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
