# Natalia Potocka

To repozytorium jest prowadzone w modelu Astro-first.

## Zasada główna

- Aktywny frontend projektu jest w `src/` i działa w Astro.
- Wszystkie nowe prace nad UI, layoutami, stronami publicznymi, widokami po zalogowaniu i panelem administratora wykonujemy w architekturze Astro.
- React może pozostać miejscowo jako wyspa tam, gdzie ma to sens techniczny i przyspiesza migrację albo obsługuje złożoną interakcję.
- Stary katalog `frontend/` nie jest już aktywną aplikacją do codziennej pracy. Traktujemy go jako archiwum referencyjne starej wersji React/Vite.

## Dopuszczalne użycie React

- Wyspy React są dozwolone wewnątrz aplikacji Astro.
- Jeśli jakiś stary komponent React nadal jest potrzebny, jego aktywna wersja powinna żyć w aktywnym drzewie `src/`, najlepiej pod `src/components/panel/`, albo zostać przepisana do komponentów Astro.
- Nie rozwijamy nowych funkcji bezpośrednio w `frontend/`.

## Gdzie pracować

- Publiczne strony: `src/pages/`, `src/components/`, `src/layouts/`, `src/lib/`
- Panel i auth: `src/pages/`, `src/components/panel/`
- Cięższe wyspy React dla dashboardów klienta i administratora: `src/components/panel/pages/`, `src/components/panel/admin/`, `src/components/panel/utils/`

## Backend i produkcja

- Produkcyjny backend projektu jest PHP-first i żyje w `php_api/`.
- Krytyczna logika biznesowa dla hostingu współdzielonego powinna być utrzymywana po stronie PHP: auth, checkout, webhooki Stripe, nadawanie dostępu, logika panelu i administracji.
- `api/` oraz `app.js` są lokalnym zapleczem Node do developmentu i testów integracyjnych, ale nie są docelowym modelem backendu dla produkcji.
- Przy zmianach wpływających na płatności, dostęp do produktów, logowanie i administrację źródłem prawdy powinno być `php_api/`.
- Publiczny katalog produktów obejmuje tylko opublikowane produkty cyfrowe. Obecnie są to 3 webinary i 1 medytacja; kurs pozostaje testowy i niepubliczny.
- Dwie usługi działają jako osobne landing pages w Astro i nie są produktami kupowanymi online. Wejście w usługę prowadzi do kontaktu, nie do checkoutu.

## Komendy

- `npm run dev:backend` uruchamia backend na `4321`
- `npm run dev:astro` uruchamia aktywny frontend Astro na `3000`
- `npm run build` buduje aktywną aplikację Astro
- `npm run preview` uruchamia podgląd buildu Astro

## Kierunek dalszych prac

Docelowo projekt ma być rozwijany jako jedna aplikacja Astro dla całej warstwy wizualnej. Auth jest już Astro-native, a pozostałe cięższe widoki panelowe działają jako kontrolowane wyspy React wewnątrz `src/components/panel/`, z dalszym kierunkiem upraszczania ich w stronę Astro tam, gdzie będzie to opłacalne. Produkcyjna logika backendowa pozostaje po stronie PHP.
