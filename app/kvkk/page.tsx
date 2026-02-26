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

                    <div className="p-8 md:p-12 space-y-12 text-sm">
                        {/* Giriş */}
                        <section className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-700/50 mb-8">
                            <p className="leading-relaxed text-zinc-700 dark:text-zinc-300 italic font-medium">
                                İşbu Aydınlatma Metni, 6698 sayılı Kişisel Verilerin Korunması Kanunu (“Kanun”) uyarınca, Türkiye Basketbol Federasyonu (“TBF”) tarafından işletilen Görevli Atama Sistemi (“Sistem”) üzerinden toplanan kişisel verilerinizin işlenmesine ilişkin usul ve esasları belirlemek amacıyla hazırlanmıştır.
                            </p>
                        </section>

                        {/* Section 1 */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-3 text-red-700 dark:text-red-500">
                                <Scale className="w-5 h-5" />
                                <h2 className="text-lg font-black uppercase tracking-tight italic">1. Veri Sorumlusu</h2>
                            </div>
                            <div className="pl-8 space-y-2 text-zinc-600 dark:text-zinc-400">
                                <p className="font-bold text-zinc-900 dark:text-zinc-100 italic">Türkiye Basketbol Federasyonu (TBF)</p>
                                <p>Adres: 10. Yıl Caddesi, Ömer Avni Mah. No:11, Zeytinburnu / İSTANBUL</p>
                                <p>E-posta: kvkk@tbf.org.tr</p>
                            </div>
                        </section>

                        {/* Section 2 */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-3 text-red-700 dark:text-red-500">
                                <FileText className="w-5 h-5" />
                                <h2 className="text-lg font-black uppercase tracking-tight italic">2. İşlenen Kişisel Veri Kategorileri</h2>
                            </div>
                            <div className="pl-8 grid grid-cols-1 md:grid-cols-2 gap-4 text-zinc-600 dark:text-zinc-400">
                                <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
                                    <p className="font-bold text-zinc-900 dark:text-zinc-100 mb-1 text-[10px] uppercase tracking-widest">Kimlik Bilgileri</p>
                                    <p className="text-xs">Ad-soyad, T.C. Kimlik No, Doğum Tarihi</p>
                                </div>
                                <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
                                    <p className="font-bold text-zinc-900 dark:text-zinc-100 mb-1 text-[10px] uppercase tracking-widest">İletişim Bilgileri</p>
                                    <p className="text-xs">Telefon Numarası, E-posta Adresi, İkametgah Adresi</p>
                                </div>
                                <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
                                    <p className="font-bold text-zinc-900 dark:text-zinc-100 mb-1 text-[10px] uppercase tracking-widest">Mesleki Deneyim</p>
                                    <p className="text-xs">Görev Unvanı (Hakem, Gözlemci vb.), Meslek, Lisans Bilgileri</p>
                                </div>
                                <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
                                    <p className="font-bold text-zinc-900 dark:text-zinc-100 mb-1 text-[10px] uppercase tracking-widest">Finans Bilgileri</p>
                                    <p className="text-xs">IBAN Numarası, Banka Bilgileri (Ödemelerin tahakkuku için)</p>
                                </div>
                            </div>
                        </section>

                        {/* Section 3 */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-3 text-red-700 dark:text-red-500">
                                <Shield className="w-5 h-5" />
                                <h2 className="text-lg font-black uppercase tracking-tight italic">3. Kişisel Verilerin İşlenme Amaçları</h2>
                            </div>
                            <ul className="pl-8 list-disc space-y-3 text-zinc-600 dark:text-zinc-400 marker:text-red-600 italic">
                                <li>Müsabakalara yönelik görevli atama süreçlerinin planlanması ve yürütülmesi,</li>
                                <li>Sözleşme süreçlerinin ve yasal yükümlülüklerin takibi ve ifası,</li>
                                <li>Görevli performanslarının izlenmesi, raporlanması ve istatistiksel analizlerin yapılması,</li>
                                <li>Ödeme süreçlerinin (telif, harcırah vb.) yönetilmesi ve finansal kayıtların tutulması,</li>
                                <li>Federasyon içi disiplin ve denetim faaliyetlerinin yürütülmesi.</li>
                            </ul>
                        </section>

                        {/* Section 4 */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-3 text-red-700 dark:text-red-500">
                                <Scale className="w-5 h-5 outline-red-600" />
                                <h2 className="text-lg font-black uppercase tracking-tight italic">4. Kişisel Verilerin Aktarılması</h2>
                            </div>
                            <p className="pl-8 leading-relaxed text-zinc-600 dark:text-zinc-400">
                                Kişisel verileriniz; kanunen yetkili kamu kurum ve kuruluşları (Gençlik ve Spor Bakanlığı vb.), yargı mercileri, bankalar ve Federasyonumuzun müsabaka operasyonlarını yürütmek adına iş birliği yaptığı FIBA ve benzeri uluslararası kuruluşlar ile Kanun’un 8. ve 9. maddelerinde belirtilen şartlar dahilinde paylaşılabilecektir.
                            </p>
                        </section>

                        {/* Section 5 */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-3 text-red-700 dark:text-red-500">
                                <FileText className="w-5 h-5" />
                                <h2 className="text-lg font-black uppercase tracking-tight italic">5. Veri Toplama Yöntemi ve Hukuki Sebep</h2>
                            </div>
                            <p className="pl-8 leading-relaxed text-zinc-600 dark:text-zinc-400">
                                Kişisel verileriniz, Sistem üzerindeki kayıt formları aracılığıyla tamamen veya kısmen otomatik yollarla toplanmaktadır. İşleme faaliyetleri; “bir sözleşmenin kurulması veya ifasıyla doğrudan doğruya ilgili olması kaydıyla, sözleşmenin taraflarına ait kişisel verilerin işlenmesinin gerekli olması” ve “Federasyonun hukuki yükümlülüğünü yerine getirebilmesi” hukuki sebeplerine dayanmaktadır.
                            </p>
                        </section>

                        {/* Section 6 */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-3 text-red-700 dark:text-red-500">
                                <Scale className="w-5 h-5 outline-red-600" />
                                <h2 className="text-lg font-black uppercase tracking-tight italic">6. İlgili Kişi Hakları (Madde 11)</h2>
                            </div>
                            <p className="pl-8 mb-4 text-zinc-600 dark:text-zinc-400">Veri sahibi olarak, Kanun’un 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:</p>
                            <div className="pl-8 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-tight">
                                <div className="flex items-center gap-2">• Veri işlenip işlenmediğini öğrenme</div>
                                <div className="flex items-center gap-2">• Eksik/yanlış verilerin düzeltilmesini isteme</div>
                                <div className="flex items-center gap-2">• Verilerin silinmesini/yok edilmesini isteme</div>
                                <div className="flex items-center gap-2">• Verilerin amaca uygunluğunu kontrol etme</div>
                                <div className="flex items-center gap-2">• Aktarıldığı üçüncü kişilerin bildirilmesi</div>
                                <div className="flex items-center gap-2">• Kanuna aykırı işlem sebebiyle zararın giderilmesi</div>
                            </div>
                        </section>

                        <div className="pt-8 border-t dark:border-zinc-800 text-center">
                            <p className="text-xs text-zinc-500 italic font-medium">Bu belge TBF Görevli Atama Sistemi güvenliği ve yasal uyum süreçleri kapsamında {new Date().toLocaleDateString('tr-TR')} tarihinde güncellenmiştir.</p>
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
