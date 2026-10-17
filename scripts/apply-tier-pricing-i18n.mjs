/**
 * Patches tier-pricing i18n keys and removes stale indicative keys.
 * Run: node scripts/apply-tier-pricing-i18n.mjs
 */
import * as fs from "node:fs";
import * as path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const MESSAGES = path.join(ROOT, "messages");

const patches = {
  de: {
    "VehicleListing.ratesBlurb":
      "Längere Mieten schalten Mietdauer-Rabatte vor Extras frei — als Orientierung bei der Suche.",
    "VehicleFilters.durationDiscountLine":
      "{count} {dayLabel}: {percent} % Mietdauer-Rabatt · Endpreis hängt von Fahrzeug und Extras ab.",
    "VehicleFilters.durationDiscountLineMax":
      "Ab 7 Tagen bis zu {percent} % sparen · Endpreis hängt von Fahrzeug und Extras ab.",
    "IndicativeRates.cardTitle": "Mietdauer-Rabatte",
    "IndicativeRates.cardSubtitle": "Längere Mieten sparen mehr",
    "IndicativeRates.beforeExtras": "Gilt für die Fahrzeugmiete vor Extras",
    "IndicativeRates.footnote":
      "Endpreis hängt vom Fahrzeug-Grundpreis, Saison und Verfügbarkeit ab — schreiben Sie uns für ein Angebot.",
    "IndicativeRates.noDiscount": "0 % Rabatt",
    "IndicativeRates.percentOff": "{percent} % Rabatt",
    "BookingSearch.durationDiscountSummary":
      "{days} {dayLabel}: {percent} % Mietdauer-Rabatt · Endpreis hängt von Fahrzeug und Extras ab.",
    "BookingSearch.durationDiscountSummaryMax":
      "Ab 7 Tagen bis zu {percent} % sparen · Endpreis hängt von Fahrzeug und Extras ab.",
    "BookingWizard.bookingSummary.baseDailyRate": "Grundpreis pro Tag:",
    "BookingWizard.bookingSummary.rentalDuration": "Mietdauer:",
    "BookingWizard.bookingSummary.durationDiscount": "Mietdauer-Rabatt: {percent} % → {rate}/Tag",
  },
  fr: {
    "VehicleListing.ratesBlurb":
      "Les locations plus longues débloquent des remises sur la durée avant les extras — utilisez-les comme guide pendant votre recherche.",
    "VehicleFilters.durationDiscountLine":
      "{count} {dayLabel} : remise de {percent} % sur la durée · Le prix final dépend du véhicule et des options.",
    "VehicleFilters.durationDiscountLineMax":
      "Louez 7 jours ou plus et économisez jusqu'à {percent} % · Le prix final dépend du véhicule et des options.",
    "IndicativeRates.cardTitle": "Remises sur la durée",
    "IndicativeRates.cardSubtitle": "Plus vous louez longtemps, plus vous économisez",
    "IndicativeRates.beforeExtras": "Appliqué à la location du véhicule avant les extras",
    "IndicativeRates.footnote":
      "Le prix final dépend du tarif de base, de la saison et de la disponibilité — contactez-nous pour un devis.",
    "IndicativeRates.noDiscount": "0 % de remise",
    "IndicativeRates.percentOff": "{percent} % de remise",
    "BookingSearch.durationDiscountSummary":
      "{days} {dayLabel} : remise de {percent} % sur la durée · Le prix final dépend du véhicule et des options.",
    "BookingSearch.durationDiscountSummaryMax":
      "Louez 7 jours ou plus et économisez jusqu'à {percent} % · Le prix final dépend du véhicule et des options.",
    "BookingWizard.bookingSummary.baseDailyRate": "Tarif journalier de base :",
    "BookingWizard.bookingSummary.rentalDuration": "Durée de location :",
    "BookingWizard.bookingSummary.durationDiscount": "Remise durée : {percent} % → {rate}/jour",
  },
  es: {
    "VehicleListing.ratesBlurb":
      "Las reservas más largas desbloquean descuentos por duración antes de extras — úsalos como guía mientras buscas.",
    "VehicleFilters.durationDiscountLine":
      "{count} {dayLabel}: {percent} % de descuento por duración · El precio final depende del vehículo y extras.",
    "VehicleFilters.durationDiscountLineMax":
      "Alquila 7+ días y ahorra hasta {percent} % · El precio final depende del vehículo y extras.",
    "IndicativeRates.cardTitle": "Descuentos por duración",
    "IndicativeRates.cardSubtitle": "Cuanto más alquiles, más ahorras",
    "IndicativeRates.beforeExtras": "Aplicado al alquiler del vehículo antes de extras",
    "IndicativeRates.footnote":
      "El precio final depende de la tarifa base, la temporada y la disponibilidad — escríbenos para un presupuesto.",
    "IndicativeRates.noDiscount": "0 % de descuento",
    "IndicativeRates.percentOff": "{percent} % de descuento",
    "BookingSearch.durationDiscountSummary":
      "{days} {dayLabel}: {percent} % de descuento por duración · El precio final depende del vehículo y extras.",
    "BookingSearch.durationDiscountSummaryMax":
      "Alquila 7+ días y ahorra hasta {percent} % · El precio final depende del vehículo y extras.",
    "BookingWizard.bookingSummary.baseDailyRate": "Tarifa diaria base:",
    "BookingWizard.bookingSummary.rentalDuration": "Duración del alquiler:",
    "BookingWizard.bookingSummary.durationDiscount": "Descuento por duración: {percent} % → {rate}/día",
  },
  it: {
    "VehicleListing.ratesBlurb":
      "Noleggi più lunghi sbloccano sconti sulla durata prima degli extra — usali come guida durante la ricerca.",
    "VehicleFilters.durationDiscountLine":
      "{count} {dayLabel}: sconto durata del {percent} % · Il prezzo finale dipende dal veicolo e dagli extra.",
    "VehicleFilters.durationDiscountLineMax":
      "Noleggia 7+ giorni e risparmia fino al {percent} % · Il prezzo finale dipende dal veicolo e dagli extra.",
    "IndicativeRates.cardTitle": "Sconti sulla durata",
    "IndicativeRates.cardSubtitle": "Noleggi più lunghi, più risparmi",
    "IndicativeRates.beforeExtras": "Applicato al noleggio veicolo prima degli extra",
    "IndicativeRates.footnote":
      "Il prezzo finale dipende dalla tariffa base, stagione e disponibilità — scrivici per un preventivo.",
    "IndicativeRates.noDiscount": "0 % di sconto",
    "IndicativeRates.percentOff": "{percent} % di sconto",
    "BookingSearch.durationDiscountSummary":
      "{days} {dayLabel}: sconto durata del {percent} % · Il prezzo finale dipende dal veicolo e dagli extra.",
    "BookingSearch.durationDiscountSummaryMax":
      "Noleggia 7+ giorni e risparmia fino al {percent} % · Il prezzo finale dipende dal veicolo e dagli extra.",
    "BookingWizard.bookingSummary.baseDailyRate": "Tariffa giornaliera base:",
    "BookingWizard.bookingSummary.rentalDuration": "Durata del noleggio:",
    "BookingWizard.bookingSummary.durationDiscount": "Sconto durata: {percent} % → {rate}/giorno",
  },
  pt: {
    "VehicleListing.ratesBlurb":
      "Alugueres mais longos desbloqueiam descontos por duração antes dos extras — use como guia enquanto pesquisa.",
    "VehicleFilters.durationDiscountLine":
      "{count} {dayLabel}: {percent} % de desconto por duração · O preço final depende do veículo e extras.",
    "VehicleFilters.durationDiscountLineMax":
      "Alugue 7+ dias e poupe até {percent} % · O preço final depende do veículo e extras.",
    "IndicativeRates.cardTitle": "Descontos por duração",
    "IndicativeRates.cardSubtitle": "Alugueres mais longos poupam mais",
    "IndicativeRates.beforeExtras": "Aplicado ao aluguer do veículo antes dos extras",
    "IndicativeRates.footnote":
      "O preço final depende da tarifa base, época e disponibilidade — contacte-nos para um orçamento.",
    "IndicativeRates.noDiscount": "0 % de desconto",
    "IndicativeRates.percentOff": "{percent} % de desconto",
    "BookingSearch.durationDiscountSummary":
      "{days} {dayLabel}: {percent} % de desconto por duração · O preço final depende do veículo e extras.",
    "BookingSearch.durationDiscountSummaryMax":
      "Alugue 7+ dias e poupe até {percent} % · O preço final depende do veículo e extras.",
    "BookingWizard.bookingSummary.baseDailyRate": "Tarifa diária base:",
    "BookingWizard.bookingSummary.rentalDuration": "Duração do aluguer:",
    "BookingWizard.bookingSummary.durationDiscount": "Desconto por duração: {percent} % → {rate}/dia",
  },
  nl: {
    "VehicleListing.ratesBlurb":
      "Langere huurperiodes ontgrendelen duur-kortingen vóór extras — gebruik ze als leidraad tijdens het zoeken.",
    "VehicleFilters.durationDiscountLine":
      "{count} {dayLabel}: {percent} % duur-korting · Eindprijs hangt af van voertuig en extra's.",
    "VehicleFilters.durationDiscountLineMax":
      "Huur 7+ dagen en bespaar tot {percent} % · Eindprijs hangt af van voertuig en extra's.",
    "IndicativeRates.cardTitle": "Duur-kortingen",
    "IndicativeRates.cardSubtitle": "Langere huur = meer besparing",
    "IndicativeRates.beforeExtras": "Van toepassing op voertuighuur vóór extras",
    "IndicativeRates.footnote":
      "Eindprijs hangt af van basistarief, seizoen en beschikbaarheid — stuur ons een bericht voor een offerte.",
    "IndicativeRates.noDiscount": "0 % korting",
    "IndicativeRates.percentOff": "{percent} % korting",
    "BookingSearch.durationDiscountSummary":
      "{days} {dayLabel}: {percent} % duur-korting · Eindprijs hangt af van voertuig en extra's.",
    "BookingSearch.durationDiscountSummaryMax":
      "Huur 7+ dagen en bespaar tot {percent} % · Eindprijs hangt af van voertuig en extra's.",
    "BookingWizard.bookingSummary.baseDailyRate": "Basis dagtarief:",
    "BookingWizard.bookingSummary.rentalDuration": "Huurduur:",
    "BookingWizard.bookingSummary.durationDiscount": "Duur-korting: {percent} % → {rate}/dag",
  },
  pl: {
    "VehicleListing.ratesBlurb":
      "Dłuższe wynajmy odblokowują rabaty za czas trwania przed dodatkami — użyj ich jako wskazówki podczas wyszukiwania.",
    "VehicleFilters.durationDiscountLine":
      "{count} {dayLabel}: {percent} % rabatu za czas trwania · Cena końcowa zależy od pojazdu i dodatków.",
    "VehicleFilters.durationDiscountLineMax":
      "Wynajmij na 7+ dni i zaoszczędź do {percent} % · Cena końcowa zależy od pojazdu i dodatków.",
    "IndicativeRates.cardTitle": "Rabaty za czas trwania",
    "IndicativeRates.cardSubtitle": "Dłuższy wynajem = większe oszczędności",
    "IndicativeRates.beforeExtras": "Dotyczy wynajmu pojazdu przed dodatkami",
    "IndicativeRates.footnote":
      "Cena końcowa zależy od stawki bazowej, sezonu i dostępności — napisz do nas po wycenę.",
    "IndicativeRates.noDiscount": "0 % rabatu",
    "IndicativeRates.percentOff": "{percent} % rabatu",
    "BookingSearch.durationDiscountSummary":
      "{days} {dayLabel}: {percent} % rabatu za czas trwania · Cena końcowa zależy od pojazdu i dodatków.",
    "BookingSearch.durationDiscountSummaryMax":
      "Wynajmij na 7+ dni i zaoszczędź do {percent} % · Cena końcowa zależy od pojazdu i dodatków.",
    "BookingWizard.bookingSummary.baseDailyRate": "Stawka dzienna bazowa:",
    "BookingWizard.bookingSummary.rentalDuration": "Czas wynajmu:",
    "BookingWizard.bookingSummary.durationDiscount": "Rabat za czas: {percent} % → {rate}/dzień",
  },
  mt: {
    "VehicleListing.ratesBlurb":
      "Kiri itwal jiftħu skonti fuq id-durata qabel l-extra — użahom bħala gwida waqt it-tfittxija.",
    "VehicleFilters.durationDiscountLine":
      "{count} {dayLabel}: {percent}% skont fuq id-durata · Il-prezz finali jiddependi fuq il-vettura u ż-żidiet.",
    "VehicleFilters.durationDiscountLineMax":
      "Ikri 7+ ijiem u iffranka sa {percent}% · Il-prezz finali jiddependi fuq il-vettura u ż-żidiet.",
    "IndicativeRates.cardTitle": "Skonti fuq id-durata",
    "IndicativeRates.cardSubtitle": "Kiri itwal jiffranka aktar",
    "IndicativeRates.beforeExtras": "Applikat għall-kiri tal-vettura qabel l-extra",
    "IndicativeRates.footnote":
      "Il-prezz finali jiddependi fuq ir-rata bażi, is-sajf u d-disponibbiltà — ibgħatilna messaġġ għal kwotazzjoni.",
    "IndicativeRates.noDiscount": "0% skont",
    "IndicativeRates.percentOff": "{percent}% skont",
    "BookingSearch.durationDiscountSummary":
      "{days} {dayLabel}: {percent}% skont fuq id-durata · Il-prezz finali jiddependi fuq il-vettura u ż-żidiet.",
    "BookingSearch.durationDiscountSummaryMax":
      "Ikri 7+ ijiem u iffranka sa {percent}% · Il-prezz finali jiddependi fuq il-vettura u ż-żidiet.",
    "BookingWizard.bookingSummary.baseDailyRate": "Rata ta' kuljum bażi:",
    "BookingWizard.bookingSummary.rentalDuration": "Tul tal-kiri:",
    "BookingWizard.bookingSummary.durationDiscount": "Skont fuq id-durata: {percent}% → {rate}/jum",
  },
  ru: {
    "VehicleListing.ratesBlurb":
      "Более длительная аренда открывает скидки за срок до дополнений — используйте их как ориентир при поиске.",
    "VehicleFilters.durationDiscountLine":
      "{count} {dayLabel}: скидка {percent} % за срок · Итоговая цена зависит от транспорта и дополнений.",
    "VehicleFilters.durationDiscountLineMax":
      "Арендуйте 7+ дней и экономьте до {percent} % · Итоговая цена зависит от транспорта и дополнений.",
    "IndicativeRates.cardTitle": "Скидки за срок аренды",
    "IndicativeRates.cardSubtitle": "Чем дольше аренда, тем больше экономия",
    "IndicativeRates.beforeExtras": "Применяется к аренде транспорта до дополнений",
    "IndicativeRates.footnote":
      "Итоговая цена зависит от базового тарифа, сезона и наличия — напишите нам для расчёта.",
    "IndicativeRates.noDiscount": "0 % скидки",
    "IndicativeRates.percentOff": "{percent} % скидки",
    "BookingSearch.durationDiscountSummary":
      "{days} {dayLabel}: скидка {percent} % за срок · Итоговая цена зависит от транспорта и дополнений.",
    "BookingSearch.durationDiscountSummaryMax":
      "Арендуйте 7+ дней и экономьте до {percent} % · Итоговая цена зависит от транспорта и дополнений.",
    "BookingWizard.bookingSummary.baseDailyRate": "Базовая дневная ставка:",
    "BookingWizard.bookingSummary.rentalDuration": "Срок аренды:",
    "BookingWizard.bookingSummary.durationDiscount": "Скидка за срок: {percent} % → {rate}/день",
  },
  ar: {
    "VehicleListing.ratesBlurb":
      "الإيجارات الأطول تفتح خصومات المدة قبل الإضافات — استخدمها كدليل أثناء البحث.",
    "VehicleFilters.durationDiscountLine":
      "{count} {dayLabel}: خصم مدة {percent}٪ · السعر النهائي يعتمد على المركبة والإضافات.",
    "VehicleFilters.durationDiscountLineMax":
      "أجرِ 7+ أيام ووفّر حتى {percent}٪ · السعر النهائي يعتمد على المركبة والإضافات.",
    "IndicativeRates.cardTitle": "خصومات المدة",
    "IndicativeRates.cardSubtitle": "إيجار أطول يعني توفيراً أكبر",
    "IndicativeRates.beforeExtras": "يُطبق على إيجار المركبة قبل الإضافات",
    "IndicativeRates.footnote":
      "السعر النهائي يعتمد على السعر الأساسي والموسم والتوفر — راسلنا للحصول على عرض.",
    "IndicativeRates.noDiscount": "خصم 0٪",
    "IndicativeRates.percentOff": "خصم {percent}٪",
    "BookingSearch.durationDiscountSummary":
      "{days} {dayLabel}: خصم مدة {percent}٪ · السعر النهائي يعتمد على المركبة والإضافات.",
    "BookingSearch.durationDiscountSummaryMax":
      "أجرِ 7+ أيام ووفّر حتى {percent}٪ · السعر النهائي يعتمد على المركبة والإضافات.",
    "BookingWizard.bookingSummary.baseDailyRate": "السعر اليومي الأساسي:",
    "BookingWizard.bookingSummary.rentalDuration": "مدة الإيجار:",
    "BookingWizard.bookingSummary.durationDiscount": "خصم المدة: {percent}٪ → {rate}/يوم",
  },
  zh: {
    "VehicleListing.ratesBlurb":
      "租期越长，越可享受时长折扣（不含附加项目）——搜索时可作为参考。",
    "VehicleFilters.durationDiscountLine":
      "{count} {dayLabel}：{percent}% 时长折扣 · 最终价格取决于车辆和附加项目。",
    "VehicleFilters.durationDiscountLineMax":
      "租满 7 天以上最高可省 {percent}% · 最终价格取决于车辆和附加项目。",
    "IndicativeRates.cardTitle": "时长折扣",
    "IndicativeRates.cardSubtitle": "租期越长，省得越多",
    "IndicativeRates.beforeExtras": "适用于车辆租金（不含附加项目）",
    "IndicativeRates.footnote": "最终价格取决于车辆基础价、季节和库存——请联系我们获取报价。",
    "IndicativeRates.noDiscount": "0% 折扣",
    "IndicativeRates.percentOff": "{percent}% 折扣",
    "BookingSearch.durationDiscountSummary":
      "{days} {dayLabel}：{percent}% 时长折扣 · 最终价格取决于车辆和附加项目。",
    "BookingSearch.durationDiscountSummaryMax":
      "租满 7 天以上最高可省 {percent}% · 最终价格取决于车辆和附加项目。",
    "BookingWizard.bookingSummary.baseDailyRate": "基础日租金：",
    "BookingWizard.bookingSummary.rentalDuration": "租期：",
    "BookingWizard.bookingSummary.durationDiscount": "时长折扣：{percent}% → {rate}/天",
  },
  ja: {
    "VehicleListing.ratesBlurb":
      "長期レンタルほど期間割引が適用されます（オプション前）— 検索中の目安としてご利用ください。",
    "VehicleFilters.durationDiscountLine":
      "{count} {dayLabel}：{percent}% 期間割引 · 最終価格は車両とオプションにより異なります。",
    "VehicleFilters.durationDiscountLineMax":
      "7日以上で最大 {percent}% お得 · 最終価格は車両とオプションにより異なります。",
    "IndicativeRates.cardTitle": "期間割引",
    "IndicativeRates.cardSubtitle": "長く借りるほどお得",
    "IndicativeRates.beforeExtras": "オプション前の車両レンタルに適用",
    "IndicativeRates.footnote":
      "最終価格は基本料金・シーズン・在庫により異なります — お見積りはお問い合わせください。",
    "IndicativeRates.noDiscount": "0% 割引",
    "IndicativeRates.percentOff": "{percent}% 割引",
    "BookingSearch.durationDiscountSummary":
      "{days} {dayLabel}：{percent}% 期間割引 · 最終価格は車両とオプションにより異なります。",
    "BookingSearch.durationDiscountSummaryMax":
      "7日以上で最大 {percent}% お得 · 最終価格は車両とオプションにより異なります。",
    "BookingWizard.bookingSummary.baseDailyRate": "基本日額：",
    "BookingWizard.bookingSummary.rentalDuration": "レンタル期間：",
    "BookingWizard.bookingSummary.durationDiscount": "期間割引：{percent}% → {rate}/日",
  },
  ko: {
    "VehicleListing.ratesBlurb":
      "장기 대여 시 추가 옵션 전에 기간 할인이 적용됩니다 — 검색 중 참고용으로 활용하세요.",
    "VehicleFilters.durationDiscountLine":
      "{count} {dayLabel}: {percent}% 기간 할인 · 최종 가격은 차량 및 추가 옵션에 따라 다릅니다.",
    "VehicleFilters.durationDiscountLineMax":
      "7일 이상 대여 시 최대 {percent}% 절약 · 최종 가격은 차량 및 추가 옵션에 따라 다릅니다.",
    "IndicativeRates.cardTitle": "기간 할인",
    "IndicativeRates.cardSubtitle": "오래 빌릴수록 더 절약",
    "IndicativeRates.beforeExtras": "추가 옵션 전 차량 대여에 적용",
    "IndicativeRates.footnote":
      "최종 가격은 기본 요금, 시즌, 재고에 따라 달라집니다 — 견적은 문의해 주세요.",
    "IndicativeRates.noDiscount": "0% 할인",
    "IndicativeRates.percentOff": "{percent}% 할인",
    "BookingSearch.durationDiscountSummary":
      "{days} {dayLabel}: {percent}% 기간 할인 · 최종 가격은 차량 및 추가 옵션에 따라 다릅니다.",
    "BookingSearch.durationDiscountSummaryMax":
      "7일 이상 대여 시 최대 {percent}% 절약 · 최종 가격은 차량 및 추가 옵션에 따라 다릅니다.",
    "BookingWizard.bookingSummary.baseDailyRate": "기본 일일 요금:",
    "BookingWizard.bookingSummary.rentalDuration": "대여 기간:",
    "BookingWizard.bookingSummary.durationDiscount": "기간 할인: {percent}% → {rate}/일",
  },
  hi: {
    "VehicleListing.ratesBlurb":
      "लंबी किराये पर अवधि छूट एक्स्ट्रा से पहले लागू होती है — खोजते समय मार्गदर्शन के रूप में उपयोग करें।",
    "VehicleFilters.durationDiscountLine":
      "{count} {dayLabel}: {percent}% अवधि छूट · अंतिम मूल्य वाहन और ऐड-ऑन पर निर्भर करता है।",
    "VehicleFilters.durationDiscountLineMax":
      "7+ दिन किराए पर {percent}% तक बचाएं · अंतिम मूल्य वाहन और ऐड-ऑन पर निर्भर करता है।",
    "IndicativeRates.cardTitle": "अवधि छूट",
    "IndicativeRates.cardSubtitle": "लंबा किराया, अधिक बचत",
    "IndicativeRates.beforeExtras": "एक्स्ट्रा से पहले वाहन किराए पर लागू",
    "IndicativeRates.footnote":
      "अंतिम मूल्य आधार दर, सीज़न और उपलब्धता पर निर्भर करता है — कोट के लिए संपर्क करें।",
    "IndicativeRates.noDiscount": "0% छूट",
    "IndicativeRates.percentOff": "{percent}% छूट",
    "BookingSearch.durationDiscountSummary":
      "{days} {dayLabel}: {percent}% अवधि छूट · अंतिम मूल्य वाहन और ऐड-ऑन पर निर्भर करता है।",
    "BookingSearch.durationDiscountSummaryMax":
      "7+ दिन किराए पर {percent}% तक बचाएं · अंतिम मूल्य वाहन और ऐड-ऑन पर निर्भर करता है।",
    "BookingWizard.bookingSummary.baseDailyRate": "आधार दैनिक दर:",
    "BookingWizard.bookingSummary.rentalDuration": "किराये की अवधि:",
    "BookingWizard.bookingSummary.durationDiscount": "अवधि छूट: {percent}% → {rate}/दिन",
  },
  bn: {
    "VehicleListing.ratesBlurb":
      "দীর্ঘ ভাড়ায় এক্সট্রার আগে সময়কাল ছাড় খুলে যায় — অনুসন্ধানের সময় গাইড হিসেবে ব্যবহার করুন।",
    "VehicleFilters.durationDiscountLine":
      "{count} {dayLabel}: {percent}% সময়কাল ছাড় · চূড়ান্ত মূল্য গাড়ি ও অ্যাড-অনের উপর নির্ভর করে।",
    "VehicleFilters.durationDiscountLineMax":
      "৭+ দিন ভাড়ায় {percent}% পর্যন্ত সাশ্রয় · চূড়ান্ত মূল্য গাড়ি ও অ্যাড-অনের উপর নির্ভর করে।",
    "IndicativeRates.cardTitle": "সময়কাল ছাড়",
    "IndicativeRates.cardSubtitle": "দীর্ঘ ভাড়ায় বেশি সাশ্রয়",
    "IndicativeRates.beforeExtras": "এক্সট্রার আগে গাড়ি ভাড়ায় প্রযোজ্য",
    "IndicativeRates.footnote":
      "চূড়ান্ত মূল্য বেস রেট, মৌসুম ও উপলব্ধতার উপর নির্ভর করে — কোটের জন্য যোগাযোগ করুন।",
    "IndicativeRates.noDiscount": "০% ছাড়",
    "IndicativeRates.percentOff": "{percent}% ছাড়",
    "BookingSearch.durationDiscountSummary":
      "{days} {dayLabel}: {percent}% সময়কাল ছাড় · চূড়ান্ত মূল্য গাড়ি ও অ্যাড-অনের উপর নির্ভর করে।",
    "BookingSearch.durationDiscountSummaryMax":
      "৭+ দিন ভাড়ায় {percent}% পর্যন্ত সাশ্রয় · চূড়ান্ত মূল্য গাড়ি ও অ্যাড-অনের উপর নির্ভর করে।",
    "BookingWizard.bookingSummary.baseDailyRate": "মূল দৈনিক হার:",
    "BookingWizard.bookingSummary.rentalDuration": "ভাড়ার সময়কাল:",
    "BookingWizard.bookingSummary.durationDiscount": "সময়কাল ছাড়: {percent}% → {rate}/দিন",
  },
  id: {
    "VehicleListing.ratesBlurb":
      "Sewa lebih lama membuka diskon durasi sebelum tambahan — gunakan sebagai panduan saat mencari.",
    "VehicleFilters.durationDiscountLine":
      "{count} {dayLabel}: diskon durasi {percent}% · Harga akhir tergantung kendaraan dan tambahan.",
    "VehicleFilters.durationDiscountLineMax":
      "Sewa 7+ hari dan hemat hingga {percent}% · Harga akhir tergantung kendaraan dan tambahan.",
    "IndicativeRates.cardTitle": "Diskon durasi",
    "IndicativeRates.cardSubtitle": "Sewa lebih lama, hemat lebih banyak",
    "IndicativeRates.beforeExtras": "Berlaku untuk sewa kendaraan sebelum tambahan",
    "IndicativeRates.footnote":
      "Harga akhir tergantung tarif dasar, musim, dan ketersediaan — hubungi kami untuk penawaran.",
    "IndicativeRates.noDiscount": "0% diskon",
    "IndicativeRates.percentOff": "{percent}% diskon",
    "BookingSearch.durationDiscountSummary":
      "{days} {dayLabel}: diskon durasi {percent}% · Harga akhir tergantung kendaraan dan tambahan.",
    "BookingSearch.durationDiscountSummaryMax":
      "Sewa 7+ hari dan hemat hingga {percent}% · Harga akhir tergantung kendaraan dan tambahan.",
    "BookingWizard.bookingSummary.baseDailyRate": "Tarif harian dasar:",
    "BookingWizard.bookingSummary.rentalDuration": "Durasi sewa:",
    "BookingWizard.bookingSummary.durationDiscount": "Diskon durasi: {percent}% → {rate}/hari",
  },
  tr: {
    "VehicleListing.ratesBlurb":
      "Daha uzun kiralamalar ekstralar öncesi süre indirimlerini açar — arama sırasında rehber olarak kullanın.",
    "VehicleFilters.durationDiscountLine":
      "{count} {dayLabel}: %{percent} süre indirimi · Nihai fiyat araca ve ekstralara bağlıdır.",
    "VehicleFilters.durationDiscountLineMax":
      "7+ gün kiralayın ve %{percent}'e kadar tasarruf edin · Nihai fiyat araca ve ekstralara bağlıdır.",
    "IndicativeRates.cardTitle": "Süre indirimleri",
    "IndicativeRates.cardSubtitle": "Uzun kiralama, daha fazla tasarruf",
    "IndicativeRates.beforeExtras": "Ekstralar öncesi araç kiralamasına uygulanır",
    "IndicativeRates.footnote":
      "Nihai fiyat temel ücret, sezon ve müsaitliğe bağlıdır — teklif için bize yazın.",
    "IndicativeRates.noDiscount": "%0 indirim",
    "IndicativeRates.percentOff": "%{percent} indirim",
    "BookingSearch.durationDiscountSummary":
      "{days} {dayLabel}: %{percent} süre indirimi · Nihai fiyat araca ve ekstralara bağlıdır.",
    "BookingSearch.durationDiscountSummaryMax":
      "7+ gün kiralayın ve %{percent}'e kadar tasarruf edin · Nihai fiyat araca ve ekstralara bağlıdır.",
    "BookingWizard.bookingSummary.baseDailyRate": "Temel günlük ücret:",
    "BookingWizard.bookingSummary.rentalDuration": "Kiralama süresi:",
    "BookingWizard.bookingSummary.durationDiscount": "Süre indirimi: %{percent} → {rate}/gün",
  },
  th: {
    "VehicleListing.ratesBlurb":
      "เช่าระยะยาวจะได้ส่วนลดตามระยะเวลาก่อนส่วนเสริม — ใช้เป็นคำแนะนำขณะค้นหา",
    "VehicleFilters.durationDiscountLine":
      "{count} {dayLabel}: ส่วนลดระยะเวลา {percent}% · ราคาสุดท้ายขึ้นอยู่กับยานพาหนะและส่วนเสริม",
    "VehicleFilters.durationDiscountLineMax":
      "เช่า 7+ วัน ประหยัดได้สูงสุด {percent}% · ราคาสุดท้ายขึ้นอยู่กับยานพาหนะและส่วนเสริม",
    "IndicativeRates.cardTitle": "ส่วนลดตามระยะเวลา",
    "IndicativeRates.cardSubtitle": "เช่านานขึ้น ประหยัดมากขึ้น",
    "IndicativeRates.beforeExtras": "ใช้กับค่าเช่ายานพาหนะก่อนส่วนเสริม",
    "IndicativeRates.footnote":
      "ราคาสุดท้ายขึ้นอยู่กับอัตราพื้นฐาน ฤดูกาล และความพร้อม — ติดต่อเราเพื่อขอใบเสนอราคา",
    "IndicativeRates.noDiscount": "ส่วนลด 0%",
    "IndicativeRates.percentOff": "ส่วนลด {percent}%",
    "BookingSearch.durationDiscountSummary":
      "{days} {dayLabel}: ส่วนลดระยะเวลา {percent}% · ราคาสุดท้ายขึ้นอยู่กับยานพาหนะและส่วนเสริม",
    "BookingSearch.durationDiscountSummaryMax":
      "เช่า 7+ วัน ประหยัดได้สูงสุด {percent}% · ราคาสุดท้ายขึ้นอยู่กับยานพาหนะและส่วนเสริม",
    "BookingWizard.bookingSummary.baseDailyRate": "อัตรารายวันพื้นฐาน:",
    "BookingWizard.bookingSummary.rentalDuration": "ระยะเวลาเช่า:",
    "BookingWizard.bookingSummary.durationDiscount": "ส่วนลดระยะเวลา: {percent}% → {rate}/วัน",
  },
  vi: {
    "VehicleListing.ratesBlurb":
      "Thuê dài hơn mở khóa giảm giá theo thời hạn trước phụ phí — dùng làm hướng dẫn khi tìm kiếm.",
    "VehicleFilters.durationDiscountLine":
      "{count} {dayLabel}: giảm {percent}% theo thời hạn · Giá cuối phụ thuộc xe và phụ phí.",
    "VehicleFilters.durationDiscountLineMax":
      "Thuê 7+ ngày tiết kiệm tới {percent}% · Giá cuối phụ thuộc xe và phụ phí.",
    "IndicativeRates.cardTitle": "Giảm giá theo thời hạn",
    "IndicativeRates.cardSubtitle": "Thuê lâu hơn, tiết kiệm hơn",
    "IndicativeRates.beforeExtras": "Áp dụng cho thuê xe trước phụ phí",
    "IndicativeRates.footnote":
      "Giá cuối phụ thuộc giá cơ bản, mùa và tình trạng — nhắn tin để nhận báo giá.",
    "IndicativeRates.noDiscount": "Giảm 0%",
    "IndicativeRates.percentOff": "Giảm {percent}%",
    "BookingSearch.durationDiscountSummary":
      "{days} {dayLabel}: giảm {percent}% theo thời hạn · Giá cuối phụ thuộc xe và phụ phí.",
    "BookingSearch.durationDiscountSummaryMax":
      "Thuê 7+ ngày tiết kiệm tới {percent}% · Giá cuối phụ thuộc xe và phụ phí.",
    "BookingWizard.bookingSummary.baseDailyRate": "Giá ngày cơ bản:",
    "BookingWizard.bookingSummary.rentalDuration": "Thời hạn thuê:",
    "BookingWizard.bookingSummary.durationDiscount": "Giảm theo thời hạn: {percent}% → {rate}/ngày",
  },
  ur: {
    "VehicleListing.ratesBlurb":
      "طویل کرایے پر مدت کی رعایت اضافی چیزوں سے پہلے لاگو ہوتی ہے — تلاش کے دوران رہنما کے طور پر استعمال کریں۔",
    "VehicleFilters.durationDiscountLine":
      "{count} {dayLabel}: {percent}% مدت کی رعایت · حتمی قیمت گاڑی اور ایڈونس پر منحصر ہے۔",
    "VehicleFilters.durationDiscountLineMax":
      "7+ دن کرایے پر {percent}% تک بچائیں · حتمی قیمت گاڑی اور ایڈونس پر منحصر ہے۔",
    "IndicativeRates.cardTitle": "مدت کی رعایتیں",
    "IndicativeRates.cardSubtitle": "طویل کرایہ، زیادہ بچت",
    "IndicativeRates.beforeExtras": "اضافی چیزوں سے پہلے گاڑی کے کرایے پر لاگو",
    "IndicativeRates.footnote":
      "حتمی قیمت بنیادی نرخ، موسم اور دستیابی پر منحصر ہے — قیمت کے لیے رابطہ کریں۔",
    "IndicativeRates.noDiscount": "0% رعایت",
    "IndicativeRates.percentOff": "{percent}% رعایت",
    "BookingSearch.durationDiscountSummary":
      "{days} {dayLabel}: {percent}% مدت کی رعایت · حتمی قیمت گاڑی اور ایڈونس پر منحصر ہے۔",
    "BookingSearch.durationDiscountSummaryMax":
      "7+ دن کرایے پر {percent}% تک بچائیں · حتمی قیمت گاڑی اور ایڈونس پر منحصر ہے۔",
    "BookingWizard.bookingSummary.baseDailyRate": "بنیادی روزانہ نرخ:",
    "BookingWizard.bookingSummary.rentalDuration": "کرایے کی مدت:",
    "BookingWizard.bookingSummary.durationDiscount": "مدت کی رعایت: {percent}% → {rate}/دن",
  },
};

function setNested(obj, dottedKey, value) {
  const parts = dottedKey.split(".");
  let current = obj;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const part = parts[i];
    if (!(part in current) || typeof current[part] !== "object") {
      current[part] = {};
    }
    current = current[part];
  }
  current[parts[parts.length - 1]] = value;
}

function removeStaleKeys(obj) {
  if (obj.VehicleFilters?.indicativeLine) {
    delete obj.VehicleFilters.indicativeLine;
  }
  if (obj.BookingSearch?.indicativeSummary) {
    delete obj.BookingSearch.indicativeSummary;
  }
}

let updated = 0;

for (const [locale, localePatches] of Object.entries(patches)) {
  const filePath = path.join(MESSAGES, `${locale}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  for (const [key, value] of Object.entries(localePatches)) {
    setNested(data, key, value);
  }
  removeStaleKeys(data);
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  updated += 1;
  console.log(`Patched ${locale}.json`);
}

const enPath = path.join(MESSAGES, "en.json");
const enData = JSON.parse(fs.readFileSync(enPath, "utf8"));
removeStaleKeys(enData);
fs.writeFileSync(enPath, `${JSON.stringify(enData, null, 2)}\n`, "utf8");
console.log("Removed stale indicative keys from en.json");

console.log(`Done. Updated ${updated} locale files.`);
