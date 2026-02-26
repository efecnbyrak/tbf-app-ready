"use client";

import Link from "next/link";
import { ChevronLeft, Shield, Scale, FileText } from "lucide-react";

export default function KVKKPage() {
    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 font-bold mb-8 transition-colors"
                >
                    <ChevronLeft className="w-5 h-5" />
                    Ana Sayfaya Dön
                </Link>

                <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                    <div className="bg-red-700 p-8 text-white relative overflow-hidden">
                        <div className="absolute right-0 top-0 opacity-10 -translate-y-1/4 translate-x-1/4">
                            <Shield className="w-64 h-64" />
                        </div>
                        <h1 className="text-3xl font-black uppercase tracking-tight italic relative z-10">KVKK Aydınlatma Metni</h1>
                        <p className="text-red-100 mt-2 relative z-10 font-medium">Kişisel Verilerin Korunması ve İşlenmesine İlişkin Bilgilendirme</p>
                    </div>

                    <div className="p-8 md:p-12 space-y-10">
                        {/* Section 1 */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-3 text-red-600">
                                <Scale className="w-6 h-6 outline-red-600" />
                                <h2 className="text-xl font-black uppercase tracking-tight italic">1. Veri Sorumlusu</h2>
                            </div>
                            <p className="leading-relaxed text-zinc-600 dark:text-zinc-400">
                                6698 sayılı Kişisel Verilerin Korunması Kanunu ("Kanun") uyarınca, kişisel verileriniz; veri sorumlusu sıfatıyla **Türkiye Basketbol Federasyonu ("TBF")** tarafından aşağıda açıklanan kapsamda işlenebilecektir.
                            </p>
                        </section>

                        {/* Section 2 */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-3 text-red-600">
                                <FileText className="w-6 h-6" />
                                <h2 className="text-xl font-black uppercase tracking-tight italic">2. Kişisel Verilerin İşlenme Amacı</h2>
                            </div>
                            <p className="leading-relaxed text-zinc-600 dark:text-zinc-400">
                                Toplanan kişisel verileriniz, Kanun'un 5. ve 6. maddelerinde belirtilen kişisel veri işleme şartları ve amaçları dahilinde; hakem atama süreçlerinin yönetilmesi, performans takibi, iletişim faaliyetlerinin yürütülmesi ve yasal yükümlülüklerin yerine getirilmesi amacıyla işlenmektedir.
                            </p>
                            <ul className="list-disc list-inside space-y-2 text-zinc-600 dark:text-zinc-400 ml-4 italic">
                                <li>Atama süreçlerinin profesyonel takibi</li>
                                <li>İletişim ve bilgilendirme duyuruları</li>
                                <li>İstatistiksel analizler ve raporlama</li>
                            </ul>
                        </section>

                        {/* Section 3 */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-3 text-red-600">
                                <Shield className="w-6 h-6" />
                                <h2 className="text-xl font-black uppercase tracking-tight italic">3. Verilerin Aktarıldığı Taraflar</h2>
                            </div>
                            <p className="leading-relaxed text-zinc-600 dark:text-zinc-400">
                                Kişisel verileriniz, Kanun'un 8. ve 9. maddelerinde belirtilen kişisel veri işleme şartları çerçevesinde; yetkili kamu kurum ve kuruluşları ile operasyonel süreçlerin yürütülmesi adına sınırlı ve ölçülü olarak paylaşılabilecektir.
                            </p>
                        </section>

                        {/* Section 4 */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-3 text-red-600">
                                <Scale className="w-6 h-6 outline-red-600" />
                                <h2 className="text-xl font-black uppercase tracking-tight italic">4. İlgili Kişi Hakları</h2>
                            </div>
                            <p className="leading-relaxed text-zinc-600 dark:text-zinc-400">
                                Kanun'un 11. maddesi uyarınca veri sahipleri; verilerinin işlenip işlenmediğini öğrenme, işlenmişse bilgi talep etme, işlenme amacını ve bu amaca uygun kullanılıp kullanılmadığını öğrenme haklarına sahiptir.
                            </p>
                        </section>

                        <div className="pt-8 border-t dark:border-zinc-800 text-center">
                            <p className="text-xs text-zinc-500 italic">Bu belge TBF Atama Sistemi kullanımı için bilgilendirme amaçlıdır. {new Date().toLocaleDateString('tr-TR')} tarihinde güncellenmiştir.</p>
                        </div>
                    </div>
                </div>

                <footer className="mt-12 text-center text-zinc-500 text-sm">
                    © {new Date().getFullYear()} Türkiye Basketbol Federasyonu. Tüm hakları saklıdır.
                </footer>
            </div>
        </div>
    );
}
