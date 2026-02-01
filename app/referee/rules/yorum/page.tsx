
import { AlertCircle } from "lucide-react";

export default function RulesPlaceholder() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8 border-2 border-dashed border-zinc-200 rounded-2xl">
            <AlertCircle className="w-12 h-12 text-zinc-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">İçerik Hazırlanıyor</h2>
            <p className="text-zinc-500 max-w-md">
                Bu bölüm için yorumlar ve dökümanlar sisteme eklenecektir.
                (Yönetici tarafından PDF/Metin formatında eklenecek)
            </p>
        </div>
    );
}
