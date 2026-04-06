# Model projektu: Astro jako warstwa wizualna + PHP jako backend produkcyjny

Ten plik zapisuje aktualny kierunek architektury projektu i porządkuje podział odpowiedzialności między Astro, React islands i PHP.

## Założenie architektoniczne

- Astro odpowiada za frontend, routing stron publicznych, SEO i generowanie statycznych plików.
- Astro odpowiada także za widoki auth, panel klienta i panel administratora, z możliwością użycia selektywnych React islands tam, gdzie to nadal ma sens.
- PHP odpowiada za API, logikę biznesową, autoryzację, checkout, webhooki Stripe, dostęp do kursów i panel klienta po stronie serwerowej.
- Stripe pozostaje wyłącznie operatorem płatności, a nie źródłem danych o produktach.
- Produkty, ceny, promocje, dostęp i treści są zarządzane po stronie naszej bazy danych oraz panelu admina.
- Produktami w modelu sprzedażowym są tylko pozycje cyfrowe kupowane online: obecnie 3 webinary, 1 medytacja oraz 1 kurs testowy trzymany niepublicznie do prac nad UX.
- Usługi są osobnymi landing pages w Astro i nie należą do katalogu produktów ani checkoutu. Rezerwacja usługi odbywa się przez formularz kontaktowy, nie przez zakup.
- Stary katalog `frontend/` jest tylko archiwum referencyjnym i nie jest aktywną aplikacją do rozwoju.

## Co to oznacza praktycznie

- Node.js jest potrzebny lokalnie do pracy z Astro oraz do budowania wersji produkcyjnej frontendu.
- Node.js nie musi działać na hostingu produkcyjnym, jeśli Astro budujemy do statycznych plików.
- Hosting produkcyjny może dalej obsługiwać PHP oraz wygenerowane pliki statyczne frontendu.
- Frontend i backend są rozdzielone odpowiedzialnościami, ale mogą działać pod jedną domeną.
- React pozostaje tylko jako technika wysp wewnątrz aplikacji Astro, a nie jako osobna aktywna aplikacja.

## Aktualny sensowny model katalogów

```text
/
├── src/
├── public/
├── dist/
├── php_api/
├── api/
├── frontend/
├── data/
└── deploy_prod/
```

- `src/` to aktywny frontend Astro.
- Cięższe aktywne wyspy React dla panelu klienta i administratora żyją teraz wewnątrz `src/components/panel/`.
- `php_api/` to docelowy backend produkcyjny dla hostingu współdzielonego.
- `api/` to lokalne lub pomocnicze zaplecze Node.
- `frontend/` to archiwum starej aplikacji React/Vite.

W praktyce możemy zrobić to na dwa sposoby:

1. Astro buduje pliki bezpośrednio do katalogu `public/`.
2. Astro buduje do `dist/`, a wdrożenie kopiuje wynik do `public/` lub `deploy_prod/`.

Druga opcja jest zwykle czytelniejsza i bezpieczniejsza.

## Role warstw

### Astro frontend

- strony publiczne,
- landing pages,
- oferta i strony produktowe,
- landing pages usług kontaktowych,
- regulamin, polityka prywatności, SEO,
- logowanie i reset hasła,
- komponenty UI,
- formularze wysyłające żądania do `/api/...`.

Astro może używać:

- czystych komponentów `.astro`,
- wysp interaktywnych React tylko tam, gdzie naprawdę są potrzebne,
- statycznego generowania dla większości treści.

### PHP backend

- logowanie i rejestracja,
- panel klienta,
- panel admina,
- checkout,
- zapisywanie zgód,
- webhook Stripe,
- nadawanie dostępu po płatności,
- logika przelewów tradycyjnych,
- dostęp do SQLite i później ewentualnie do innej bazy.

## Docelowy przepływ zakupu

1. Użytkownik otwiera statyczną stronę produktu zbudowaną w Astro.
2. Frontend pobiera dane produktu z naszego API lub dostaje je w czasie builda.
3. Użytkownik wybiera metodę płatności.
4. Frontend wywołuje `POST /api/checkout/create-session`.
5. PHP tworzy sesję Stripe na podstawie danych produktu z naszej bazy.
6. Po płatności Stripe wysyła webhook do PHP.
7. PHP nadaje dostęp, zapisuje zamówienie i finalizuje logikę biznesową.
8. Panel klienta korzysta z tego samego PHP API.

Usługi nie wchodzą w ten przepływ. Dla nich Astro renderuje osobny landing page i kieruje użytkowniczkę do formularza kontaktowego.

## Dlaczego ten model jest sensowny

- SEO i wydajność strony publicznej są lepsze niż przy ciężkim SPA.
- Hosting współdzielony z PHP nadal wystarcza.
- Nie uzależniamy katalogu produktów od Stripe.
- Nie trzeba utrzymywać Node.js jako procesu backendowego na produkcji.
- Astro dobrze nadaje się do stron sprzedażowych, contentowych i ofertowych.
- PHP zostaje tam, gdzie ma realną wartość: logika biznesowa i integracje.

## Czego nie robić po migracji

- Nie przenosić logiki zakupu, dostępu i zgód do frontendu.
- Nie robić z Astro drugiego backendu, jeśli hosting docelowo ma zostać PHP-only.
- Nie duplikować danych produktowych w Stripe jako głównego źródła prawdy.
- Nie opierać nadawania dostępu tylko na powrocie użytkownika na stronę sukcesu.

## Webhook Stripe w tym modelu

Docelowy endpoint:

- `/api/webhook/stripe`

Minimalny sensowny zestaw eventów:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`

Zasada działania:

- jeśli `checkout.session.completed` ma `payment_status = paid`, można od razu nadać dostęp,
- jeśli płatność jest asynchroniczna i nie jest jeszcze opłacona, webhook nie powinien jeszcze nadawać dostępu,
- wtedy czekamy na `checkout.session.async_payment_succeeded`,
- przy `checkout.session.async_payment_failed` warto zapisać log lub oznaczyć problem z płatnością.

To jest ważne szczególnie przy metodach takich jak `Przelewy24` i części scenariuszy płatności opóźnionych.

## Co zostawiamy na później przy właściwej migracji do Astro

- rozdzielenie pozostałych cięższych widoków dashboardowych React na strony Astro + wyspy interaktywne,
- określenie, które dane są pobierane build-time, a które runtime,
- uporządkowanie katalogów i pipeline wdrożenia,
- usunięcie zbędnego lokalnego backendu Node, jeśli przestanie być potrzebny,
- ewentualne przeniesienie wybranych widoków panelu lub checkout UI do nowej struktury.

## Wniosek roboczy

Na Twoim komputerze lokalnym Node.js jest potrzebny i to jest w pełni normalne.
W docelowym modelu produkcyjnym nie potrzebujemy uruchomionego Node.js na serwerze, jeśli Astro będzie budowane wcześniej do statycznych plików, a PHP pozostanie backendem i API.