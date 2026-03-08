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
                        <h1 className="text-3xl font-black uppercase tracking-tight italic relative z-10">BASKETBOL KOORDİNASYON SİSTEMİ (BKS)</h1>
                        <p className="text-red-100 mt-2 relative z-10 font-bold uppercase tracking-wide text-sm">
                            KİŞİSEL VERİLERİN KORUNMASI VE İŞLENMESİNE İLİŞKİN AYDINLATMA METNİ VE AÇIK RIZA BEYANI
                        </p>
                    </div>

                    <div className="p-8 md:p-12 space-y-8 text-sm text-zinc-700 dark:text-zinc-300">
                        <p className="leading-relaxed">
                            Basketbol Koordinasyon Sistemi (BKS) olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) uyarınca, kişisel verilerinizin hukuka uygun şekilde işlenmesi, saklanması ve korunmasına azami hassasiyet göstermekteyiz. İşbu metin, veri sorumlusu sıfatıyla BKS tarafından kişisel verilerinizin hangi kapsamda işlendiği, hangi amaçlarla kullanıldığı ve haklarınız hakkında sizleri bilgilendirmek amacıyla hazırlanmıştır.
                        </p>

                        <p className="leading-relaxed">
                            BKS kapsamında işlenen kişisel veriler; ad-soyad, T.C. kimlik numarası (gerektiğinde), doğum tarihi, iletişim bilgileri (telefon numarası, e-posta adresi), okul/kurum bilgileri, takım bilgileri, lisans bilgileri, sporcu performans verileri, antrenman ve müsabaka kayıtları, görsel ve işitsel kayıtlar (fotoğraf ve video), sistem kullanım bilgileri (IP adresi, cihaz bilgisi, log kayıtları) gibi verilerden oluşabilir. Özel nitelikli kişisel veriler (örneğin sağlık bilgileri) yalnızca açık rıza alınması ve mevzuata uygun güvenlik önlemlerinin sağlanması halinde işlenir.
                        </p>

                        <p className="leading-relaxed">
                            Kişisel verileriniz; sporcu kayıtlarının oluşturulması ve yönetilmesi, antrenman ve müsabaka organizasyonlarının planlanması, performans analizlerinin yapılması, kullanıcı hesaplarının oluşturulması, sistem güvenliğinin sağlanması, iletişim faaliyetlerinin yürütülmesi, yasal yükümlülüklerin yerine getirilmesi ve hizmet kalitesinin artırılması amaçlarıyla işlenmektedir. Veriler, KVKK’nın 5. ve 6. maddelerinde belirtilen hukuki sebepler çerçevesinde; bir sözleşmenin kurulması veya ifası, hukuki yükümlülüğün yerine getirilmesi, meşru menfaat, açık rıza ve kanunlarda açıkça öngörülmesi sebeplerine dayanılarak işlenir.
                        </p>

                        <p className="leading-relaxed">
                            Toplanan kişisel verileriniz; yetkili kamu kurum ve kuruluşları, ilgili federasyonlar, spor kulüpleri, iş ortakları, teknik hizmet sağlayıcıları ve bilişim altyapı firmaları ile, yalnızca belirtilen amaçlarla sınırlı ve ölçülü olmak kaydıyla paylaşılabilir. Verileriniz yurt içinde veya gerekli teknik altyapı hizmetlerinin sağlanması amacıyla yurt dışında bulunan sunucularda saklanabilir. Bu durumda KVKK’nın 9. maddesine uygun şekilde gerekli güvenlik tedbirleri alınır.
                        </p>

                        <p className="leading-relaxed">
                            BKS, kişisel verilerinizin hukuka aykırı olarak işlenmesini ve erişilmesini önlemek, muhafazasını sağlamak amacıyla uygun teknik ve idari tedbirleri uygular. Veriler, ilgili mevzuatta öngörülen süreler boyunca veya işleme amacının gerektirdiği süre kadar saklanır; sürenin sona ermesi halinde silinir, yok edilir veya anonim hale getirilir.
                        </p>

                        <p className="leading-relaxed">
                            KVKK’nın 11. maddesi uyarınca veri sahibi olarak; kişisel verilerinizin işlenip işlenmediğini öğrenme, işlenmişse buna ilişkin bilgi talep etme, işleme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme, yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme, eksik veya yanlış işlenmişse düzeltilmesini isteme, kanuni şartlar çerçevesinde silinmesini veya yok edilmesini talep etme, yapılan işlemlerin üçüncü kişilere bildirilmesini isteme, işlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme ve kanuna aykırı işlenmesi sebebiyle zarara uğramanız halinde zararın giderilmesini talep etme haklarına sahipsiniz. Bu kapsamda taleplerinizi yazılı olarak veya kayıtlı elektronik posta (KEP) adresi üzerinden BKS’ye iletebilirsiniz.
                        </p>

                        <section className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-700/50 mt-8">
                            <h2 className="text-lg font-black uppercase tracking-tight italic text-zinc-900 dark:text-white mb-4">AÇIK RIZA BEYANI</h2>
                            <p className="leading-relaxed font-medium italic">
                                Yukarıda yer alan aydınlatma metnini okuduğumu ve anladığımı, Basketbol Koordinasyon Sistemi (BKS) tarafından kişisel verilerimin belirtilen amaçlar doğrultusunda işlenmesine, gerektiğinde yurt içi ve yurt dışındaki hizmet sağlayıcılarla paylaşılmasına, sporcu performans analizleri kapsamında değerlendirilmesine ve fotoğraf/video kayıtlarımın organizasyon, tanıtım ve raporlama faaliyetlerinde kullanılmasına özgür irademle açık rıza verdiğimi kabul, beyan ve taahhüt ederim. Açık rızamı dilediğim zaman geri alabileceğimi bildiğimi ve bu durumda geri alma tarihinden sonraki işlemlerin durdurulacağını kabul ederim.
                            </p>
                        </section>

                        <div className="pt-8 border-t border-zinc-200 dark:border-zinc-800 text-center">
                            <p className="text-xs text-zinc-500 italic font-medium">Bu belge Basketbol Koordinasyon Sistemi güvenliği ve yasal uyum süreçleri kapsamında {new Date().toLocaleDateString('tr-TR')} tarihinde güncellenmiştir.</p>
                        </div>
                    </div>

                </div>

                <p className="mt-8 text-center text-zinc-400 text-xs font-bold italic">© 2026 Basketbol Koordinasyon Sistemi - Tüm Hakları Saklıdır</p>
            </div>
        </div>
    );
}
