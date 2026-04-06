// seed-course.cjs - Creates demo course with modules and lessons
const db = require('./api/db.js').default;
const crypto = require('crypto');

const requestedSlug = process.argv[2] || 'test-course';

function resolveCourseProduct() {
  const requestedProduct = db.prepare('SELECT id, slug, title FROM products WHERE slug = ?').get(requestedSlug);
  if (requestedProduct) {
    return requestedProduct;
  }

  const firstCourseProduct = db.prepare("SELECT id, slug, title FROM products WHERE type = 'course' ORDER BY created_at DESC LIMIT 1").get();
  if (firstCourseProduct) {
    return firstCourseProduct;
  }

  const fallbackProduct = db.prepare("SELECT id, slug, title FROM products ORDER BY created_at DESC LIMIT 1").get();
  if (!fallbackProduct) {
    throw new Error('Brak produktów w bazie. Najpierw uruchom seed produktów.');
  }

  return fallbackProduct;
}

const courseProduct = resolveCourseProduct();
const courseProductId = courseProduct.id;
const fallbackThumbnail = '/images/hero_doula.png';

// Update the product to have type 'course' and ensure the demo course has a visible local thumbnail.
db.prepare("UPDATE products SET type = 'course', description = ?, thumbnail_url = ? WHERE id = ?").run(
  `Kompleksowy kurs online dla przyszłych i obecnych mam, który przeprowadzi Cię przez najważniejsze etapy przygotowania do porodu i połogu.\n\nCzego się nauczysz:\n- Jak przygotować ciało i umysł do porodu\n- Jak zarządzać oddechem i bólem w czasie porodu\n- Jak stworzyć plan porodu dostosowany do siebie\n- Jak wejść w połóg świadomie i z zasobami\n- Jak zadbać o siebie i niemowlę w pierwszych tygodniach`,
  fallbackThumbnail,
  courseProductId
);

// Check if course already exists
let course = db.prepare('SELECT * FROM courses WHERE product_id = ?').get(courseProductId);

if (!course) {
  const courseId = crypto.randomUUID();
  db.prepare('INSERT INTO courses (id, product_id, title, description) VALUES (?, ?, ?, ?)').run(
    courseId,
    courseProductId,
    courseProduct.title || 'Świadome Macierzyństwo – Kurs Online',
    'Kompleksowy program przygotowania do porodu i połogu'
  );
  course = db.prepare('SELECT * FROM courses WHERE id = ?').get(courseId);
  console.log('Course created:', courseId);
}

const courseId = course.id;

// Delete existing content to recreate a clean structure.
db.prepare('DELETE FROM lesson_attachments WHERE lesson_id IN (SELECT l.id FROM lessons l JOIN modules m ON m.id = l.module_id WHERE m.course_id = ?)').run(courseId);
db.prepare('DELETE FROM lessons WHERE module_id IN (SELECT id FROM modules WHERE course_id = ?)').run(courseId);
db.prepare('DELETE FROM modules WHERE course_id = ?').run(courseId);

// MODULE 1
const mod1Id = crypto.randomUUID();
db.prepare('INSERT INTO modules (id, course_id, title, description, order_index) VALUES (?, ?, ?, ?, ?)').run(
  mod1Id, courseId, 'Moduł 1: Przygotowanie do porodu', 'Podstawy psychofizycznego przygotowania', 0
);

const lessons1 = [
  { title: 'Jak działa poród? Fizjologia i naturalne mechanizmy', type: 'video', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', desc: 'Poznaj, jak Twoje ciało naturalnie przygotowuje się do porodu i co je do tego pobudza.', duration: 18 },
  { title: 'Zarządzanie lękiem – dlaczego stres hamuje poród?', type: 'video', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', desc: 'Poznaj trójkąt lęk-napięcie-ból i dowiedz się, jak go przerwać.', duration: 22 },
  { title: 'Plan porodu – jak go napisać krok po kroku?', type: 'text', url: null, desc: 'Szczegółowy przewodnik po tworzeniu własnego planu porodu, który szpital będzie musiał uszanować.', duration: 15, text: `## Plan porodu – Twój głos w szpitalu\n\nPlan porodu to dokument, w którym wyrażasz swoje preferencje dotyczące przebiegu porodu. Nie jest wiążący prawnie, ale stanowi ważną komunikację z personelem medycznym.\n\n### Co powinien zawierać?\n\n1. **Dane podstawowe**: Twoje imię, termin porodu, lekarz prowadzący\n2. **Preferencje dotyczące bólu**: Czy chcesz EDA? Jakie inne metody uśmierzania bólu preferujesz?\n3. **Poruszanie się w czasie porodu**: Czy chcesz mieć swobodę ruchu? Czy chcesz korzystać z piłki, wanny?\n4. **Osoba towarzysząca**: Kto będzie przy Tobie? Jaką rolę ma pełnić?\n5. **Monitorowanie dziecka**: Ciągłe czy przerywane KTG?\n6. **Parcie**: Spontaniczne czy kierowane?\n7. **Po porodzie**: Kontakt skóra do skóry, opóźnione przecięcie pępowiny, karmienie piersią\n\n### Wskazówki praktyczne\n\n- Ogranicz go do 1 strony A4\n- Użyj bullet points, nie długich akapitów\n- Przynieś kilka kopii (dla siebie, osoby towarzyszącej, personelu)\n- Omów go wcześniej ze swoją położną lub lekarzem` },
];

for (const [i, l] of lessons1.entries()) {
  const lessonId = crypto.randomUUID();
  db.prepare('INSERT INTO lessons (id, module_id, title, description, lesson_type, content_url, content_text, duration_minutes, order_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
    lessonId, mod1Id, l.title, l.desc, l.type, l.url || null, l.text || null, l.duration, i
  );
  // Add attachment to lesson 3
  if (i === 2) {
    db.prepare('INSERT INTO lesson_attachments (id, lesson_id, name, url) VALUES (?, ?, ?, ?)').run(
      crypto.randomUUID(), lessonId, 'Szablon Planu Porodu (PDF)', '/downloads/plan-porodu-szablon.pdf'
    );
  }
}

// MODULE 2
const mod2Id = crypto.randomUUID();
db.prepare('INSERT INTO modules (id, course_id, title, description, order_index) VALUES (?, ?, ?, ?, ?)').run(
  mod2Id, courseId, 'Moduł 2: Techniki relaksacji i oddychania', 'Praktyczne narzędzia na czas skurczów', 1
);

const lessons2 = [
  { title: 'Oddychanie w czasie skurczów – 3 techniki', type: 'video', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', desc: 'Praktyczne ćwiczenia oddechowe, które możesz od razu wypróbować.', duration: 20 },
  { title: 'Medytacja relaksacyjna – przygotowanie do porodu', type: 'audio', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', desc: 'Prowadzona medytacja, która wyciszy Twój umysł i rozluźni ciało przed porodem.', duration: 25 },
  { title: 'Partner przy porodzie – jak może Ci pomóc?', type: 'text', url: null, desc: 'Konkretne zadania i techniki masażu dla Twojego partnera.', duration: 10, text: `## Rola partnera podczas porodu\n\nPartner przy porodzie może być Twoim największym wsparciem – jeśli wie, jak działać.\n\n### Techniki masażu w czasie skurczów\n\n**Masaż krzyża (najbardziej skuteczny!):**\nW czasie skurczu mocno uciskaj kość krzyżową okrągłymi ruchami. Zapytaj kobietę o siłę ucisku – powinna być dość intensywna.\n\n**Podwójny ucisk bioder:**\nUchwyć biodra z obu stron i ściśnij je mocno do środka podczas skurczu. Zmniejsza to rozwarcie stawu krzyżowo-biodrowego i często przynosi dużą ulgę.\n\n### Co mówić, a czego nie?\n\n✅ TAK: "Radzisz sobie świetnie", "Jesteś niesamowita", "To mija", "Jestem tu"\n❌ NIE: "Boli mocno?", "Może jednak weźmiesz znieczulenie", komentarze do personelu przez jej głowę` },
];

for (const [i, l] of lessons2.entries()) {
  const lessonId = crypto.randomUUID();
  db.prepare('INSERT INTO lessons (id, module_id, title, description, lesson_type, content_url, content_text, duration_minutes, order_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
    lessonId, mod2Id, l.title, l.desc, l.type, l.url || null, l.text || null, l.duration, i
  );
}

// MODULE 3
const mod3Id = crypto.randomUUID();
db.prepare('INSERT INTO modules (id, course_id, title, description, order_index) VALUES (?, ?, ?, ?, ?)').run(
  mod3Id, courseId, 'Moduł 3: Połóg – czas dla siebie', 'Regeneracja po porodzie', 2
);

const lessons3 = [
  { title: 'Czwarty trymestr – co się dzieje z Twoim ciałem?', type: 'video', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', desc: 'Przegląd fizycznych zmian w pierwszych 6 tygodniach po porodzie.', duration: 15 },
  { title: 'Emocje po porodzie – baby blues, depresja, euforia', type: 'video', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', desc: 'Jak odróżnić baby blues od depresji poporodowej i kiedy szukać pomocy.', duration: 18 },
  { title: 'Stwórz swój plan połogu', type: 'text', url: null, desc: 'Praktyczne ćwiczenie: zaplanuj idealne pierwsze 4 tygodnie po porodzie.', duration: 20, text: `## Twój Plan Połogu\n\nWypełnij to ćwiczenie przed porodem. Pokaż je bliskim – niech wiedzą, jak Cię wspierać.\n\n### Kto mi pomoże i w czym?\n| Osoba | Zadanie | Kiedy |\n|-------|---------|-------|\n| Partner | Noce z dzieckiem w tygodniu 2-3 | Noc |\n| Mama | Gotowanie obiadów | Pierwsze 2 tygodnie |\n| Przyjaciółka | Zakupy | Raz w tygodniu |\n\n### Moje potrzeby w połogu:\n\n1. **Jedzenie**: Co lubię? Co mnie wzmocni? Kto ugotuje?\n2. **Sen**: Kiedy ma mi zająć dziecko, żebym mogła się przespać?\n3. **Czas dla siebie**: Kiedy partner przejmie dziecko, żebym mogła wziąć prysznic/spokojnie zjeść?\n4. **Odwiedziny**: Kto może przyjeżdżać? Kiedy? Na jak długo? (Masz prawo powiedzieć NIE!)\n5. **Wsparcie emocjonalne**: Do kogo zadzwonię, gdy będę potrzebować porozmawiać?` },
];

for (const [i, l] of lessons3.entries()) {
  const lessonId = crypto.randomUUID();
  db.prepare('INSERT INTO lessons (id, module_id, title, description, lesson_type, content_url, content_text, duration_minutes, order_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
    lessonId, mod3Id, l.title, l.desc, l.type, l.url || null, l.text || null, l.duration, i
  );
  // Add attachment to last lesson
  if (i === 2) {
    db.prepare('INSERT INTO lesson_attachments (id, lesson_id, name, url) VALUES (?, ?, ?, ?)').run(
      crypto.randomUUID(), lessonId, 'Karta Pracy – Plan Połogu (PDF)', '/downloads/plan-pologu.pdf'
    );
    db.prepare('INSERT INTO lesson_attachments (id, lesson_id, name, url) VALUES (?, ?, ?, ?)').run(
      crypto.randomUUID(), lessonId, 'Checklisty – Pierwsze tygodnie (PDF)', '/downloads/checklisty-pologu.pdf'
    );
  }
}

// Update product price and description
db.prepare("UPDATE products SET price = 297 WHERE id = ?").run(courseProductId);

console.log('✅ Demo course created successfully!');
console.log(`   Product slug: ${courseProduct.slug}`);
console.log('   Course ID:', courseId);
process.exit(0);
