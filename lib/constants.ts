export const TURKEY_CITIES = [
    "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Amasya", "Ankara", "Antalya", "Artvin", "Aydın", "Balıkesir",
    "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli",
    "Diyarbakır", "Edirne", "Elazığ", "Erzincan", "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkari",
    "Hatay", "Isparta", "Mersin", "İstanbul", "İzmir", "Kars", "Kastamonu", "Kayseri", "Kırklareli", "Kırşehir",
    "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Kahramanmaraş", "Mardin", "Muğla", "Muş", "Nevşehir",
    "Niğde", "Ordu", "Rize", "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas", "Tekirdağ", "Tokat",
    "Trabzon", "Tunceli", "Şanlıurfa", "Uşak", "Van", "Yozgat", "Zonguldak", "Aksaray", "Bayburt", "Karaman",
    "Kırıkkale", "Batman", "Şırnak", "Bartın", "Ardahan", "Iğdır", "Yalova", "Karabük", "Kilis", "Osmaniye", "Düzce"
].sort((a, b) => a.localeCompare(b, 'tr'));

export const OFFICIAL_TYPES = [
    { id: "REFEREE", label: "Hakem" },
    { id: "TABLE", label: "Masa Görevlisi" },
    { id: "OBSERVER", label: "Gözlemci" },
    { id: "STATISTICIAN", label: "İstatistik Görevlisi" },
    { id: "HEALTH", label: "Sağlık Görevlisi" },
    { id: "FIELD_COMMISSIONER", label: "Saha Komiseri" },
    { id: "TABLE_HEALTH", label: "Masa & Sağlıkçı" },
    { id: "TABLE_STATISTICIAN", label: "Masa & İstatistikçi" }
];

export const CLASSIFICATIONS = [
    { id: "A", label: "A Klasmanı" },
    { id: "B", label: "B Klasmanı" },
    { id: "C", label: "C Klasmanı" },
    { id: "IL_HAKEMI", label: "İl Hakemi" },
    { id: "ADAY_HAKEM", label: "Aday Hakem" },
    { id: "BELIRLENMEMIS", label: "Belirlenmemiş" }
];
