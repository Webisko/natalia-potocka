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

export default function LegalPrivacyPage() {
  return (
    <LegalLayout
      title="Polityka prywatności"
      lead="Informacje o przetwarzaniu danych osobowych i technicznych zasadach działania strony internetowej."
    >
      <Section title="§1 Administrator danych">
        <p>Administratorem danych osobowych jest <strong>Natalia Potocka</strong>, adres do korespondencji: <strong>[adres do uzupełnienia]</strong>, adres e-mail: <strong>kontakt@nataliapotocka.pl</strong>.</p>
        <p>Sprzedaż prowadzona jest w ramach działalności nierejestrowanej.</p>
      </Section>

      <Section title="§2 Zakres zbieranych danych">
        <p>W zależności od sposobu korzystania ze strony mogą być przetwarzane następujące dane:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>imię i nazwisko,</li>
          <li>adres e-mail,</li>
          <li>dane przekazane w formularzu kontaktowym,</li>
          <li>dane niezbędne do realizacji płatności,</li>
          <li>adres IP oraz podstawowe dane techniczne przeglądarki.</li>
        </ul>
        <p>Podanie danych jest dobrowolne, ale może być konieczne do skorzystania z niektórych funkcji strony, na przykład dokonania zakupu.</p>
      </Section>

      <Section title="§3 Cele przetwarzania danych">
        <p>Dane osobowe przetwarzane są w celu:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>realizacji zamówienia produktów cyfrowych,</li>
          <li>obsługi zapytań wysyłanych przez formularz kontaktowy,</li>
          <li>obsługi reklamacji,</li>
          <li>realizacji obowiązków prawnych, na przykład podatkowych,</li>
          <li>zapewnienia prawidłowego działania strony internetowej.</li>
        </ul>
      </Section>

      <Section title="§4 Podstawa prawna przetwarzania danych">
        <ul className="list-disc pl-6 space-y-2">
          <li>art. 6 ust. 1 lit. b RODO – realizacja umowy lub działania przed jej zawarciem,</li>
          <li>art. 6 ust. 1 lit. c RODO – obowiązki wynikające z przepisów prawa,</li>
          <li>art. 6 ust. 1 lit. f RODO – uzasadniony interes administratora, na przykład obsługa zapytań i ochrona przed nadużyciami.</li>
        </ul>
      </Section>

      <Section title="§5 Odbiorcy danych">
        <p>Dane mogą być przekazywane podmiotom współpracującym z administratorem wyłącznie w zakresie niezbędnym do realizacji usług, w szczególności operatorom płatności elektronicznych, dostawcy hostingu strony internetowej oraz dostawcom usług technicznych wspierających działanie strony.</p>
        <p>Podmioty te przetwarzają dane na podstawie odpowiednich umów powierzenia danych.</p>
      </Section>

      <Section title="§6 Okres przechowywania danych">
        <ul className="list-disc pl-6 space-y-2">
          <li>przez okres niezbędny do realizacji umowy,</li>
          <li>przez okres wymagany przepisami prawa,</li>
          <li>przez okres niezbędny do dochodzenia lub obrony roszczeń.</li>
        </ul>
      </Section>

      <Section title="§7 Prawa osoby, której dane dotyczą">
        <p>Każda osoba, której dane dotyczą, ma prawo do:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>dostępu do danych,</li>
          <li>sprostowania danych,</li>
          <li>usunięcia danych,</li>
          <li>ograniczenia przetwarzania,</li>
          <li>sprzeciwu wobec przetwarzania,</li>
          <li>przenoszenia danych,</li>
          <li>złożenia skargi do Prezesa Urzędu Ochrony Danych Osobowych.</li>
        </ul>
      </Section>

      <Section title="§8 Pliki cookies">
        <p>Strona internetowa nie wykorzystuje plików cookies w celach marketingowych ani analitycznych.</p>
        <p>W niektórych przypadkach mogą być stosowane wyłącznie technicznie niezbędne pliki cookies, które umożliwiają prawidłowe działanie strony internetowej lub realizację funkcji takich jak obsługa sesji użytkownika lub procesu zamówienia.</p>
        <p>Pliki te nie służą do śledzenia użytkowników ani do profilowania. Zgodnie z obowiązującymi przepisami ich stosowanie nie wymaga uzyskania zgody użytkownika.</p>
      </Section>

      <Section title="§9 Zmiany polityki prywatności">
        <p>Administrator zastrzega sobie prawo do wprowadzania zmian w niniejszej polityce prywatności poprzez publikację nowej wersji na stronie internetowej.</p>
      </Section>

      <Section title="§10 Kontakt">
        <p>W sprawach związanych z przetwarzaniem danych osobowych można skontaktować się z administratorem pod adresem <strong>kontakt@nataliapotocka.pl</strong>.</p>
      </Section>
    </LegalLayout>
  );
}