# Checklista wdrożeniowa i smoke test produkcji

Ten plik jest przygotowany do użycia w dniu produkcyjnego sprawdzenia po wdrożeniu. Kolejność jest celowo praktyczna: najpierw konfiguracja i bezpieczeństwo, potem checkout, webhooki, maile i panel.

## 1. Przed wdrożeniem

- potwierdź, że produkcyjna baza danych ma aktualne wartości `stripe_pub`, `stripe_secret`, `stripe_webhook_secret`, `notify_email`, `bank_account_name`, `bank_account_number`, `bank_name`, `bank_transfer_instructions`
- potwierdź, że endpoint webhooka Stripe wskazuje na produkcyjny adres `/api/webhook/stripe`
- potwierdź, że w Stripe włączone są właściwe metody płatności dla rynku PL: karta, BLIK, Przelewy24
- potwierdź, że na serwer trafia aktualny snapshot frontendu i PHP API
- potwierdź, że wgrane zostały usunięcia legacy coupon flow i nie ma starego `admin_coupons.php` w paczce wdrożeniowej
- potwierdź backup bazy SQLite lub inny punkt przywrócenia przed deployem

## 2. Smoke test publiczny po wdrożeniu

- otwórz stronę główną i sprawdź, czy ładuje się bez błędów layoutu i bez pustych sekcji
- otwórz minimum jeden landing usługowy i jeden produkt cyfrowy
- sprawdź, czy `/regulamin-sklepu` i `/polityka-prywatnosci` działają poprawnie
- sprawdź, czy `/logowanie`, `/zapomnialam-hasla` i `/resetowanie-hasla` renderują się poprawnie

## 3. Auth i maile konta

- zarejestruj nowe konto testowe z produkcyjnym adresem e-mail testowym
- potwierdź, że przychodzi mail potwierdzający adres e-mail
- kliknij link potwierdzenia i sprawdź, że konto aktywuje się poprawnie
- uruchom `zapomnialam hasla` dla konta testowego
- potwierdź, że przychodzi mail resetu hasła
- ustaw nowe hasło i zaloguj się na konto testowe

## 4. Checkout Stripe

- na produkcie cyfrowym uruchom zakup jako nowa użytkowniczka albo na świeżym adresie e-mail testowym
- sprawdź, że checkout modal przyjmuje dane i otwiera Stripe Checkout
- zakończ płatność powodzeniem
- potwierdź, że użytkowniczka wraca na stronę sukcesu lub panel
- potwierdź w bazie lub panelu admina, że powstało zamówienie `completed`
- potwierdź, że produkt pojawił się w bibliotece klientki
- potwierdź, że przyszły maile: sukces dla klientki i powiadomienie administracyjne

## 5. Webhook Stripe

- sprawdź w panelu Stripe, że event `checkout.session.completed` lub `checkout.session.async_payment_succeeded` zakończył się statusem sukcesu
- jeśli płatność była asynchroniczna, potwierdź, że dopiero event success nadał dostęp
- sprawdź log webhooka lub zapis zamówienia, jeśli środowisko to udostępnia
- potwierdź brak duplikacji zamówień dla tej samej sesji Stripe

## 6. Przelew tradycyjny

- uruchom checkout produktu cyfrowego z metodą `Przelew tradycyjny`
- potwierdź, że UI pokazuje pełne dane przelewu: kwota, odbiorca, bank, numer konta, tytuł przelewu, dodatkowe instrukcje
- potwierdź, że w bazie lub panelu powstaje zamówienie `pending_bank_transfer`
- potwierdź, że przyszły maile: instrukcja dla klientki i powiadomienie dla administracji

## 7. Kupony

- otwórz zakładkę `Kupony` w panelu administratora
- utwórz testowy kupon lokalny albo użyj istniejącego testowego kodu
- sprawdź, że kupon nalicza się poprawnie w checkoutcie
- sprawdź, że `times_used` zwiększa się po skutecznym użyciu
- potwierdź, że kupon działa z lokalnej bazy danych, a nie z obiektów Stripe promotion codes

## 8. Panel administratora

- otwórz `Kupony`, `Ustawienia`, `Produkty`, `Zamówienia`, `Użytkownicy`
- sprawdź, że listy renderują się poprawnie i nie ma błędów JS po wejściu do zakładek
- sprawdź, że zapis ustawień Stripe i przelewów tradycyjnych działa bez błędu

## 9. Rzeczy do obserwacji podczas manuala

- przy checkout modal warto zwrócić uwagę, czy przycisk submit nie jest przykrywany przez inną warstwę layoutu
- jeśli maile nie dochodzą, sprawdź najpierw `notify_email`, konfigurację hostingu i możliwość użycia `mail()` po stronie PHP
- jeśli checkout tworzy sesję, ale nie nadaje dostępu, sprawdź najpierw webhook secret i status eventów w Stripe

## 10. Kryterium zakończenia smoke testu

Smoke test można uznać za zamknięty dopiero wtedy, gdy jednocześnie są spełnione wszystkie warunki:

- rejestracja i reset hasła działają z realnym mailem
- płatność Stripe kończy się sukcesem i nadaje dostęp
- przelew tradycyjny zapisuje zamówienie oczekujące i wysyła instrukcje
- panel admina działa w kluczowych zakładkach
- kupony działają z lokalnej bazy danych
- webhook Stripe działa na produkcyjnym adresie i nie tworzy duplikatów zamówień