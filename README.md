# SupportApp 2.0

SupportApp är en supportapplikation för mobil och webb med backend och en kommande adminportal. Projektet utvecklas först för internt bruk men backend är strukturerad för att kunna hantera flera kundföretag.

## Projektstruktur

- `backend/` – NestJS API, autentisering, Prisma och PostgreSQL
- `admin/` – planerad adminportal
- `mobile/` – planerad mobilapp

## Backend – nuvarande status

Backend innehåller moduler för:

- autentisering och JWT
- företag
- användare
- supportärenden
- meddelanden i ärenden
- rollbaserad behörighet
- företagsisolering (tenant isolation)

### Teknik

- Node.js / NestJS
- PostgreSQL
- Prisma ORM
- Passport + JWT
- bcrypt för lösenordshashning
- class-validator / class-transformer

## Roller och behörighet

Tre roller används:

- `USER` – vanlig slutanvändare
- `SUPPORT` – supportpersonal
- `ADMIN` – administratör inom sitt företag

JWT innehåller användarens id, roll och `companyId`. Skyddade resurser kontrolleras mot den autentiserade användaren i stället för att lita på id:n som skickas från klienten.

Nuvarande tenantmodell innebär att SUPPORT och ADMIN är företagsbundna. De får alltså inte läsa eller ändra data från andra företag. USER får dessutom endast komma åt sina egna ärenden och sin egen profil där det är relevant.

## Säkerhet

Backend har bland annat följande skydd:

- lösenord lagras hashade med bcrypt
- lösenord returneras inte från användar-API:t
- JWT krävs på skyddade endpoints
- rollkontroll med `USER`, `SUPPORT` och `ADMIN`
- ticket-ägare och företag hämtas från JWT vid skapande
- message-avsändare hämtas från JWT
- tickets, messages, users och company-data är avgränsade per företag
- tickets kan inte tilldelas användare från andra företag
- JWT-secret ligger inte i källkoden
- global DTO-validering använder whitelist och transform

## Miljövariabler

Kopiera `backend/.env.example` till `backend/.env` och fyll i riktiga värden. `.env` ignoreras av Git.

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/supportapp"
JWT_SECRET="replace-with-a-long-random-secret"
JWT_EXPIRES_IN="1h"
PORT=3000
```

Använd ett långt, slumpmässigt värde för `JWT_SECRET` och committa aldrig den riktiga hemligheten.

## Starta backend lokalt

Från `backend/`:

```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run start:dev
```

API:t använder port 3000 som standard.

## Viktiga API-routes

### Auth

- `POST /auth/register`
- `POST /auth/login`

Login returnerar en JWT som skickas på skyddade requests:

```text
Authorization: Bearer <accessToken>
```

### Users

- `POST /user` – ADMIN
- `GET /user` – SUPPORT/ADMIN, endast eget företag
- `GET /user/:id` – USER endast sig själv, SUPPORT/ADMIN inom eget företag
- `PATCH /user/:id` – ADMIN inom eget företag
- `DELETE /user/:id` – ADMIN inom eget företag

### Tickets

- `POST /ticket` – autentiserad användare; ägare och företag tas från JWT
- `GET /ticket` – SUPPORT/ADMIN, endast eget företag
- `GET /ticket/:id` – USER endast eget ärende; SUPPORT/ADMIN inom eget företag
- `PATCH /ticket/:id` – SUPPORT/ADMIN inom eget företag
- `DELETE /ticket/:id` – ADMIN inom eget företag

### Messages

- `POST /message` – autentiserad användare; avsändare tas från JWT
- `GET /message` – SUPPORT/ADMIN, endast eget företag
- `GET /message/ticket/:ticketId` – åtkomst kontrolleras mot ticket
- `DELETE /message/:id` – ADMIN inom eget företag

### Company

- `GET /company` – eget företag
- `GET /company/:id` – endast eget företag
- `PATCH /company/:id` – ADMIN, endast eget företag
- `DELETE /company/:id` – ADMIN, endast eget företag

## Datamodell

De centrala modellerna är `Company`, `User`, `Ticket` och `Message`.

En User tillhör ett Company. Ett Ticket tillhör både skapande User och Company och kan tilldelas supportpersonal. Ett Message tillhör ett Ticket och en User.

## Kvar inför produktion

Backendens kärna och grundläggande säkerhetsmodell är implementerad, men några produktionsfunktioner är medvetet kvar som nästa etapp: e-postverifiering, lösenordsåterställning, MFA för admin, rate limiting/brute-force-skydd och ett säkert onboarding-/inbjudningsflöde för nya företag. Nuvarande `POST /auth/register` kräver ett existerande `companyId` och bör därför inte exponeras som fri publik registrering innan onboardingflödet är implementerat.
