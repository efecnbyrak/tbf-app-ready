"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Camera, Loader2, User } from "lucide-react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { ImageCropperModal } from "./ImageCropperModal";

interface ProfileAvatarUploaderProps {
    currentImageUrl: string | null;
    userName: string;
    onUploadCompleteAction: (formData: FormData) => Promise<{ success?: boolean; error?: string; url?: string }>;
}

export function ProfileAvatarUploader({ currentImageUrl, userName, onUploadCompleteAction }: ProfileAvatarUploaderProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [selectedFileUrl, setSelectedFileUrl] = useState<string | null>(null);
    const [selectedFileName, setSelectedFileName] = useState<string>("");

    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Size check: ~2MB max (2 * 1024 * 1024 bytes)
        const MAX_SIZE = 2 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
            toast.error("Dosya boyutu çok yüksek. Lütfen en fazla 2MB boyutunda bir fotoğraf seçin.");
            return;
        }

        // Type check
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            toast.error("Geçersiz format. Lütfen JPG, PNG veya WEBP formatında bir resim yükleyin.");
            return;
        }

        // Open cropper modal instead of uploading directly
        setSelectedFileName(file.name);
        setSelectedFileUrl(URL.createObjectURL(file));

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleCropComplete = async (croppedBlob: Blob) => {
        setSelectedFileUrl(null); // Close modal
        setIsUploading(true);
        const toastId = toast.loading("Fotoğraf yükleniyor...");

        try {
            // Convert cropped Blob to File
            const newFile = new File([croppedBlob], selectedFileName || "cropped_avatar.jpeg", {
                type: "image/jpeg"
            });

            const formData = new FormData();
            formData.append("file", newFile);

            // Trigger Server Action directly, passing FormData instead of using Vercel Client
            const result = await onUploadCompleteAction(formData);

            if (result.error) {
                toast.error(result.error, { id: toastId });
            } else {
                toast.success("Profil fotoğrafı güncellendi!", { id: toastId });
                router.refresh();
            }
        } catch (error: any) {
            console.error(error);
            const errMsg = error.message || "Fotoğraf yüklenirken bir hata oluştu veya yetkisiz işlem.";
            toast.error(errMsg, { id: toastId });
        } finally {
            setIsUploading(false);
        }
    };

    const handleCropClose = () => {
        if (selectedFileUrl) {
            URL.revokeObjectURL(selectedFileUrl);
        }
        setSelectedFileUrl(null);
    };

    return (
        <div className="relative w-20 h-20 rounded-full bg-zinc-200 dark:bg-zinc-800 border-2 border-zinc-100 dark:border-zinc-700 group flex-shrink-0">
            {currentImageUrl ? (
                <Image
                    src={currentImageUrl}
                    alt={userName}
                    fill
                    className="object-cover rounded-full"
                    priority
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-400 dark:text-zinc-500 rounded-full">
                    <User className="w-8 h-8" />
                </div>
            )}

            {/* Hover Overlay (Desktop) */}
            <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className={`absolute inset-0 flex flex-col items-center justify-center rounded-full transition-all duration-200 
                ${isUploading ? 'bg-black/50 opacity-100' : 'bg-black/40 opacity-0 md:group-hover:opacity-100 cursor-pointer'} 
                backdrop-blur-[2px] z-10`}
            >
                {isUploading ? (
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                ) : (
                    <>
                        <Camera className="w-6 h-6 text-white mb-1 drop-shadow-md hidden md:block" />
                        <span className="text-[8px] font-bold text-white uppercase tracking-wider drop-shadow-md hidden md:block">
                            Değiştir
                        </span>
                    </>
                )}
            </button>

            {/* Persistent Camera Badge (Mobile & Small screens) */}
            {!isUploading && (
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 w-7 h-7 bg-red-600 rounded-full border-2 border-white dark:border-zinc-900 flex items-center justify-center shadow-lg cursor-pointer transform translate-x-1 translate-y-1 z-20 transition-transform active:scale-90"
                >
                    <Camera className="w-4 h-4 text-white" />
                </div>
            )}

            {/* Hidden Input File */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/jpeg, image/png, image/webp"
                className="hidden"
            />

            {/* Cropper Modal */}
            {selectedFileUrl && (
                <ImageCropperModal
                    imageSrc={selectedFileUrl}
                    onCropComplete={handleCropComplete}
                    onClose={handleCropClose}
                />
            )}
        </div>
    );
}
