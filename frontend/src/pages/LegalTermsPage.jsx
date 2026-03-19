import LegalLayout from '../components/LegalLayout';

function Section({ title, children }) {
  return (
    <section className="mb-10 last:mb-0">
      <h2 className="text-2xl md:text-3xl font-serif text-mauve mb-4">{title}</h2>
      <div className="space-y-4 text-base leading-8 text-mauve/80 font-light">
        {children}
      </div>
    </section>
  );
}

export default function LegalTermsPage() {
  return (
    <LegalLayout
      title="Regulamin sklepu"
      lead="Zasady zakupu i korzystania z produktów cyfrowych dostępnych na stronie Natalii Potockiej."
    >
      <Section title="§1 Postanowienia ogólne">
        <p>Niniejszy regulamin określa zasady korzystania ze strony internetowej dostępnej pod adresem <strong>https://nataliapotocka.pl</strong>, w tym zasady zakupu i korzystania z produktów cyfrowych oferowanych za jej pośrednictwem.</p>
        <p>Sprzedawcą jest osoba fizyczna: <strong>Natalia Potocka</strong>, adres do korespondencji: <strong>[adres do uzupełnienia]</strong>, adres e-mail: <strong>kontakt@nataliapotocka.pl</strong>.</p>
        <p>Sprzedaż prowadzona jest w ramach <strong>działalności nierejestrowanej</strong> zgodnie z art. 5 ustawy Prawo przedsiębiorców.</p>
        <p>Oferta prezentowana na stronie skierowana jest wyłącznie do klientów znajdujących się na terytorium Rzeczypospolitej Polskiej.</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>zasady korzystania ze strony,</li>
          <li>zasady zawierania umów sprzedaży produktów cyfrowych,</li>
          <li>zasady korzystania z kursów i materiałów cyfrowych,</li>
          <li>zasady reklamacji.</li>
        </ul>
        <p>Złożenie zamówienia oznacza akceptację niniejszego regulaminu.</p>
      </Section>

      <Section title="§2 Definicje">
        <p><strong>Sprzedawca</strong> – osoba wskazana w §1.</p>
        <p><strong>Strona</strong> – serwis internetowy dostępny pod adresem <strong>https://nataliapotocka.pl</strong>.</p>
        <p><strong>Klient</strong> – osoba fizyczna dokonująca zakupu produktu cyfrowego.</p>
        <p><strong>Konsument</strong> – osoba fizyczna dokonująca zakupu niezwiązanego z działalnością gospodarczą.</p>
        <p><strong>Produkt cyfrowy</strong> – treść cyfrowa dostarczana w formie elektronicznej, w szczególności kurs online, webinar, e-book, nagranie audio lub video, medytacja oraz inne materiały edukacyjne.</p>
        <p><strong>Umowa</strong> – umowa zawarta na odległość pomiędzy Sprzedawcą a Klientem.</p>
      </Section>

      <Section title="§3 Wymagania techniczne">
        <p>Do korzystania ze strony wymagane jest:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>urządzenie z dostępem do Internetu,</li>
          <li>aktualna przeglądarka internetowa,</li>
          <li>aktywne konto e-mail.</li>
        </ul>
      </Section>

      <Section title="§4 Składanie zamówień">
        <ol className="list-decimal pl-6 space-y-2">
          <li>Zamówienia można składać 24 godziny na dobę.</li>
          <li>Aby dokonać zakupu Klient wybiera produkt, zakłada konto albo loguje się do istniejącego konta, akceptuje wymagane zgody i dokonuje płatności.</li>
          <li>Po złożeniu zamówienia Klient otrzymuje potwierdzenie na adres e-mail.</li>
        </ol>
      </Section>

      <Section title="§5 Płatności">
        <ol className="list-decimal pl-6 space-y-2">
          <li>Płatności realizowane są za pośrednictwem operatorów płatności elektronicznych, w tym Stripe.</li>
          <li>Realizacja zamówienia następuje po zaksięgowaniu płatności.</li>
        </ol>
      </Section>

      <Section title="§6 Dostarczenie produktu cyfrowego">
        <ol className="list-decimal pl-6 space-y-2">
          <li>Produkt cyfrowy dostarczany jest drogą elektroniczną.</li>
          <li>Dostarczenie produktu następuje poprzez link do pobrania, dostęp do platformy kursowej lub dostęp do materiałów online.</li>
          <li>Dostęp do produktu może być ograniczony czasowo lub bezterminowo, zgodnie z opisem produktu.</li>
        </ol>
      </Section>

      <Section title="§7 Prawo odstąpienia od umowy">
        <ol className="list-decimal pl-6 space-y-2">
          <li>Konsument ma prawo odstąpić od umowy w terminie 14 dni od jej zawarcia.</li>
          <li>Prawo odstąpienia nie przysługuje w przypadku treści cyfrowych niedostarczanych na nośniku materialnym, jeżeli rozpoczęto świadczenie za wyraźną zgodą Klienta oraz Klient został poinformowany o utracie prawa odstąpienia od umowy.</li>
        </ol>
      </Section>

      <Section title="§8 Reklamacje">
        <ol className="list-decimal pl-6 space-y-2">
          <li>Sprzedawca odpowiada za zgodność produktu cyfrowego z umową.</li>
          <li>Reklamacje można składać na adres: <strong>kontakt@nataliapotocka.pl</strong>.</li>
          <li>Reklamacja powinna zawierać imię i nazwisko oraz opis problemu.</li>
          <li>Reklamacja zostanie rozpatrzona w terminie do 14 dni.</li>
        </ol>
      </Section>

      <Section title="§9 Zasady korzystania z produktów cyfrowych">
        <ol className="list-decimal pl-6 space-y-2">
          <li>Produkty cyfrowe udostępniane są wyłącznie do osobistego użytku Klienta.</li>
          <li>Zabrania się udostępniania materiałów osobom trzecim, rozpowszechniania ich w Internecie, publikowania fragmentów materiałów, sprzedaży lub przekazywania dostępu do kursu oraz pobierania i udostępniania materiałów na innych platformach.</li>
          <li>Zakup jednego dostępu uprawnia do korzystania z materiałów przez jedną osobę.</li>
          <li>Zabrania się współdzielenia konta lub przekazywania danych logowania innym osobom.</li>
          <li>W przypadku naruszenia regulaminu Sprzedawca może zablokować dostęp do produktu, usunąć konto użytkownika lub dochodzić roszczeń z tytułu naruszenia praw autorskich.</li>
        </ol>
      </Section>

      <Section title="§10 Prawa autorskie">
        <ol className="list-decimal pl-6 space-y-2">
          <li>Wszystkie materiały dostępne w sklepie stanowią własność Sprzedawcy.</li>
          <li>Produkty cyfrowe chronione są prawem autorskim.</li>
          <li>Zakup produktu nie oznacza nabycia praw autorskich do materiałów.</li>
        </ol>
      </Section>

      <Section title="§11 Konsultacje">
        <ol className="list-decimal pl-6 space-y-2">
          <li>Na stronie dostępny jest formularz kontaktowy umożliwiający zgłoszenie chęci skorzystania z konsultacji lub terapii.</li>
          <li>Wysłanie formularza nie stanowi zawarcia umowy ani zakupu usługi.</li>
          <li>Warunki konsultacji ustalane są indywidualnie.</li>
        </ol>
      </Section>

      <Section title="§12 Pozasądowe rozwiązywanie sporów">
        <p>Konsument może skorzystać z pozasądowych sposobów rozwiązywania sporów poprzez rzecznika konsumentów, Inspekcję Handlową lub platformę ODR UE.</p>
      </Section>

      <Section title="§13 Postanowienia końcowe">
        <ol className="list-decimal pl-6 space-y-2">
          <li>W sprawach nieuregulowanych regulaminem zastosowanie mają przepisy prawa polskiego oraz prawa Unii Europejskiej.</li>
          <li>Regulamin obowiązuje od dnia <strong>13.03.2026</strong>.</li>
        </ol>
      </Section>
    </LegalLayout>
  );
}