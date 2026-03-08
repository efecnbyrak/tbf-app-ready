'use client'

import { useState } from "react";
import { Settings, X, Save, Phone, Mail } from "lucide-react";
import { updateRefereeProfile } from "@/app/actions/referee";
import { formatIBAN } from "@/lib/format-utils";

interface ProfileSettingsProps {
    currentEmail: string;
    currentPhone: string;
    currentAddress: string;
    currentIban: string;
}

export function ProfileSettings({ currentEmail, currentPhone, currentAddress, currentIban }: ProfileSettingsProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    // Form state defaults
    const [email, setEmail] = useState(currentEmail);
    const [phone, setPhone] = useState(currentPhone);
    const [address, setAddress] = useState(currentAddress);
    const [iban, setIban] = useState(formatIBAN(currentIban));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        setSuccessMessage("");

        const formData = new FormData();
        formData.append("email", email);
        formData.append("phone", phone);
        formData.append("address", address || "");
        formData.append("iban", iban || "");

        const result = await updateRefereeProfile(formData);

        if (result?.error) {
            setError(result.error);
        } else {
            setSuccessMessage(result.message || "Güncelleme başarılı!");
            setTimeout(() => {
                setIsOpen(false);
                setSuccessMessage("");
            }, 3000);
        }
        setIsLoading(false);
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-zinc-600 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                title="Ayarlar"
            >
                <Settings className="w-4 h-4" />
                <span>Ayarlar</span>
            </button>

            {/* Modal Overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-zinc-200 dark:border-zinc-800">

                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                            <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                <Settings className="w-5 h-5 text-red-600" />
                                Profil Ayarları
                            </h3>
                            <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">

                            {error && (
                                <div className="p-3 bg-red-100 text-red-700 text-sm rounded-lg flex items-center gap-2">
                                    <X className="w-4 h-4" />
                                    {error}
                                </div>
                            )}

                            {successMessage && (
                                <div className="p-3 bg-green-100 text-green-700 text-sm rounded-lg flex items-center gap-2">
                                    <CheckIcon />
                                    {successMessage}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-zinc-900 dark:text-zinc-300 mb-1">
                                        E-posta Adresi
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                                            <Mail className="w-4 h-4" />
                                        </div>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full pl-10 pr-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none dark:bg-zinc-800 dark:text-white text-zinc-900"
                                            placeholder="ornek@mail.com"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-zinc-900 dark:text-zinc-300 mb-1">
                                        Telefon Numarası
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                                            <Phone className="w-4 h-4" />
                                        </div>
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            className="w-full pl-10 pr-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none dark:bg-zinc-800 dark:text-white text-zinc-900"
                                            placeholder="0555 555 55 55"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-zinc-900 dark:text-zinc-300 mb-1">
                                        IBAN Numarası
                                    </label>
                                    <input
                                        type="text"
                                        value={iban}
                                        onChange={(e) => setIban(formatIBAN(e.target.value))}
                                        className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none dark:bg-zinc-800 dark:text-white text-zinc-900 font-mono text-sm tracking-wider"
                                        placeholder="TR00 0000 0000 0000 0000 0000 00"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-zinc-900 dark:text-zinc-300 mb-1">
                                        Açık Adres
                                    </label>
                                    <textarea
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none dark:bg-zinc-800 dark:text-white text-zinc-900 resize-none text-sm"
                                        placeholder="Tam adresinizi giriniz..."
                                    />
                                </div>
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full flex items-center justify-center gap-2 bg-red-700 text-white font-semibold py-2.5 rounded-lg hover:bg-red-800 transition-colors disabled:opacity-50"
                                >
                                    {isLoading ? (
                                        <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            Kaydet
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

function CheckIcon() {
    return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
    )
}
