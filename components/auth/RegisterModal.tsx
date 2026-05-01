import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { Modal } from "@/components/ui/modal";
import { register, ActionState } from "@/app/actions/auth";
import { TURKEY_CITIES, ISTANBUL_DISTRICTS, SECURITY_QUESTIONS } from "@/lib/constants";
import { getPasswordStrength, filterOnlyLetters, validateIBAN } from "@/lib/validation-utils";
import { formatIBAN } from "@/lib/format-utils";

interface RegisterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSwitchToLogin: () => void;
}

const initialState: ActionState = {
    error: undefined,
    success: false,
    username: undefined,
    message: undefined,
    errors: {}
};

export function RegisterModal({ isOpen, onClose, onSwitchToLogin }: RegisterModalProps) {
    const [state, formAction, isPending] = useActionState(register, initialState);

    // Form State — TÜM alanlar controlled. React 19 <form action> her submit
    // sonrasında uncontrolled inputları otomatik resetliyor; validation hatası
    // dönerse kullanıcı verilerini kaybediyordu. Controlled state bunu önler.
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [roleType, setRoleType] = useState("");
    const [job, setJob] = useState("");
    const [city, setCity] = useState("İstanbul");
    const [district, setDistrict] = useState("");
    const [details, setDetails] = useState("");
    const [securityQuestion, setSecurityQuestion] = useState("");
    const [securityAnswer, setSecurityAnswer] = useState("");
    const [kvkk, setKvkk] = useState(false);
    const [consent, setConsent] = useState(false);
    const [strengthData, setStrengthData] = useState(getPasswordStrength(""));

    // Derived address string for the hidden input
    const fullAddress = `${city} / ${district} - ${details}`;

    // Anlık şifre eşleşme uyarısı (sadece kullanıcı her ikisini de yazdığında)
    const passwordsMismatch = passwordConfirm.length > 0 && password !== passwordConfirm;

    useEffect(() => {
        if (state.success && isOpen) {
            const msg = state.message || `Kayıt başarılı! Kullanıcı Adınız: ${state.username}\nLütfen giriş yapınız.`;
            alert(msg);
            onClose();
            onSwitchToLogin();
        }
    }, [state, isOpen, onClose, onSwitchToLogin]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Kayıt Ol">
            <form action={formAction} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1 ml-1">
                            Ad
                        </label>
                        <input
                            type="text"
                            name="firstName"
                            required
                            value={firstName}
                            onChange={(e) => setFirstName(filterOnlyLetters(e.target.value))}
                            className={`w-full px-4 py-3 border-2 rounded-2xl outline-none bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white transition-all ${state.errors?.firstName ? 'border-red-500' : 'border-transparent focus:border-red-600'}`}
                            placeholder="Ahmet"
                        />
                        {state.errors?.firstName && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1 uppercase">{state.errors.firstName}</p>}
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1 ml-1">
                            Soyad
                        </label>
                        <input
                            type="text"
                            name="lastName"
                            required
                            value={lastName}
                            onChange={(e) => setLastName(filterOnlyLetters(e.target.value))}
                            className={`w-full px-4 py-3 border-2 rounded-2xl outline-none bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white transition-all ${state.errors?.lastName ? 'border-red-500' : 'border-transparent focus:border-red-600'}`}
                            placeholder="Yılmaz"
                        />
                        {state.errors?.lastName && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1 uppercase">{state.errors.lastName}</p>}
                    </div>
                </div>



                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1 ml-1">
                            Telefon
                        </label>
                        <input
                            type="tel"
                            name="phone"
                            required
                            value={phone}
                            onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))}
                            className={`w-full px-4 py-3 border-2 rounded-2xl outline-none bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white transition-all ${state.errors?.phone ? 'border-red-500' : 'border-transparent focus:border-red-600'}`}
                            placeholder="05XXXXXXXXX"
                            maxLength={11}
                        />
                        {state.errors?.phone && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1 uppercase">{state.errors.phone}</p>}
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1 ml-1">
                            E-posta
                        </label>
                        <input
                            type="email"
                            name="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={`w-full px-4 py-3 border-2 rounded-2xl outline-none bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white transition-all ${state.errors?.email ? 'border-red-500' : 'border-transparent focus:border-red-600'}`}
                            placeholder="ornek@mail.com"
                        />
                        {state.errors?.email && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1 uppercase">{state.errors.email}</p>}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1 ml-1">
                            Şifre
                        </label>
                        <input
                            type="password"
                            name="password"
                            required
                            value={password}
                            onChange={(e) => {
                                const val = e.target.value;
                                setPassword(val);
                                setStrengthData(getPasswordStrength(val));
                            }}
                            className={`w-full px-4 py-4 border-2 rounded-2xl outline-none bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white transition-all ${state.errors?.password ? 'border-red-500' : 'border-transparent focus:border-red-600'}`}
                            placeholder="Şifre"
                        />
                        {/* Password Strength Indicator */}
                        {password && (
                            <div className="mt-2 space-y-1">
                                <div className="flex h-1 gap-1">
                                    {[1, 2, 3, 4].map((step) => (
                                        <div
                                            key={step}
                                            className={`h-full flex-1 rounded-full transition-all duration-500 ${strengthData.score >= step
                                                ? strengthData.color
                                                : "bg-zinc-200 dark:bg-zinc-800"
                                                }`}
                                        />
                                    ))}
                                </div>
                                <p className={`text-[10px] font-bold uppercase italic ${strengthData.score <= 1 ? "text-red-500" : strengthData.score <= 3 ? "text-yellow-600" : "text-emerald-500"
                                    }`}>
                                    {strengthData.label}
                                </p>
                            </div>
                        )}
                        {state.errors?.password && <p className="text-red-500 text-xs mt-1">{state.errors.password}</p>}
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1 ml-1">
                            Şifre Tekrar
                        </label>
                        <input
                            type="password"
                            name="passwordConfirm"
                            required
                            value={passwordConfirm}
                            onChange={(e) => setPasswordConfirm(e.target.value)}
                            className={`w-full px-4 py-4 border-2 rounded-2xl outline-none bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white transition-all ${passwordsMismatch ? 'border-red-500' : 'border-transparent focus:border-red-600'}`}
                            placeholder="Tekrar"
                        />
                        {passwordsMismatch && (
                            <p className="text-red-500 text-[10px] font-bold mt-1 ml-1 uppercase">Şifreler eşleşmiyor.</p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1 ml-1">
                            Göreviniz
                        </label>
                        <select
                            name="roleType"
                            required
                            value={roleType}
                            onChange={(e) => setRoleType(e.target.value)}
                            className={`w-full px-4 py-3 border-2 rounded-2xl outline-none bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white transition-all appearance-none cursor-pointer ${state.errors?.roleType ? 'border-red-500' : 'border-transparent focus:border-red-600'}`}
                        >
                            <option value="" disabled>Seçiniz</option>
                            <option value="REFEREE">Hakem</option>
                            <option value="TABLE">Masa Görevlisi</option>
                            <option value="OBSERVER">Gözlemci</option>
                            <option value="STATISTICIAN">İstatistik Görevlisi</option>
                            <option value="HEALTH">Sağlık Görevlisi</option>
                            <option value="FIELD_COMMISSIONER">Saha Komiseri</option>
                            <option value="TABLE_HEALTH">Masa & Sağlık</option>
                            <option value="TABLE_STATISTICIAN">Masa & İstatistik</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1 ml-1">
                            Meslek
                        </label>
                        <input
                            type="text"
                            name="job"
                            value={job}
                            onChange={(e) => setJob(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-transparent focus:border-red-600 rounded-2xl outline-none bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white transition-all"
                            placeholder="Mühendis vb."
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1 ml-1">
                            İl (Şehir)
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                name="city"
                                value="İstanbul"
                                readOnly
                                className="w-full px-4 py-3 border-2 border-transparent bg-zinc-100 dark:bg-zinc-900/50 text-zinc-500 dark:text-zinc-400 rounded-2xl outline-none cursor-not-allowed italic"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase">Sabit</span>
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1 ml-1">
                            İlçe / Bölge
                        </label>
                        {city === "İstanbul" ? (
                            <select
                                value={district}
                                onChange={(e) => setDistrict(e.target.value)}
                                required
                                className="w-full px-4 py-3 border-2 border-transparent focus:border-red-600 rounded-2xl outline-none bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white transition-all appearance-none cursor-pointer"
                            >
                                <option value="">Seçiniz</option>
                                {ISTANBUL_DISTRICTS.map(d => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                        ) : (
                            <input
                                type="text"
                                name="district"
                                value={district}
                                onChange={(e) => setDistrict(e.target.value)}
                                placeholder="İlçe giriniz"
                                required
                                className="w-full px-4 py-3 border-2 border-transparent focus:border-red-600 rounded-2xl outline-none bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white transition-all"
                            />
                        )}
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1 ml-1">
                        Açık Adres Detayı
                    </label>
                    <textarea
                        value={details}
                        onChange={(e) => setDetails(e.target.value)}
                        placeholder="Mahalle, Sokak, No..."
                        rows={3}
                        className="w-full px-4 py-3 border-2 border-transparent focus:border-red-600 rounded-2xl outline-none bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white transition-all resize-none"
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1 ml-1">
                            Güvenlik Sorusu
                        </label>
                        <select
                            name="securityQuestion"
                            required
                            value={securityQuestion}
                            onChange={(e) => setSecurityQuestion(e.target.value)}
                            className={`w-full px-4 py-3 border-2 rounded-2xl outline-none bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white transition-all appearance-none cursor-pointer ${state.errors?.securityQuestion ? 'border-red-500' : 'border-transparent focus:border-red-600'}`}
                        >
                            <option value="" disabled>Soru Seçiniz</option>
                            {SECURITY_QUESTIONS.map(q => <option key={q} value={q}>{q}</option>)}
                        </select>
                        {state.errors?.securityQuestion && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1 uppercase">{state.errors.securityQuestion}</p>}
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1 ml-1">
                            Güvenlik Cevabı
                        </label>
                        <input
                            type="text"
                            name="securityAnswer"
                            required
                            value={securityAnswer}
                            onChange={(e) => setSecurityAnswer(e.target.value)}
                            className={`w-full px-4 py-3 border-2 rounded-2xl outline-none bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white transition-all ${state.errors?.securityAnswer ? 'border-red-500' : 'border-transparent focus:border-red-600'}`}
                            placeholder="Cevabınız"
                        />
                        {state.errors?.securityAnswer && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1 uppercase">{state.errors.securityAnswer}</p>}
                    </div>
                </div>

                <input type="hidden" name="address" value={fullAddress} />
                <input type="hidden" name="selectedCity" value={city} />

                <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                        <input
                            type="checkbox"
                            name="kvkk"
                            required
                            id="kvkk"
                            checked={kvkk}
                            onChange={(e) => setKvkk(e.target.checked)}
                            className="mt-1 w-4 h-4 text-red-600 rounded focus:ring-red-600"
                        />
                        <label htmlFor="kvkk" className="text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer">
                            <Link href="/kvkk" target="_blank" className="font-semibold text-zinc-900 dark:text-zinc-100 hover:underline">KVKK Aydınlatma Metni</Link>'ni okudum ve anladım.
                        </label>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                        <input
                            type="checkbox"
                            name="consent"
                            required
                            id="consent"
                            checked={consent}
                            onChange={(e) => setConsent(e.target.checked)}
                            className="mt-1 w-4 h-4 text-red-600 rounded focus:ring-red-600"
                        />
                        <label htmlFor="consent" className="text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer">
                            <Link href="/kvkk" target="_blank" className="font-semibold text-zinc-900 dark:text-zinc-100 hover:underline">Açık Rıza Metni</Link> kapsamında kişisel verilerimin işlenmesini kabul ediyorum.
                        </label>
                    </div>
                </div>

                {state?.error && (
                    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm border border-red-200 dark:border-red-800">
                        {state.error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isPending || passwordsMismatch}
                    className="w-full bg-zinc-900 dark:bg-red-600 text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4 h-12 flex items-center justify-center"
                >
                    {isPending ? "KAYDEDİLİYOR..." : "KAYIT OL"}
                </button>

                <div className="text-center text-sm text-zinc-500 mt-4">
                    Zaten hesabınız var mı?{" "}
                    <button
                        type="button"
                        onClick={onSwitchToLogin}
                        className="text-red-700 dark:text-red-500 font-bold hover:underline"
                    >
                        Giriş Yap
                    </button>
                </div>
            </form>
        </Modal >
    );
}
