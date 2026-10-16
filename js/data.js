/* Демо-данные. Цены, характеристики и модели — заглушки, их нужно сверить с владельцем.
   В полной версии всё это придёт с сервера. */
window.RC = window.RC || {};

RC.BIZ = {
  name: "RentCar",
  city: "Томск",
  address: "ул. Пушкина, 61а",
  place: "Мерседес-центр, парковка у шоурума",
  phoneShort: "34-24-24",
  phoneTel: "+73822342424",
  phonePretty: "+7 (3822) 34-24-24",
  hours: "Ежедневно, 9:00–21:00",
  lessor: "ИП ________________ (данные владельца)",
  /* Координаты точки выдачи (по данным 2ГИС): широта 56.499881, долгота 84.988441 */
  lat: 56.499881,
  lon: 84.988441,
  yandex: "https://yandex.ru/maps/?pt=84.988441,56.499881&z=14&l=map",
  yandexRoute: "https://yandex.ru/maps/?rtext=~56.499881,84.988441&rtt=auto",
  /* Масштаб 14: видно район и дорогу до центра */
  yandexWidget: "https://yandex.ru/map-widget/v1/?ll=84.975%2C56.493&z=14&pt=84.988441%2C56.499881%2Cpm2blm",
  district: "Октябрьский район, около 3 км к северо-востоку от центра",
  gis: "https://2gis.ru/tomsk/firm/422740746064782",
  vk: "https://vk.com/",
  max: "https://max.ru/"
};

/* Классы показаны как режимы езды на переключателе */
RC.CLASSES = {
  econom:  { label: "Эконом",  deposit: 5000,  minAge: 21, minExp: 2, mileage: 300 },
  comfort: { label: "Комфорт", deposit: 10000, minAge: 21, minExp: 2, mileage: 300 },
  premium: { label: "Премиум", deposit: 30000, minAge: 25, minExp: 5, mileage: 250 }
};

/* Тарифная сетка по сроку аренды: цена за сутки падает с ростом срока */
RC.TIERS = [
  { from: 1,  to: 2,   label: "1–2 суток" },
  { from: 3,  to: 6,   label: "3–6 суток" },
  { from: 7,  to: 13,  label: "7–13 суток" },
  { from: 14, to: 999, label: "от 14 суток" }
];

RC.EXTRAS = [
  { id: "delivery", label: "Подача по Томску", note: "Привезём машину к дому или на работу", price: 500, per: "once" },
  { id: "child",    label: "Детское кресло", note: "Группа 1–2, от 9 до 25 кг", price: 200, per: "day" },
  { id: "unlim",    label: "Без лимита пробега", note: "Вместо 300 км в сутки", price: 400, per: "day" },
  { id: "nodep",    label: "Без залога", note: "+25% к стоимости аренды", price: 0.25, per: "pct" }
];

RC.SEED_CARS = [
  { id: "granta-1", brand: "Lada", model: "Granta", year: 2023, cls: "econom", img: "img/granta.webp", cut: "img/cut-granta.webp",
    kpp: "МКПП", fuel: "Бензин", engine: "1.6 л · 90 л.с.", cons: "6,8 л / 100 км", seats: 5, color: "Белый",
    plate: "А 000 АА 70", taxi: true, status: "free", prices: [2200, 2000, 1800, 1600],
    features: ["Кондиционер", "Зимняя резина", "Bluetooth", "Обогрев сидений"] },
  { id: "granta-2", brand: "Lada", model: "Granta", year: 2022, cls: "econom", img: "img/granta.webp", cut: "img/cut-granta.webp",
    kpp: "МКПП", fuel: "Бензин", engine: "1.6 л · 90 л.с.", cons: "6,8 л / 100 км", seats: 5, color: "Белый",
    plate: "В 111 ВВ 70", taxi: true, status: "free", prices: [2000, 1850, 1700, 1500],
    features: ["Кондиционер", "Зимняя резина", "Обогрев сидений"] },
  { id: "bora-1", brand: "Volkswagen", model: "Bora", year: 2023, cls: "comfort", img: "img/bora.webp", cut: "img/cut-bora.webp",
    kpp: "АКПП", fuel: "Газ + бензин", engine: "1.5 л · 113 л.с.", cons: "≈ 3 ₽ / км на газу", seats: 5, color: "Белый",
    plate: "Р 592 РО 70", taxi: true, status: "free", prices: [2900, 2700, 2400, 2200],
    features: ["ГБО — дешёвый километр", "Климат-контроль", "Камера заднего вида", "Зимняя резина", "CarPlay / Android Auto"] },
  { id: "changan-1", brand: "Changan", model: "Alsvin", year: 2024, cls: "comfort", img: "img/changan.webp", cut: "img/cut-changan.webp",
    kpp: "Робот", fuel: "Бензин", engine: "1.5 л · 107 л.с.", cons: "6,1 л / 100 км", seats: 5, color: "Белый",
    plate: "Р 159 РМ 70", taxi: true, status: "free", prices: [3300, 3100, 2800, 2600],
    features: ["Климат-контроль", "Экран 10″", "Камера заднего вида", "Подогрев руля", "Зимняя резина"] },
  { id: "hongqi-1", brand: "Hongqi", model: "H5", year: 2024, cls: "premium", img: "img/premium.webp", cut: "img/cut-premium.webp",
    kpp: "АКПП", fuel: "Бензин", engine: "1.5T · 169 л.с.", cons: "7,2 л / 100 км", seats: 5, color: "Чёрный",
    plate: "У 015 НУ 761", taxi: false, status: "free", prices: [7500, 7000, 6500, 6000],
    features: ["Кожаный салон", "Панорамная крыша", "Адаптивный круиз", "Камеры 360°", "Подогрев и вентиляция сидений", "КАСКО включено"] },
  { id: "hongqi-2", brand: "Hongqi", model: "H5", year: 2024, cls: "premium", img: "img/premium.webp", cut: "img/cut-premium.webp",
    kpp: "АКПП", fuel: "Бензин", engine: "1.5T · 169 л.с.", cons: "7,2 л / 100 км", seats: 5, color: "Чёрный",
    plate: "Т 656 НУ 761", taxi: false, status: "free", prices: [7500, 7000, 6500, 6000],
    features: ["Кожаный салон", "Панорамная крыша", "Адаптивный круиз", "Камеры 360°", "КАСКО включено"] },
  { id: "hongqi-3", brand: "Hongqi", model: "H5", year: 2023, cls: "premium", img: "img/premium.webp", cut: "img/cut-premium.webp",
    kpp: "АКПП", fuel: "Бензин", engine: "1.5T · 169 л.с.", cons: "7,2 л / 100 км", seats: 5, color: "Чёрный",
    plate: "Т 684 НУ 761", taxi: false, status: "service", prices: [7000, 6600, 6200, 5800],
    features: ["Кожаный салон", "Адаптивный круиз", "Камеры 360°", "КАСКО включено"] },
  /* Ниже — машины без фото: показываются силуэтом, фото добавит владелец */
  { id: "rio-1", brand: "Kia", model: "Rio", year: 2023, cls: "econom", body: "sedan", paint: "#E7EAEE",
    kpp: "АКПП", fuel: "Бензин", engine: "1.6 л · 123 л.с.", cons: "6,6 л / 100 км", seats: 5, color: "Белый",
    plate: "С 210 КМ 70", taxi: true, status: "free", prices: [2600, 2400, 2200, 2000],
    features: ["Кондиционер", "Подогрев сидений", "Bluetooth", "Зимняя резина"] },
  { id: "solaris-1", brand: "Hyundai", model: "Solaris", year: 2022, cls: "econom", body: "sedan", paint: "#8E959E",
    kpp: "АКПП", fuel: "Бензин", engine: "1.6 л · 123 л.с.", cons: "6,7 л / 100 км", seats: 5, color: "Серебристый",
    plate: "Е 437 ТО 70", taxi: true, status: "free", prices: [2500, 2300, 2100, 1900],
    features: ["Кондиционер", "Подогрев руля", "Камера заднего вида", "Зимняя резина"] },
  { id: "vesta-1", brand: "Lada", model: "Vesta", year: 2024, cls: "econom", body: "sedan", paint: "#2D5DA8",
    kpp: "МКПП", fuel: "Газ + бензин", engine: "1.6 л · 106 л.с.", cons: "≈ 3 ₽ / км на газу", seats: 5, color: "Синий",
    plate: "К 882 ВХ 70", taxi: true, status: "free", prices: [2300, 2100, 1900, 1700],
    features: ["ГБО — дешёвый километр", "Мультимедиа 8″", "Круиз-контроль", "Зимняя резина"] },
  { id: "riox-1", brand: "Kia", model: "Rio X", year: 2022, cls: "econom", body: "hatch", paint: "#E2702E",
    kpp: "АКПП", fuel: "Бензин", engine: "1.6 л · 123 л.с.", cons: "6,9 л / 100 км", seats: 5, color: "Оранжевый",
    plate: "М 519 АР 70", taxi: false, status: "free", prices: [2700, 2500, 2300, 2100],
    features: ["Увеличенный клиренс", "Подогрев сидений", "Парктроники", "Зимняя резина"] },
  { id: "jolion-1", brand: "Haval", model: "Jolion", year: 2024, cls: "comfort", body: "suv", paint: "#B3262F",
    kpp: "Робот", fuel: "Бензин", engine: "1.5T · 150 л.с.", cons: "7,9 л / 100 км", seats: 5, color: "Красный",
    plate: "О 774 МН 70", taxi: false, status: "free", prices: [3800, 3600, 3300, 3000],
    features: ["Кроссовер, клиренс 190 мм", "Климат-контроль", "Камера 360°", "Подогрев руля и сидений", "Зимняя резина"] },
  { id: "tiggo-1", brand: "Chery", model: "Tiggo 7 Pro Max", year: 2024, cls: "comfort", body: "suv", paint: "#2B2F36",
    kpp: "Вариатор", fuel: "Бензин", engine: "1.5T · 147 л.с.", cons: "8,1 л / 100 км", seats: 5, color: "Чёрный",
    plate: "Х 305 ЕС 70", taxi: false, status: "free", prices: [4300, 4000, 3700, 3400],
    features: ["Панорамная крыша", "Камера 360°", "Электропривод багажника", "Вентиляция сидений", "Зимняя резина"] },
  { id: "camry-1", brand: "Toyota", model: "Camry", year: 2023, cls: "premium", body: "sedan", paint: "#15171C",
    kpp: "АКПП", fuel: "Бензин", engine: "2.5 л · 200 л.с.", cons: "8,3 л / 100 км", seats: 5, color: "Чёрный",
    plate: "А 777 УК 70", taxi: false, status: "free", prices: [8000, 7500, 7000, 6500],
    features: ["Кожаный салон", "Адаптивный круиз", "Вентиляция сидений", "JBL", "КАСКО включено"] },
  { id: "monjaro-1", brand: "Geely", model: "Monjaro", year: 2024, cls: "premium", body: "suv", paint: "#6E7781",
    kpp: "АКПП", fuel: "Бензин", engine: "2.0T · 238 л.с.", cons: "8,8 л / 100 км", seats: 5, color: "Серый",
    plate: "В 900 ОР 70", taxi: false, status: "free", prices: [8500, 8000, 7500, 7000],
    features: ["Полный привод", "Проекция на стекло", "Камеры 360°", "Массаж сидений", "КАСКО включено"] }
];

/* Брони относительно сегодняшней даты, чтобы демо всегда выглядело живым */
RC.seedBookings = function () {
  const d = (n) => RC.util.iso(RC.util.addDays(RC.util.today(), n));
  return [
    { id: "RC-1041", carId: "granta-2", from: d(-2), to: d(3), status: "active", demo: true, mine: false,
      client: { name: "Артём Соколов", phone: "+7 913 820-11-45", birth: "1998-04-12", license: "70 21 456789", licenseSince: "2017-06-01" },
      extras: [], total: 11100, deposit: 5000, createdAt: d(-4) },
    { id: "RC-1042", carId: "hongqi-2", from: d(-1), to: d(4), status: "active", demo: true, mine: false,
      client: { name: "Дмитрий Ким", phone: "+7 923 401-77-02", birth: "1991-09-30", license: "70 18 112233", licenseSince: "2011-03-15" },
      extras: [], total: 35000, deposit: 30000, createdAt: d(-3) },
    { id: "RC-1043", carId: "bora-1", from: d(2), to: d(16), status: "approved", demo: true, mine: false,
      client: { name: "Руслан Абдуллаев", phone: "+7 952 155-90-31", birth: "1995-01-22", license: "70 20 998877", licenseSince: "2015-08-10" },
      extras: [], total: 30800, deposit: 10000, createdAt: d(-1) },
    { id: "RC-1044", carId: "changan-1", from: d(1), to: d(3), status: "new", demo: true, mine: false,
      client: { name: "Ксения Миронова", phone: "+7 906 950-42-18", birth: "2000-11-05", license: "70 22 334455", licenseSince: "2020-02-20" },
      extras: ["delivery"], total: 6700, deposit: 10000, createdAt: d(0) },
    { id: "RC-1045", carId: "hongqi-1", from: d(5), to: d(7), status: "new", demo: true, mine: false,
      client: { name: "Игорь Павлов", phone: "+7 913 105-66-70", birth: "1988-07-14", license: "70 09 776655", licenseSince: "2008-05-01" },
      extras: ["child"], total: 15400, deposit: 30000, createdAt: d(0) },
    { id: "RC-1031", carId: "granta-1", from: d(-12), to: d(-5), status: "done", demo: true, mine: false,
      client: { name: "Олег Ветров", phone: "+7 923 222-10-09", birth: "1993-03-03", license: "70 15 101010", licenseSince: "2013-01-01" },
      extras: [], total: 12600, deposit: 5000, createdAt: d(-14) },
    { id: "RC-1035", carId: "changan-1", from: d(-9), to: d(-2), status: "done", demo: true, mine: false,
      client: { name: "Мария Лапина", phone: "+7 913 777-30-30", birth: "1997-12-12", license: "70 19 202020", licenseSince: "2016-09-09" },
      extras: [], total: 19600, deposit: 10000, createdAt: d(-10) },
    { id: "RC-1036", carId: "solaris-1", from: d(-3), to: d(11), status: "active", demo: true, mine: false,
      client: { name: "Тимур Галиев", phone: "+7 952 300-12-77", birth: "1994-02-18", license: "70 17 556677", licenseSince: "2014-04-02" },
      extras: [], total: 0, deposit: 5000, createdAt: d(-4) },
    { id: "RC-1039", carId: "camry-1", from: d(3), to: d(6), status: "approved", demo: true, mine: false,
      client: { name: "Алексей Морозов", phone: "+7 913 440-81-20", birth: "1986-10-09", license: "70 12 889900", licenseSince: "2006-07-15" },
      extras: ["delivery"], total: 0, deposit: 30000, createdAt: d(-1) },
    { id: "RC-1046", carId: "jolion-1", from: d(1), to: d(4), status: "new", demo: true, mine: false,
      client: { name: "Анна Ершова", phone: "+7 923 615-04-33", birth: "1999-06-27", license: "70 21 123987", licenseSince: "2019-03-11" },
      extras: ["child"], total: 0, deposit: 10000, createdAt: d(0) }
  ];
};

RC.FAQ = [
  ["Что нужно, чтобы взять машину?", "Паспорт РФ и водительское удостоверение категории B. Фото документов загружаете прямо при бронировании, на месте только сверяем оригиналы и отдаём ключи."],
  ["Можно взять машину под такси?", "Да. Granta, Bora и Changan можно брать для работы в такси от 7 суток. Bora стоит на газу, поэтому километр выходит в 2–3 раза дешевле, чем на бензине."],
  ["Когда вернут залог?", "Сразу после осмотра машины при возврате, если нет повреждений и штрафов. Если штраф придёт позже, он удерживается из залога, поэтому его возвращаем через 10 дней."],
  ["Можно ли выехать за пределы Томской области?", "Можно, но предупредите заранее. Для поездок дальше 300 км от Томска согласуем маршрут и, если нужно, снимем лимит пробега."],
  ["Что если я попал в ДТП?", "Не двигайте машину, позвоните в ГИБДД и нам. Ответственность регулируется ОСАГО, а на премиум-классе дополнительно действует КАСКО. Франшиза по КАСКО — 30 000 ₽."],
  ["Как продлить аренду?", "Напишите или позвоните хотя бы за 12 часов до конца аренды. Если машина свободна, продлим по тарифу итогового срока."],
  ["Бак полный?", "Машину выдаём с полным баком и так же принимаем. Если вернёте неполный, дозаправку посчитаем по цене АЗС плюс 300 ₽ за сервис."]
];
