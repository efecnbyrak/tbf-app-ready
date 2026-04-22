export interface PaymentRate {
    basHakem: number;
    yardimciHakem: number;
    gozlemci: number;
    masaGorevlisi: number;
    istatistikci: number;
    saglikci: number;
    sahaKomiseri: number;
}

export interface CategoryRate {
    id: string;
    name: string;
    rates: PaymentRate;
}

export interface PaymentConfig {
    okulMaclari: PaymentRate;
    bolgeMaclari: PaymentRate;
    kategoriler: CategoryRate[];
}

export const EMPTY_RATE: PaymentRate = {
    basHakem: 0,
    yardimciHakem: 0,
    gozlemci: 0,
    masaGorevlisi: 0,
    istatistikci: 0,
    saglikci: 0,
    sahaKomiseri: 0,
};
