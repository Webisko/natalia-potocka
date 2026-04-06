# Frontend Archive Status

## Decyzja

Katalog `frontend/` nie jest już aktywnym frontendem projektu. Zostaje jako archiwum starej wersji React/Vite.

## Co jest aktywne

- aktywny frontend: `src/`
- aktywny routing: Astro
- aktywne widoki publiczne: Astro
- aktywne widoki auth i panelu: Astro
- aktywny kod React używany przejściowo przez Astro: `src/components/panel/`

## Co jest dozwolone

- używanie React jako wysp wewnątrz projektu Astro,
- zostawienie wybranych komponentów React tam, gdzie ma to techniczny sens,
- stopniowa migracja z cięższych wysp React w `src/components/panel/` do komponentów natywnych Astro.

## Czego nie robimy

- nie rozwijamy nowych funkcji w `frontend/`,
- nie traktujemy `frontend/` jako źródła prawdy dla bieżącego UI,
- nie prowadzimy codziennej pracy produktowej w starej aplikacji React.

## Stan obecny

Najważniejsze zależności panelu, które wcześniej były importowane z `frontend/src/`, zostały już przeniesione do aktywnego drzewa `src/`, żeby aplikacja Astro nie była bezpośrednio związana z archiwalnym katalogiem React.

Widoki auth zostały już przepisane do natywnego Astro, bez React island dla logowania i resetu hasła.

Wspólne fundamenty panelu, takie jak kontekst sesji i panelowy `BlobArrowIcon`, zostały przeniesione do `src/components/panel/`, żeby nie traktować ich dalej jako części archiwalnej warstwy.

Cięższe wyspy panelu klienta i administratora wraz z ich helperami żyją teraz bezpośrednio w `src/components/panel/pages/`, `src/components/panel/admin/` i `src/components/panel/utils/`. Nie trzymamy już aktywnego kodu UI w osobnym katalogu przejściowym.

To daje bezpieczny stan pośredni: projekt jest prowadzony w Astro, ale może nadal używać wybranych wysp React tam, gdzie jest to uzasadnione.