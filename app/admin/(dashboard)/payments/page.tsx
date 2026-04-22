import { verifySession } from "@/lib/session";
import { redirect } from "next/navigation";
import { getPaymentConfig, getAllMatchCategories } from "@/app/actions/payments";
import { PaymentsForm } from "./PaymentsForm";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
    const session = await verifySession();
    if (session?.role !== "SUPER_ADMIN") redirect("/admin");

    const [config, allCategories] = await Promise.all([
        getPaymentConfig(),
        getAllMatchCategories(),
    ]);

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-black uppercase italic tracking-tight text-zinc-900 dark:text-white">
                    Ödeme Konfigürasyonu
                </h1>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium mt-1">
                    Maç kategorilerine ve tüm görevli türlerine göre ücretleri yapılandırın.
                </p>
            </div>
            <PaymentsForm initialConfig={config} allCategories={allCategories} />
        </div>
    );
}
