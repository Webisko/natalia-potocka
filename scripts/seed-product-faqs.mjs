import path from 'node:path';
import Database from 'better-sqlite3';

const dbPath = path.resolve(process.cwd(), 'data/database.sqlite');
const db = new Database(dbPath);

const FAQ_BY_SLUG = {
  'otulic-polog': [
    {
      q: 'Czy webinar jest tylko dla kobiet przed pierwszym porodem?',
      a: 'Nie. Materiał przyda się zarówno wtedy, gdy przygotowujesz się do pierwszego połogu, jak i wtedy, gdy chcesz przeżyć kolejny połóg spokojniej, bardziej świadomie i z lepszym planem wsparcia.',
    },
    {
      q: 'Czy znajdę tu praktyczne wskazówki, a nie tylko teorię?',
      a: 'Tak. Webinar porządkuje wiedzę, ale jednocześnie pomaga ułożyć bardzo konkretne obszary: odpoczynek, organizację domu, pomoc bliskich, regenerację i zadbanie o siebie po porodzie.',
    },
    {
      q: 'Na jak długo otrzymuję dostęp do materiału?',
      a: 'Po zakupie otrzymujesz natychmiastowy dostęp do nagrania i możesz wracać do niego wtedy, kiedy tego potrzebujesz.',
    },
    {
      q: 'Czy ten webinar sprawdzi się także wtedy, gdy planuję cesarskie cięcie?',
      a: 'Tak. Wiedza o połogu, regeneracji, emocjach i organizacji wsparcia jest ważna niezależnie od sposobu rozwiązania ciąży.',
    },
  ],
  'porod-domowy': [
    {
      q: 'Czy webinar zachęca do porodu domowego?',
      a: 'Nie. Celem materiału nie jest przekonywanie do jednej drogi, ale pokazanie rzetelnych faktów, procedur i realiów, żeby decyzję podejmować świadomie i spokojnie.',
    },
    {
      q: 'Czy dowiem się, kto może rozważać poród domowy, a kto nie?',
      a: 'Tak. Webinar omawia kwalifikację do porodu domowego, kwestie bezpieczeństwa oraz sytuacje, w których taka opcja nie jest zalecana.',
    },
    {
      q: 'Czy materiał obejmuje temat ewentualnych komplikacji?',
      a: 'Tak. Jednym z ważnych elementów webinaru jest omówienie tego, co dzieje się w razie komplikacji i jak wygląda wtedy dalsze postępowanie.',
    },
    {
      q: 'Czy mogę obejrzeć webinar we własnym tempie?',
      a: 'Tak. Po zakupie otrzymujesz dostęp do nagrania, więc możesz wracać do niego wtedy, gdy chcesz jeszcze raz uporządkować informacje.',
    },
  ],
  'glowa-w-porodzie': [
    {
      q: 'Czy to materiał tylko dla kobiet, które bardzo boją się porodu?',
      a: 'Nie. Webinar jest także dla kobiet, które po prostu chcą lepiej zrozumieć swoje nastawienie, przekonania i emocje związane z porodem, nawet jeśli nie odczuwają silnego lęku.',
    },
    {
      q: 'Czy w materiale znajduje się część praktyczna?',
      a: 'Tak. Oprócz części merytorycznej otrzymujesz również medytację wzmacniającą pozytywną wizję porodu, którą możesz włączyć do własnego przygotowania.',
    },
    {
      q: 'Czy webinar zastępuje terapię?',
      a: 'Nie. To materiał edukacyjno-wspierający, który pomaga lepiej zrozumieć siebie i zacząć pracę z nastawieniem, ale nie zastępuje indywidualnej terapii w przypadku głębokiej traumy lub silnych objawów lękowych.',
    },
    {
      q: 'Czy mogę wracać do webinaru w trakcie ciąży więcej niż raz?',
      a: 'Tak. To bardzo dobry pomysł, bo wraz z kolejnymi etapami ciąży możesz słyszeć w tym materiale coś innego i pogłębiać własne przygotowanie.',
    },
  ],
  'hipnotyczny-obrot': [
    {
      q: 'Dla kogo jest ta medytacja?',
      a: 'Nagranie zostało przygotowane dla kobiet, których dziecko jest ułożone miednicowo i które chcą łagodnie wesprzeć proces obrotu w bezpiecznych, domowych warunkach.',
    },
    {
      q: 'Od którego tygodnia ciąży mogę korzystać z medytacji?',
      a: 'Materiał został pomyślany jako wsparcie od 37. tygodnia ciąży, zgodnie z opisem produktu.',
    },
    {
      q: 'Ile razy trzeba odsłuchać nagranie?',
      a: 'W opisie produktu rekomendowane jest trzykrotne wysłuchanie nagrania, w spokojnych i komfortowych warunkach.',
    },
    {
      q: 'Czy medytacja zastępuje konsultację medyczną?',
      a: 'Nie. To wspierające narzędzie do pracy z napięciem, relaksacją i nastawieniem, ale nie zastępuje opieki położnej ani lekarza prowadzącego.',
    },
  ],
};

function ensureFaqColumn() {
  const columns = new Set(db.prepare('PRAGMA table_info(products)').all().map((column) => column.name));

  if (!columns.has('faq_json')) {
    db.exec('ALTER TABLE products ADD COLUMN faq_json TEXT');
  }
}

function seedFaqs() {
  const updateFaq = db.prepare('UPDATE products SET faq_json = ?, updated_at = CURRENT_TIMESTAMP WHERE slug = ?');

  for (const [slug, items] of Object.entries(FAQ_BY_SLUG)) {
    updateFaq.run(JSON.stringify(items), slug);
  }
}

ensureFaqColumn();
seedFaqs();

db.close();

console.log('Product FAQs seeded successfully.');