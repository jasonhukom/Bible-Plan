#!/usr/bin/env node
/**
 * Lightweight, dependency-free generator for the Bible Plan i18n bundles.
 *
 * This is the single source of truth for:
 *   - locale JSON bundles  -> ./locales/<code>.json
 *   - language metadata    -> ./languages.json
 *   - Bible translation catalog -> ./bibleTranslations.json
 *
 * It is intentionally synchronous, uses only Node built-ins and writes small
 * files one at a time so it stays headless / low-CPU / low-RAM.
 *
 * Usage:  node src/i18n/generateLocales.mjs
 */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const LOCALES_DIR = join(HERE, "locales");

/** Canonical key order. The English bundle defines the reference key set. */
export const KEY_ORDER = [
  "appName",
  "nav.home",
  "nav.plans",
  "nav.profile",
  "nav.settings",
  "action.start",
  "action.continue",
  "action.complete",
  "action.next",
  "action.back",
  "action.save",
  "action.cancel",
  "common.search",
  "common.loading",
  "common.error",
  "home.welcome",
  "home.todayReading",
  "plans.title",
  "reader.chapter",
  "reader.verse",
  "settings.language",
  "settings.theme",
  "settings.notifications",
  "profile.streak",
];

/**
 * Language metadata: code, English name, native name, text direction,
 * Bible translation id and human-readable Bible translation name.
 */
export const LANGUAGES = [
  ["en", "English", "English", "ltr", "KJV", "King James Version"],
  ["id", "Indonesian", "Bahasa Indonesia", "ltr", "TB", "Terjemahan Baru"],
  ["es", "Spanish", "Español", "ltr", "RVA", "Reina-Valera Antigua"],
  ["zh", "Mandarin", "中文", "ltr", "CUV", "Chinese Union Version"],
  ["hi", "Hindi", "हिन्दी", "ltr", "HINDI", "Hindi Bible"],
  ["ar", "Arabic", "العربية", "rtl", "SVD", "Smith Van Dyke Arabic Bible"],
  ["pt", "Portuguese", "Português", "ltr", "ACF", "Almeida Revista e Atualizada"],
  ["bn", "Bengali", "বাংলা", "ltr", "BEN", "Bengali Bible"],
  ["ru", "Russian", "Русский", "ltr", "RSB", "Russian Synodal Bible"],
  ["ja", "Japanese", "日本語", "ltr", "JPN", "Japanese Denmo Bible"],
  ["de", "German", "Deutsch", "ltr", "LUT", "Luther Bible 1912"],
  ["jv", "Javanese", "Jawa", "ltr", "JAV", "Javanese Bible"],
  ["ko", "Korean", "한국어", "ltr", "KRV", "Korean Revised Version"],
  ["fr", "French", "Français", "ltr", "LSG", "Louis Segond Bible"],
  ["tr", "Turkish", "Türkçe", "ltr", "TUR", "Turkish Bible"],
  ["vi", "Vietnamese", "Tiếng Việt", "ltr", "VI", "Vietnamese Bible"],
  ["te", "Telugu", "తెలుగు", "ltr", "TEL", "Telugu Bible"],
  ["mr", "Marathi", "मराठी", "ltr", "MAR", "Marathi Bible"],
  ["ta", "Tamil", "தமிழ்", "ltr", "TAM", "Tamil Bible"],
  ["ur", "Urdu", "اردو", "rtl", "URD", "Urdu Bible"],
  ["it", "Italian", "Italiano", "ltr", "DIO", "Italian Diodati Bible"],
  ["th", "Thai", "ไทย", "ltr", "THA", "Thai Bible"],
  ["gu", "Gujarati", "ગુજરાતી", "ltr", "GUJ", "Gujarati Bible"],
  ["fa", "Persian", "فارسی", "rtl", "FAR", "Persian Bible"],
  ["pl", "Polish", "Polski", "ltr", "BGP", "Polish Bible of Gdańsk"],
  ["ps", "Pashto", "پښتو", "rtl", "PAS", "Pashto Bible"],
  ["kn", "Kannada", "ಕನ್ನಡ", "ltr", "KAN", "Kannada Bible"],
  ["ml", "Malayalam", "മലയാളം", "ltr", "MAL", "Malayalam Bible"],
  ["su", "Sundanese", "Sunda", "ltr", "SUN", "Sundanese Bible"],
  ["ha", "Hausa", "Hausa", "ltr", "HAU", "Hausa Bible"],
  ["or", "Odia", "ଓଡ଼ିଆ", "ltr", "ORI", "Odia Bible"],
  ["my", "Burmese", "မြန်မာ", "ltr", "BUR", "Burmese Bible"],
  ["hak", "Hakka", "客家話", "ltr", "HAK", "Hakka Bible"],
  ["uk", "Ukrainian", "Українська", "ltr", "UKR", "Ukrainian Bible"],
  ["bho", "Bhojpuri", "भोजपुरी", "ltr", "BHO", "Bhojpuri Bible"],
  ["tl", "Tagalog", "Tagalog", "ltr", "ADB", "Ang Dating Biblia"],
  ["yo", "Yoruba", "Yorùbá", "ltr", "YOR", "Yoruba Bible"],
  ["mai", "Maithili", "मैथिली", "ltr", "MAI", "Maithili Bible"],
  ["uz", "Uzbek", "Oʻzbekcha", "ltr", "UZB", "Uzbek Bible"],
  ["sd", "Sindhi", "سنڌي", "rtl", "SND", "Sindhi Bible"],
  ["am", "Amharic", "አማርኛ", "ltr", "AMH", "Amharic Bible"],
  ["ff", "Fula", "Fulfulde", "ltr", "FUL", "Fula Bible"],
  ["ro", "Romanian", "Română", "ltr", "COR", "Cornilescu Bible"],
  ["om", "Oromo", "Afaan Oromoo", "ltr", "ORO", "Oromo Bible"],
  ["ig", "Igbo", "Igbo", "ltr", "IGB", "Igbo Bible"],
  ["az", "Azerbaijani", "Azərbaycanca", "ltr", "AZE", "Azerbaijani Bible"],
  ["awa", "Awadi", "अवधी", "ltr", "AWA", "Awadi Bible"],
  ["nl", "Dutch", "Nederlands", "ltr", "SV", "Statenvertaling"],
  ["ku", "Kurdish", "کوردی", "rtl", "KUR", "Kurdish Bible"],
  ["sh", "Serbo-Croatian", "Srpskohrvatski", "ltr", "SHB", "Serbo-Croatian Bible"],
  ["mg", "Malagasy", "Malagasy", "ltr", "MLG", "Malagasy Bible"],
  ["skr", "Saraiki", "سرائیکی", "rtl", "SKR", "Saraiki Bible"],
  ["ne", "Nepali", "नेपाली", "ltr", "NEP", "Nepali Bible"],
  ["si", "Sinhala", "සිංහල", "ltr", "SLK", "Sinhala Bible"],
  ["ctg", "Chittagonian", "চিটাগাঁইয়া", "ltr", "CTG", "Chittagonian Bible"],
  ["za", "Zhuang", "Vahcuengh", "ltr", "ZHA", "Zhuang Bible"],
  ["km", "Khmer", "ខ្មែរ", "ltr", "KHM", "Khmer Bible"],
  ["tk", "Turkmen", "Türkmençe", "ltr", "TKM", "Turkmen Bible"],
  ["as", "Assamese", "অসমীয়া", "ltr", "ASS", "Assamese Bible"],
  ["mad", "Madurese", "Madhurâ", "ltr", "MAD", "Madurese Bible"],
  ["so", "Somali", "Soomaali", "ltr", "SOM", "Somali Bible"],
  ["mwr", "Marwari", "मारवाड़ी", "ltr", "MWR", "Marwari Bible"],
  ["mag", "Magahi", "मगही", "ltr", "MGH", "Magahi Bible"],
  ["bgc", "Haryanvi", "हरियाणवी", "ltr", "HARY", "Haryanvi Bible"],
  ["hu", "Hungarian", "Magyar", "ltr", "KAR", "Károli Bible"],
  ["hne", "Chhattisgarhi", "छत्तीसगढ़ी", "ltr", "HNE", "Chhattisgarhi Bible"],
  ["el", "Greek", "Ελληνικά", "ltr", "GRK", "Greek Bible"],
  ["ny", "Chewa", "Chichewa", "ltr", "CHE", "Chichewa Bible"],
  ["dcc", "Deccan", "دکنی", "rtl", "DCC", "Deccani Bible"],
  ["ak", "Akan", "Akan", "ltr", "AKN", "Akan Bible"],
  ["kk", "Kazakh", "Қазақша", "ltr", "KAZ", "Kazakh Bible"],
  ["mnp", "Min Bei", "闽北语", "ltr", "MNP", "Min Bei Bible"],
  ["syl", "Sylheti", "ꠍꠤꠟꠐꠤ", "ltr", "SYL", "Sylheti Bible"],
  ["zu", "Zulu", "isiZulu", "ltr", "ZUL", "Zulu Bible"],
  ["cs", "Czech", "Čeština", "ltr", "KRAL", "Czech Kralická Bible"],
  ["rw", "Kinyarwanda", "Ikinyarwanda", "ltr", "RWA", "Kinyarwanda Bible"],
  ["dhv", "Dhundhari", "ढूंढ़ाड़ी", "ltr", "DHV", "Dhundhari Bible"],
  ["ht", "Haitian Creole", "Kreyòl Ayisyen", "ltr", "HAI", "Haitian Creole Bible"],
  ["mdz", "Min Dong", "闽东语", "ltr", "MDZ", "Min Dong Bible"],
  ["ilo", "Ilokano", "Ilokano", "ltr", "ILO", "Ilokano Bible"],
  ["qu", "Quechua", "Runasimi", "ltr", "QUE", "Quechua Bible"],
  ["rn", "Kirundi", "Ikirundi", "ltr", "RND", "Kirundi Bible"],
  ["sv", "Swedish", "Svenska", "ltr", "SV1917", "Swedish Bible 1917"],
  ["hmn", "Hmong", "Hmoob", "ltr", "HMN", "Hmong Bible"],
  ["sn", "Shona", "chiShona", "ltr", "SHO", "Shona Bible"],
  ["ug", "Uyghur", "ئۇيغۇرچە", "rtl", "UYG", "Uyghur Bible"],
  ["hil", "Hiligaynon", "Hiligaynon", "ltr", "HIL", "Hiligaynon Bible"],
  ["he", "Hebrew", "עברית", "rtl", "HEB", "Hebrew Bible"],
];

/**
 * Translation rows. One line per language, fields pipe-delimited in the
 * exact KEY_ORDER above. Filled by the translation authoring step.
 */
export const RAW_ROWS = `
en|Bible Plan|Home|Plans|Profile|Settings|Start|Continue|Complete|Next|Back|Save|Cancel|Search|Loading…|Something went wrong|Welcome|Today's Reading|Reading Plans|Chapter|Verse|Language|Theme|Notifications|Streak
id|Rencana Alkitab|Beranda|Rencana|Profil|Pengaturan|Mulai|Lanjutkan|Selesai|Berikutnya|Kembali|Simpan|Batal|Cari|Memuat…|Terjadi kesalahan|Selamat datang|Bacaan Hari Ini|Rencana Bacaan|Pasal|Ayat|Bahasa|Tema|Notifikasi|Rentetan
es|Plan Bíblico|Inicio|Planes|Perfil|Ajustes|Comenzar|Continuar|Completar|Siguiente|Atrás|Guardar|Cancelar|Buscar|Cargando…|Algo salió mal|Bienvenido|Lectura de hoy|Planes de lectura|Capítulo|Versículo|Idioma|Tema|Notificaciones|Racha
zh|读经计划|首页|计划|个人资料|设置|开始|继续|完成|下一步|返回|保存|取消|搜索|加载中…|出错了|欢迎|今日阅读|读经计划|章|节|语言|主题|通知|连续打卡
hi|बाइबल योजना|होम|योजनाएँ|प्रोफ़ाइल|सेटिंग्स|शुरू करें|जारी रखें|पूरा करें|अगला|वापस|सहेजें|रद्द करें|खोजें|लोड हो रहा है…|कुछ गलत हो गया|स्वागत है|आज का पाठ|वाचन योजनाएँ|अध्याय|पद|भाषा|थीम|सूचनाएँ|लगातार पढ़ाई
ar|خطة الكتاب المقدس|الرئيسية|الخطط|الملف الشخصي|الإعدادات|ابدأ|متابعة|إكمال|التالي|رجوع|حفظ|إلغاء|بحث|جارٍ التحميل…|حدث خطأ ما|مرحبًا|قراءة اليوم|خطط القراءة|الفصل|الآية|اللغة|المظهر|الإشعارات|سلسلة
pt|Plano Bíblico|Início|Planos|Perfil|Configurações|Começar|Continuar|Concluir|Próximo|Voltar|Salvar|Cancelar|Buscar|Carregando…|Algo deu errado|Bem-vindo|Leitura de hoje|Planos de leitura|Capítulo|Versículo|Idioma|Tema|Notificações|Sequência
bn|বাইবেল পরিকল্পনা|হোম|পরিকল্পনা|প্রোফাইল|সেটিংস|শুরু করুন|চালিয়ে যান|সম্পন্ন করুন|পরবর্তী|ফিরে যান|সংরক্ষণ করুন|বাতিল করুন|খুঁজুন|লোড হচ্ছে…|কিছু ভুল হয়েছে|স্বাগতম|আজকের পাঠ|পাঠ পরিকল্পনা|অধ্যায়|পদ|ভাষা|থিম|বিজ্ঞপ্তি|ধারাবাহিকতা
ru|Библейский план|Главная|Планы|Профиль|Настройки|Начать|Продолжить|Завершить|Далее|Назад|Сохранить|Отмена|Поиск|Загрузка…|Что-то пошло не так|Добро пожаловать|Чтение на сегодня|Планы чтения|Глава|Стих|Язык|Тема|Уведомления|Серия
ja|聖書プラン|ホーム|プラン|プロフィール|設定|開始|続ける|完了|次へ|戻る|保存|キャンセル|検索|読み込み中…|エラーが発生しました|ようこそ|今日の読書|読書プラン|章|節|言語|テーマ|通知|連続日数
de|Bibelplan|Startseite|Pläne|Profil|Einstellungen|Starten|Weiter|Abschließen|Nächste|Zurück|Speichern|Abbrechen|Suchen|Lädt…|Etwas ist schiefgelaufen|Willkommen|Heutige Lesung|Lesepläne|Kapitel|Vers|Sprache|Design|Benachrichtigungen|Serie
jv|Rencana Alkitab|Ngarep|Rencana|Profil|Setelan|Mulai|Lanjutake|Rampung|Sabanjure|Mbalik|Simpen|Batal|Telusuri|Ngemot…|Ana sing salah|Sugeng rawuh|Wacan dina iki|Rencana maca|Pasal|Ayat|Basa|Tema|Notifikasi|Runtutan
ko|성경 계획|홈|계획|프로필|설정|시작|계속|완료|다음|뒤로|저장|취소|검색|로딩 중…|문제가 발생했습니다|환영합니다|오늘의 읽기|읽기 계획|장|절|언어|테마|알림|연속 기록
fr|Plan biblique|Accueil|Plans|Profil|Paramètres|Commencer|Continuer|Terminer|Suivant|Retour|Enregistrer|Annuler|Rechercher|Chargement…|Une erreur s'est produite|Bienvenue|Lecture du jour|Plans de lecture|Chapitre|Verset|Langue|Thème|Notifications|Série
tr|Kutsal Kitap Planı|Ana Sayfa|Planlar|Profil|Ayarlar|Başla|Devam Et|Tamamla|Sonraki|Geri|Kaydet|İptal|Ara|Yükleniyor…|Bir şeyler ters gitti|Hoş geldiniz|Bugünün Okuması|Okuma Planları|Bölüm|Ayet|Dil|Tema|Bildirimler|Seri
vi|Kế hoạch Kinh Thánh|Trang chủ|Kế hoạch|Hồ sơ|Cài đặt|Bắt đầu|Tiếp tục|Hoàn thành|Tiếp theo|Quay lại|Lưu|Hủy|Tìm kiếm|Đang tải…|Đã có lỗi xảy ra|Chào mừng|Bài đọc hôm nay|Kế hoạch đọc|Chương|Câu|Ngôn ngữ|Chủ đề|Thông báo|Chuỗi
te|బైబిల్ ప్రణాళిక|హోమ్|ప్రణాళికలు|ప్రొఫైల్|సెట్టింగులు|ప్రారంభించు|కొనసాగించు|పూర్తి చేయి|తదుపరి|వెనుకకు|భద్రపరచు|రద్దు చేయి|వెతకండి|లోడ్ అవుతోంది…|ఏదో తప్పు జరిగింది|స్వాగతం|నేటి పఠనం|పఠన ప్రణాళికలు|అధ్యాయం|వాక్యం|భాష|థీమ్|నోటిఫికేషన్లు|వరుస
mr|बायबल योजना|मुख्यपृष्ठ|योजना|प्रोफाइल|सेटिंग्ज|सुरू करा|सुरू ठेवा|पूर्ण करा|पुढील|मागे|जतन करा|रद्द करा|शोधा|लोड होत आहे…|काहीतरी चूक झाली|स्वागत|आजचे वाचन|वाचन योजना|अध्याय|श्लोक|भाषा|थीम|सूचना|सलग
ta|விவிலியத் திட்டம்|முகப்பு|திட்டங்கள்|சுயவிவரம்|அமைப்புகள்|தொடங்கு|தொடர்க|முடிக்க|அடுத்தது|பின்|சேமி|ரத்து செய்|தேடு|ஏற்றுகிறது…|ஏதோ தவறு நடந்தது|வரவேற்பு|இன்றைய வாசிப்பு|வாசிப்புத் திட்டங்கள்|அத்தியாயம்|வசனம்|மொழி|தீம்|அறிவிப்புகள்|தொடர்
ur|بائبل منصوبہ|ہوم|منصوبے|پروفائل|ترتیبات|شروع کریں|جاری رکھیں|مکمل کریں|اگلا|واپس|محفوظ کریں|منسوخ کریں|تلاش کریں|لوڈ ہو رہا ہے…|کچھ غلط ہو گیا|خوش آمدید|آج کی تلاوت|تلاوت کے منصوبے|باب|آیت|زبان|تھیم|اطلاعات|تسلسل
it|Piano Biblico|Home|Piani|Profilo|Impostazioni|Inizia|Continua|Completa|Avanti|Indietro|Salva|Annulla|Cerca|Caricamento…|Qualcosa è andato storto|Benvenuto|Lettura di oggi|Piani di lettura|Capitolo|Versetto|Lingua|Tema|Notifiche|Serie
th|แผนการอ่านพระคัมภีร์|หน้าแรก|แผน|โปรไฟล์|การตั้งค่า|เริ่มต้น|ดำเนินการต่อ|เสร็จสิ้น|ถัดไป|ย้อนกลับ|บันทึก|ยกเลิก|ค้นหา|กำลังโหลด…|เกิดข้อผิดพลาด|ยินดีต้อนรับ|การอ่านวันนี้|แผนการอ่าน|บท|ข้อ|ภาษา|ธีม|การแจ้งเตือน|วันต่อเนื่อง
gu|બાઇબલ યોજના|હોમ|યોજનાઓ|પ્રોફાઇલ|સેટિંગ્સ|શરૂ કરો|ચાલુ રાખો|પૂર્ણ કરો|આગળ|પાછળ|સાચવો|રદ કરો|શોધો|લોડ થઈ રહ્યું છે…|કંઈક ખોટું થયું|સ્વાગત|આજનું વાંચન|વાંચન યોજનાઓ|અધ્યાય|શ્લોક|ભાષા|થીમ|સૂચનાઓ|શ્રેણી
fa|برنامهٔ کتاب مقدس|خانه|برنامه‌ها|نمایه|تنظیمات|شروع|ادامه|تکمیل|بعدی|بازگشت|ذخیره|لغو|جستجو|در حال بارگذاری…|مشکلی پیش آمد|خوش آمدید|خواندن امروز|برنامه‌های مطالعه|فصل|آیه|زبان|تم|اعلان‌ها|زنجیره
pl|Plan Biblii|Strona główna|Plany|Profil|Ustawienia|Rozpocznij|Kontynuuj|Zakończ|Dalej|Wstecz|Zapisz|Anuluj|Szukaj|Ładowanie…|Coś poszło nie tak|Witamy|Dzisiejsze czytanie|Plany czytania|Rozdział|Werset|Język|Motyw|Powiadomienia|Seria
ps|د بائبل پلان|کور|پلانونه|پروفایل|تنظیمات|پیل|دوام|بشپړ|راتلونکی|بېرته|خوندي کول|لغوه|لټون|بارول کیږي…|یو څه غلط شول|ښه راغلاست|د نن لوستل|د لوستلو پلانونه|څپرکی|آیت|ژبه|موضوع|خبرتیاوې|لړۍ
kn|ಬೈಬಲ್ ಯೋಜನೆ|ಮುಖ್ಯ ಪುಟ|ಯೋಜನೆಗಳು|ಪ್ರೊಫೈಲ್|ಸೆಟ್ಟಿಂಗ್ಗಳು|ಪ್ರಾರಂಭ|ಮುಂದುವರಿಸಿ|ಪೂರ್ಣಗೊಳಿಸಿ|ಮುಂದೆ|ಹಿಂದೆ|ಉಳಿಸಿ|ರದ್ದು|ಹುಡುಕಿ|ಲೋಡ್ ಆಗುತ್ತಿದೆ…|ಏನೋ ತಪ್ಪಾಯಿತು|ಸ್ವಾಗತ|ಇಂದಿನ ಓದುವಿಕೆ|ಓದುವ ಯೋಜನೆಗಳು|ಅಧ್ಯಾಯ|ವಚನ|ಭಾಷೆ|ಥೀಮ್|ಅಧಿಸೂಚನೆಗಳು|ಸರಣಿ
ml|ബൈബിൾ പദ്ധതി|ഹോം|പദ്ധതികൾ|പ്രൊഫൈൽ|ക്രമീകരണങ്ങൾ|ആരംഭിക്കുക|തുടരുക|പൂർത്തിയാക്കുക|അടുത്തത്|മടങ്ങുക|സൂക്ഷിക്കുക|റദ്ദാക്കുക|തിരയുക|ലോഡ് ചെയ്യുന്നു…|എന്തോ തെറ്റായി|സ്വാഗതം|ഇന്നത്തെ വായന|വായനാ പദ്ധതികൾ|അധ്യായം|വാക്യം|ഭാഷ|തീം|അറിയിപ്പുകൾ|തുടർച്ച
su|Rencana Alkitab|Imah|Rencana|Profil|Setélan|Mimitian|Teruskeun|Réngsékeun|Salajengna|Deui|Simpen|Batal|Milarian|Nimuatan…|Aya anu lepat|Wilujeng sumping|Bacaan dinten ieu|Rencana maca|Bab|Ayat|Basa|Téma|Bewara|Runtuyan
ha|Shirin Littafi|Gida|Shirye-shirye|Bayanan martaba|Saituna|Fara|Ci gaba|Kammala|Na gaba|Baya|Ajiye|Soke|Nema|Ana lodawa…|Akwai matsala|Maraba|Karatun yau|Shirye-shiryen karatu|Babi|Aya|Harshe|Jigo|Sanarwa|Jeri
or|ବାଇବେଲ ଯୋଜନା|ଘର|ଯୋଜନାଗୁଡ଼ିକ|ପ୍ରୋଫାଇଲ୍|ସେଟିଂସ୍|ଆରମ୍ଭ|ଜାରି ରଖନ୍ତୁ|ସମ୍ପୂର୍ଣ୍ଣ|ପରବର୍ତ୍ତୀ|ଫେରନ୍ତୁ|ସଂରକ୍ଷଣ|ବାତିଲ୍|ଖୋଜନ୍ତୁ|ଲୋଡ୍ ହେଉଛି…|କିଛି ଭୁଲ୍ ହେଲା|ସ୍ୱାଗତ|ଆଜିର ପଠନ|ପଠନ ଯୋଜନା|ଅଧ୍ୟାୟ|ପଦ|ଭାଷା|ଥିମ୍|ସୂଚନା|ଧାରା
my|ဘိုင်းဘယ်အစီအစဉ်|မူလစာမျက်နှာ|အစီအစဉ်များ|ပရိုဖိုင်|ဆက်တင်များ|စတင်|ဆက်လက်|ပြီးဆုံး|နောက်တစ်ခု|ပြန်|သိမ်း|ပယ်ဖျက်|ရှာဖွေ|တင်နေသည်…|တစ်စုံတစ်ရာ မှားယွင်းသွားသည်|ကြိုဆိုပါသည်|ဒီနေ့ ဖတ်ရှုချက်|ဖတ်ရှုအစီအစဉ်များ|အခန်း|ကျမ်းပိုဒ်|ဘာသာစကား|အပြင်အဆင်|အကြောင်းကြားချက်များ|ဆက်တိုက်
hak|聖經計畫|首頁|計畫|個人資料|設定|開始|繼續|完成|下一頁|返回|儲存|取消|搜尋|載入中…|發生錯誤|歡迎|今日經文|讀經計畫|章|節|語言|主題|通知|連續
uk|План Біблії|Головна|Плани|Профіль|Налаштування|Почати|Продовжити|Завершити|Далі|Назад|Зберегти|Скасувати|Пошук|Завантаження…|Щось пішло не так|Ласкаво просимо|Сьогоднішнє читання|Плани читання|Розділ|Вірш|Мова|Тема|Сповіщення|Серія
bho|बाइबल योजना|घर|योजनाएँ|प्रोफाइल|सेटिंग्स|शुरू|जारी राखीं|पूरा करीं|आगे|पीछे|सहेजीं|रद्द करीं|खोजीं|लोड हो रहल बा…|किछु गड़बड़ भइल|स्वागत|आजक पढ़ाई|पढ़ाई योजना|अध्याय|श्लोक|भाषा|थीम|सूचना|धारा
tl|Plano ng Bibliya|Tahanan|Mga Plano|Profile|Mga Setting|Simulan|Ipagpatuloy|Tapusin|Susunod|Bumalik|I-save|Kanselahin|Hanapin|Naglo-load…|May naganap na mali|Maligayang pagdating|Pagbasa Ngayon|Mga Plano sa Pagbasa|Kabanata|Talata|Wika|Tema|Mga Abiso|Sunod-sunod
yo|Ètò Bíbélì|Ilé|Àwọn étò|Profáìlì|Àtúnṣe|Bẹ̀rẹ̀|Tẹ̀síwájú|Parí|Tókàn|Padà|Fi pamọ́|Fagilé|Wá|Ń gbé wọlé…|Ohun kan ṣe aṣiṣe|Kú àbọ̀|Kíkà òní|Àwọn étò kíkà|Orí|Ẹ̀sẹ̀|Èdè|Téma|Àwọn ìfitónilétí|Àtokàn
mai|बाइबल योजना|घर|योजनाएँ|प्रोफाइल|सेटिंग्स|शुरू|जारी राखीं|पूरा|अगला|पिछला|सहेजीं|रद्द|खोज|लोड होइत अछि…|किछु गलत भ गेल|स्वागत|आजिक पढ़ाई|पढ़ाई योजना|अध्याय|श्लोक|भाषा|थीम|सूचना|धारा
uz|Muqaddas Kitob rejasi|Bosh sahifa|Rejalar|Profil|Sozlamalar|Boshlash|Davom etish|Tugatish|Keyingi|Orqaga|Saqlash|Bekor qilish|Qidirish|Yuklanmoqda…|Nimadir xato ketdi|Xush kelibsiz|Bugungi o'qish|O'qish rejalari|Bob|Oyat|Til|Mavzu|Bildirishnomalar|Ketma-ketlik
sd|بائيبل پلان|گھر|منصوبا|پروفائل|سيٽنگون|شروع|جاري رکو|مڪمل|اڳيون|واپس|محفوظ ڪريو|منسوخ|ڳولھيو|لوڊ ٿي رھيو آھي…|ڪجهه غلط ٿي ويو|ڀلي ڪري آيا|اڄ جو پڙھڻ|پڙھڻ جا منصوبا|باب|آيت|ٻولي|موضوع|اطلاعون|لڳاتار
am|የመጽሐፍ ቅዱስ እቅድ|መነሻ|እቅዶች|መገለጫ|ቅንብሮች|ጀምር|ቀጥል|አጠናቅቅ|ቀጥሎ|ተመለስ|አስቀምጥ|ሰርዝ|ፈልግ|እየጫነ ነው…|የሆነ ችግር ተፈጥሯል|እንኳን ደህና መጡ|የዛሬ ንባብ|የንባብ እቅዶች|ምዕራፍ|ጥቅስ|ቋንቋ|ገጽታ|ማሳወቂያዎች|ተከታታይ
ff|Pilot Bible|Wuro|Pilotaaɗe|Profaayil|Cuɓaaɗe|Fuɗɗo|Jokku|Timmina|Ko caggal|Rutto|Daspito|Woppito|Yiilo|Ina ɓeydee…|Ko fenaande waɗii|Njaɓɓo|Janngugol hannde|Pilotaaɗe janngugol|Bappa|Aaya|Ɗemngal|Tema|Kumpiteeje|Jokkondiral
ro|Planul Bibliei|Acasă|Planuri|Profil|Setări|Începe|Continuă|Finalizează|Următorul|Înapoi|Salvează|Anulează|Caută|Se încarcă…|Ceva nu a mers bine|Bun venit|Lectura de azi|Planuri de citire|Capitol|Verset|Limbă|Temă|Notificări|Serie
om|Pilaanii Macaafa Qulqulluu|Fuula duraa|Pilaanota|Profaayilii|Haal-kaa'umsa|Jalqabu|Itti fufu|Xumuru|Ittaaya|Duubatti|Kaa'u|Kufuu|Barbaadu|Fe'uu jira…|Waanti tokko dogoggora'e|Baga dhuftan|Dubbisa har'aa|Pilaanota dubbisaa|Boqonnaa|Aayaa|Afaan|Tema|Beeftoota|Walitti qabaa
ig|Atụmatụ Akwụkwọ Nsọ|Ụlọ|Atụmatụ|Prọfaịlụ|Ntọala|Malite|Gaa n'ihu|Mecha|Na-esote|Laghachi|Chekwa|Kagbuo|Chọọ|Na-ebu…|Ihe ọjọọ mere|Nnọọ|Ọgụgụ taa|Atụmatụ Ọgụgụ|Isi|Ama|Asụsụ|Ụdị|Ọkwa|Usoro
az|Müqəddəs Kitab Planı|Ana səhifə|Planlar|Profil|Parametrlər|Başla|Davam et|Tamamla|Növbəti|Geri|Yadda saxla|Ləğv et|Axtar|Yüklənir…|Bir şey səhv getdi|Xoş gəlmisiniz|Bugünkü oxunuş|Oxunuş planları|Fəsil|Ayə|Dil|Tema|Bildirişlər|Seriya
awa|बाइबिल योजना|घर|योजनाएँ|प्रोफाइल|सेटिंग|शुरू|जारी रखें|पूरा करें|अगला|वापस|सहेजें|रद्द करें|खोजें|लोड हो रहा…|कुछ गड़बड़ हो गई|स्वागत|आज का पाठ|पाठ योजनाएँ|अध्याय|श्लोक|भाषा|थीम|सूचनाएँ|सिलसिला
nl|Bijbelplan|Thuis|Plannen|Profiel|Instellingen|Start|Doorgaan|Voltooien|Volgende|Terug|Opslaan|Annuleren|Zoeken|Laden…|Er ging iets mis|Welkom|Lezing van vandaag|Leesplannen|Hoofdstuk|Vers|Taal|Thema|Meldingen|Reeks
ku|پلانی کتێبی پیرۆز|ماڵەوە|پلانەکان|پڕۆفایل|ڕێکخستنەکان|دەستپێک|بەردەوام بە|تەواو بکە|دواتر|گەڕانەوە|پاشەکەوت بکە|هەڵوەشاندنەوە|گەڕان|لە بارکردندایە…|شتێک هەڵە ڕوویدا|بەخێرهاتیت|خوێندنی ئەمڕۆ|پلانەکانی خوێندن|بەش|ئایەت|زمان|شێوە|ئاگادارکردنەوەکان|زنجیرە
sh|Biblijski plan|Početna|Planovi|Profil|Postavke|Započni|Nastavi|Završi|Sledeće|Nazad|Sačuvaj|Otkaži|Pretraga|Učitavanje…|Nešto je pošlo po zlu|Dobrodošli|Današnje čitanje|Planovi čitanja|Poglavlje|Stih|Jezik|Tema|Obaveštenja|Serija
mg|Drafitry ny Baiboly|Trano|Drafitra|Profila|Fikirana|Manomboka|Manohy|Vita|Manaraka|Miverina|Tehirizo|Afohana|Fikarohana|Mampidirina…|Misy tsy mety|Tongasoa|Famakiana androany|Drafitra famakiana|Toko|Andininy|Fiteny|Endrika|Fampahafantarana|Misesy
skr|بائبل پلان|گھر|منصوبے|پروفائل|ترتیبات|شروع|جاری رکھو|مکمل کرو|اگلا|واپس|محفوظ کرو|منسوخ کرو|تلاش|لوڈ ہو رہا اے…|کچھ غلط ہو گیا|جی آیاں|اڄ دا پڑھنا|پڑھن دے منصوبے|باب|آیت|زبان|تھیم|اطلاع|سلسلہ
ne|बाइबल योजना|गृह|योजनाहरू|प्रोफाइल|सेटिङ्हरू|सुरु|जारी राख्नुहोस्|पूरा गर्नुहोस्|अर्को|फिर्ता|सहेज्नुहोस्|रद्द गर्नुहोस्|खोजी|लोड हुँदै…|केहि गलत भयो|स्वागम|आजको पाठ|पाठ योजनाहरू|अध्याय|पद|भाषा|थिम|सूचनाहरू|श्रृंखला
si|බයිබල් සැලැස්ම|මුල් පිටුව|සැලසුම්|පැතිකඩ|සැකසුම්|ආරම්භ කරන්න|ඉදිරියට යන්න|සම්පූර්ණ කරන්න|ඊළඟ|ආපසු|සුරකින්න|අවලංගු කරන්න|සොයන්න|පූරණය වෙමින්…|මොකක් හරි වැරැද්දක් වුණා|සාදරයෙන් පිළිගනිමු|අද කියවීම|කියවීම් සැලසුම්|පරිච්ඡේදය|පදය|භාෂාව|තේමාව|දැනුම්දීම්|අනුක්‍රමය
ctg|বাইবেল প্ল্যান|ঘর|প্ল্যান|প্রোফাইল|সেটিংস|শুরু|চালিয়ে যান|পূর্ণ করুন|পরের|ফিরে|সংরক্ষণ|বাতিল|খোঁজা|লোড হচ্ছে…|কিছু ভুল হয়েছে|স্বাগতম|আজকের পাঠ|পাঠ পরিকল্পনা|অধ্যায়|আয়াত|ভাষা|থিম|বিজ্ঞপ্তি|ধারা
za|Geiqveq Singjgih|Ranz|Geiqveq|Profaij|Diuzdingj|Kaizsi|Gyizsuk|Wanzbaed|Laeng|Dauq|Cujcwnz|Cujsiu|Soug|Lij lod…|Miz gijmaz loek lo|Cingj daeuj|Dug ngoenzneix|Geiqveq dug|Cang|Gej|Vah|Cujdiz|Tongzyi|Lienzmienh
km|ផែនការព្រះគម្ពីរ|ទំព័រដើម|ផែនការ|ប្រវត្តិរូប|ការកំណត់|ចាប់ផ្ដើម|បន្ត|បញ្ចប់|បន្ទាប់|ត្រឡប់|រក្សាទុក|បោះបង់|ស្វែងរក|កំពុងផ្ទុក…|មានអ្វីមួយខុសហើយ|សូមស្វាគមន៍|ការអានថ្ងៃនេះ|ផែនការអាន|ជំពូក|ខគម្ពីរ|ភាសា|ប្រធានបទ|ការជូនដំណឹង|ជាប់ៗគ្នា
tk|Mukaddes Kitap meýilnamasy|Baş sahypa|Meýilnamalar|Profil|Sazlamalar|Başla|Dowam et|Tamamla|Indiki|Yza|Sakla|Yza al|Gözle|Ýüklenýär…|Bir zat nädogry boldy|Hoş geldiňiz|Şu günüň okalysy|Okalys meýilnamalary|Bap|Aýat|Dil|Tema|Bildirişler|Zynjyr
as|বাইবেল পৰিকল্পনা|মূল পৃষ্ঠা|পৰিকল্পনা|প্ৰফাইল|ছেটিংছ|আৰম্ভ|আগবাঢ়ক|সম্পূৰ্ণ কৰক|পৰৱৰ্তী|উভতি|সংৰক্ষণ|বাতিল|সন্ধান|ল'ড হৈ আছে…|কিবা ভুল হ'ল|স্বাগতম|আজিৰ পাঠ|পাঠ পৰিকল্পনা|অধ্যায়|পদ|ভাষা|থিম|জাননী|ধাৰা
mad|Rencana Kitab Suci|Bengko|Rencana|Profil|Setelan|Molai|Nerusake|Selesai|Sabanjure|Bali|Simpen|Batal|Nggoleki|Lagi dimuat…|Ana sing ora bener|Sugeng rawuh|Wacan dina iki|Rencana wacan|Bab|Ayat|Basa|Tema|Notifikasi|Beruntun
so|Qorshaha Kitaabka Quduuska ah|Guri|Qorshayaal|Profayl|Dejinta|Bilow|Sii wad|Dhamaystir|Ku xiga|Dib|Keydi|Burin|Raadi|Soo shubaya…|Waxaa dhacay qalad|Soo dhawoow|Akhrista maanta|Qorshayaasha akhriska|Cutub|Aayad|Luuqad|Qaab|Ogeysiisyo|Silsilad
mwr|बाइबल योजना|घर|योजनाएँ|प्रोफाइल|सेटिंग|शुरू|जारी रखो|पूरा करो|अगला|वापस|सहेजो|रद्द करो|खोजो|लोड हो रहा…|कुछ गलत हो गया|स्वागत|आज का पाठ|पाठ योजनाएँ|अध्याय|श्लोक|भाषा|थीम|सूचनाएँ|सिलसिला
mag|बाइबिल योजना|घर|योजना|प्रोफाइल|सेटिंग|शुरू|जारी राखूँ|पूरा करूँ|अगला|पीछे|सहेजूँ|रद्द करूँ|खोजूँ|लोड हो रहा…|किछु गलत भ गेल|स्वागत|आज के पाठ|पाठ योजना|अध्याय|श्लोक|भाषा|थीम|सूचना|सिलसिला
bgc|बाइबल प्लान|घर|प्लान|प्रोफाइल|सेटिंग|शुरू|जारी रखो|पूरा करो|अगला|पीछे|सहेजो|रद्द करो|खोजो|लोड हो रहा…|कुछ गड़बड़ हो गई|स्वागत|आज के पाठ|पाठ के प्लान|अध्याय|श्लोक|भाषा|थीम|सूचना|सिलसिला
hu|Bibliai terv|Kezdőlap|Tervek|Profil|Beállítások|Indítás|Folytatás|Befejezés|Következő|Vissza|Mentés|Mégse|Keresés|Betöltés…|Valami hiba történt|Üdvözlünk|Mai olvasmány|Olvasmánytervek|Fejezet|Vers|Nyelv|Téma|Értesítések|Sorozat
hne|बाइबल योजना|घर|योजना|प्रोफाइल|सेटिंग|शुरू|जारी रखो|पूरा करो|अगला|पीछे|सहेजो|रद्द करो|खोजो|लोड हो रहा…|कुछ गलत हो गई|स्वागत|आज के पाठ|पाठ योजना|अध्याय|श्लोक|भाषा|थीम|सूचना|सिलसिला
el|Σχέδιο Βίβλου|Αρχική|Σχέδια|Προφίλ|Ρυθμίσεις|Έναρξη|Συνέχεια|Ολοκλήρωση|Επόμενο|Πίσω|Αποθήκευση|Ακύρωση|Αναζήτηση|Φόρτωση…|Κάτι πήγε στραβά|Καλώς ήρθατε|Σημερινή Ανάγνωση|Σχέδια Ανάγνωσης|Κεφάλαιο|Στίχος|Γλώσσα|Θέμα|Ειδοποιήσεις|Σερί
ny|Ndondomeko ya Baibulo|Kunyumba|Mapulani|Profayili|Zokonza|Yamba|Pitiriza|Maliza|Chotsatira|Bwerera|Sungani|Letsani|Sakani|Ikutsitsa…|Chinthu chalakwika|Takulandilani|Kuwerenga kwa Lero|Ndondomeko Zowerengera|Mutu|Vesi|Chinenero|Mawonekedwe|Zidziwitso|Mndandanda
dcc|بائبل پلان|گھر|منصوبے|پروفائل|ترتیبات|شروع|جاری رکھیں|مکمل|اگلا|واپس|محفوظ کریں|منسوخ|تلاش|لوڈ ہو رہا ہے…|کچھ غلط ہو گیا|خوش آمدید|آج کا مطالعہ|مطالعے کے منصوبے|باب|آیت|زبان|تھیم|اطلاعات|سلسلہ
ak|Bible Nhyehyɛe|Fie|Nhyehyɛe|Profayil|Sɛtin|Fi ase|Kɔ so|Wie|Nea edi hɔ|San kɔ|Sie|Gya|Hwehwɛ|Ɛreload…|Ebiribi ayɛ mfomso|Akwaaba|Nnɛ kenkan|Kenkan nhyehyɛe|Ti|Nkyekyɛmu|Kasa|Ahosu|Amanneɛbɔ|Ntoatoa
kk|Киелі Кітап жоспары|Басты бет|Жоспарлар|Профиль|Параметрлер|Бастау|Жалғастыру|Аяқтау|Келесі|Артқа|Сақтау|Болдырмау|Іздеу|Жүктелуде…|Бірдеңе дұрыс болмады|Қош келдіңіз|Бүгінгі оқу|Оқу жоспарлары|Тарау|Аят|Тіл|Тақырып|Хабарландырулар|Үздіксіздік
mnp|圣经计划|首页|计划|个人资料|设置|开始|继续|完成|下一个|返回|保存|取消|搜索|加载中…|出了点问题|欢迎|今日读经|读经计划|章|节|语言|主题|通知|连续打卡
syl|বাইবেল প্ল্যান|বাড়ি|পরিকল্পনা|প্রোফাইল|সেটিংস|শুরু|চালিয়ে যান|সম্পূর্ণ|পরবর্তী|ফিরে|সংরক্ষণ|বাতিল|খুঁজুন|লোড হচ্ছে…|কিছু ভুল হয়েছে|স্বাগতম|আজকের পাঠ|পড়ার পরিকল্পনা|অধ্যায়|শ্লোক|ভাষা|থিম|বিজ্ঞপ্তি|ধারা
zu|Uhlelo lweBhayibheli|Ekhaya|Izinhlelo|Iphrofayela|Izilungiselelo|Qala|Qhubeka|Qedela|Okulandelayo|Emuva|Londoloza|Khansela|Sesha|Iyalayisha…|Kukhona okungahambanga kahle|Siyakwamukela|Ukufunda kwanamuhla|Izinhlelo zokufunda|Isahluko|Indima|Ulimi|Indikimba|Izaziso|Uchungechunge
cs|Bible plán|Domů|Plány|Profil|Nastavení|Začít|Pokračovat|Dokončit|Další|Zpět|Uložit|Zrušit|Hledat|Načítání…|Něco se pokazilo|Vítejte|Dnešní čtení|Plány čtení|Kapitola|Verš|Jazyk|Téma|Oznámení|Série
rw|Gahunda ya Bibiliya|Murugo|Gahunda|Umwirondoro|Igenamiterere|Tangira|Komeza|Soza|Kurikira|Subira|Bika|Hagarika|Shakisha|Irategurwa…|Hari ikintu kitagenze neza|Murakaza neza|Gusoma kwa none|Gahunda zo gusoma|Igice|Umurongo|Ururimi|Insanganyamatsiko|Imenyesha|Urukurikirane
dhv|बाइबिल प्लान|घर|योजनाएं|प्रोफाइल|सेटिंग्स|शुरू|जारी रखें|पूरा|अगला|वापस|सहेजें|रद्द|खोजें|लोड हो रहा है…|कुछ गलत हो गया|स्वागत|आज का पाठ|पढ़ने की योजनाएं|अध्याय|श्लोक|भाषा|थीम|सूचनाएं|सिलसिला
ht|Plan Bib la|Kay|Plan yo|Pwofil|Anviwònman|Kòmanse|Kontinye|Fini|Pwochen|Retounen|Sove|Anile|Chèche|Ap chaje…|Gen yon pwoblèm|Byenveni|Lekti jodi a|Plan lekti yo|Chapit|Vèsè|Lang|Tèm|Notifikasyon|Seri
mdz|圣经计划|首页|计划|个人资料|设置|开始|继续|完成|下一步|返回|保存|取消|搜索|加载中…|出了点问题|欢迎|今日读经|读经计划|章|节|语言|主题|通知|连续打卡
ilo|Plano ti Biblia|Balay|Dagiti Plano|Perfil|Panagseting|Rugi|Ituloy|Ipus|Sumaruno|Agsubli|Itiili|Ikanselar|Biruken|Agkarga…|Adda mali|Pagdung-ay|Panagbasbasa iti agdaw|Dagiti plano ti panagbasa|Kapitulo|Bersikulo|Pagsasao|Tema|Dagiti pakaammo|Serye
qu|Biblia Plan|Wasi|Plankuna|Perfil|Allichaykuna|Qallariy|Qatipay|Tukuy|Qatiqnin|Kutiy|Waqqiy|Qichuy|Maskay|Llamiyuchkan…|Imapas pantasqa|Allinmi shamunki|Kunan ñawiriy|Ñawiriy plankuna|Capitulu|Versikulu|Simi|Tema|Willakuykuna|Saruy
rn|Urugendo rwa Bibiliya|Mu rugo|Imigambi|Umwirondoro|Igenamiterere|Tangira|Komeza|Soza|Ukurikira|Subira inyuma|Bika|Hagarika|Shakisha|Irategurwa…|Hari ikintu kitagenze neza|Murakaze neza|Isomo rya none|Imigambi yo gusoma|Igice|Umurongo|Ururimi|Insanganyamatsiko|Imenyesha|Urukurikirane
sv|Bibelplan|Hem|Planer|Profil|Inställningar|Starta|Fortsätt|Slutför|Nästa|Tillbaka|Spara|Avbryt|Sök|Laddar…|Något gick fel|Välkommen|Dagens läsning|Läsplaner|Kapitel|Vers|Språk|Tema|Aviseringar|Följd
hmn|Phau Vajtswv Phiaj|Tsev|Cov Phiaj|Tus Kheej|Kev teeb tsa|Pib|Txuas ntxiv|Ua tiav|Tom ntej|Rov qab|Khaws|Tso tseg|Tshawb|Tab tom thauj…|Muaj ib yam ua tsis raug|Zoo siab txais tos|Kev nyeem hnub no|Cov phiaj nyeem|Tshooj|Nqe|Lus|Xim|Cov lus ceeb toom|Kev txuas ntxiv
sn|Chirongwa cheBhaibheri|Kumba|Zvirongwa|Profaili|Zvigadziro|Tanga|Ramba|Pedzisa|Chinotevera|Dzokera|Chengeta|Kanzura|Tsvaga|Iri kurodha…|Pane chakashata|Tikugashirei|Kuwerenga kwanhasi|Zvirongwa zvekuverenga|Chitsauko|Ndima|Mutauro|Dingindira|Zviziviso|Nhevedzano
ug|ئىنجىل پىلانى|باش بەت|پىلانلار|ئارخىپ|تەڭشەك|باشلاڭ|داۋاملاشتۇرۇڭ|تاماملاڭ|كېيىنكى|قايت|ساقلاڭ|ۋاز كېچىڭ|ئىزدەڭ|يۈكلىنىۋاتىدۇ…|بىرەر خاتالىق يۈز بەردى|خۇش كەلدىڭىز|بۈگۈنكى ئوقۇش|ئوقۇش پىلانلىرى|باب|ئايەت|تىل|تېما|ئۇقتۇرۇشلار|ئۈزلۈكسىزلىك
hil|Plano sang Biblia|Balay|Mga Plano|Perfil|Mga Setting|Sugod|Padayon|Tapuson|Sunod|Balik|Tipigi|Kanselar|Pangita|Nagakarga…|May sayop nga nahitabo|Malipayon pag-abot|Pagbasa karon|Mga plano sang pagbasa|Kapitulo|Bersikulo|Hambal|Tema|Mga pahibalo|Serye
he|תוכנית המקרא|בית|תוכניות|פרופיל|הגדרות|התחל|המשך|השלם|הבא|חזור|שמור|בטל|חיפוש|טוען…|משהו השתבש|ברוך הבא|קריאת היום|תוכניות קריאה|פרק|פסוק|שפה|ערכת נושא|התראות|רצף
`.trim();

function parseRows(raw) {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const fields = line.split("|");
      if (fields.length !== KEY_ORDER.length + 1) {
        throw new Error(
          `Row ${index + 1} has ${fields.length} fields; expected ${KEY_ORDER.length + 1}: ${line.slice(0, 80)}`
        );
      }
      const [code, ...values] = fields;
      const dictionary = {};
      KEY_ORDER.forEach((key, i) => {
        const value = values[i].trim();
        if (!value) throw new Error(`Empty value for ${code}.${key}`);
        if (value.includes("|")) throw new Error(`Pipe in value for ${code}.${key}`);
        dictionary[key] = value;
      });
      return [code, dictionary];
    });
}

function buildLanguageMetadata() {
  return LANGUAGES.map(([code, englishName, nativeName, dir, bibleTranslationId, bibleName]) => ({
    code,
    englishName,
    nativeName,
    dir,
    bibleTranslationId,
    bibleName,
  }));
}

function buildBibleTranslations() {
  return LANGUAGES.map(([code, , , , id, name]) => ({
    id,
    name,
    language: code,
    license: "public-domain-or-open",
  }));
}

async function writeJson(file, value) {
  const path = join(HERE, file);
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  console.log(`wrote ${file}`);
}

const GENERATED_BANNER = "// AUTO-GENERATED by generateLocales.mjs. Do not edit by hand.\n\n";

function generateLocalesModule(rows) {
  const keys = JSON.stringify(KEY_ORDER, null, 2);
  const bundles = rows
    .map(([code, dict]) => `  ${JSON.stringify(code)}: ${JSON.stringify(dict, null, 2)},`)
    .join("\n");
  return `${GENERATED_BANNER}export const LOCALE_KEYS = ${keys} as const;

export type LocaleKey = (typeof LOCALE_KEYS)[number];

export const LOCALES: Record<string, Record<LocaleKey, string>> = {
${bundles}
};
`;
}

function generateLanguagesModule(languages) {
  return `${GENERATED_BANNER}export interface LanguageMeta {
  code: string;
  englishName: string;
  nativeName: string;
  dir: "ltr" | "rtl";
  bibleTranslationId: string;
  bibleName: string;
}

export const LANGUAGES: LanguageMeta[] = ${JSON.stringify(languages, null, 2)} as LanguageMeta[];

export const LANGUAGE_CODES: string[] = LANGUAGES.map((language) => language.code);
`;
}

function generateBibleTranslationsModule(translations) {
  return `${GENERATED_BANNER}export interface BibleTranslationMeta {
  id: string;
  name: string;
  language: string;
  license: "public-domain-or-open";
}

export const BIBLE_TRANSLATIONS: BibleTranslationMeta[] = ${JSON.stringify(
    translations,
    null,
    2
  )} as BibleTranslationMeta[];

export const BIBLE_TRANSLATION_IDS: string[] = BIBLE_TRANSLATIONS.map((translation) => translation.id);
`;
}

async function main() {
  const rows = parseRows(RAW_ROWS);
  const rowMap = new Map(rows);
  const expectedCodes = LANGUAGES.map(([code]) => code);

  if (rows.length !== expectedCodes.length) {
    throw new Error(`Expected ${expectedCodes.length} translation rows, got ${rows.length}`);
  }
  if (rowMap.size !== rows.length) {
    throw new Error("Duplicate language codes in translation rows");
  }
  for (const code of expectedCodes) {
    if (!rowMap.has(code)) throw new Error(`Missing translation row for ${code}`);
  }

  const translationIds = LANGUAGES.map(([, , , , id]) => id);
  if (new Set(translationIds).size !== translationIds.length) {
    throw new Error("Duplicate Bible translation ids in language metadata");
  }

  const languageMetadata = buildLanguageMetadata();
  const bibleTranslations = buildBibleTranslations();

  await mkdir(LOCALES_DIR, { recursive: true });
  await writeJson("languages.json", languageMetadata);
  await writeJson("bibleTranslations.json", bibleTranslations);
  await writeFile(join(HERE, "generatedLanguages.ts"), generateLanguagesModule(languageMetadata), "utf8");
  await writeFile(
    join(HERE, "generatedBibleTranslations.ts"),
    generateBibleTranslationsModule(bibleTranslations),
    "utf8"
  );

  for (const code of expectedCodes) {
    await writeJson(join("locales", `${code}.json`), rowMap.get(code));
  }
  await writeFile(join(HERE, "generatedLocales.ts"), generateLocalesModule(rows), "utf8");

  console.log(`generated ${expectedCodes.length} locale bundles with ${KEY_ORDER.length} keys each`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
