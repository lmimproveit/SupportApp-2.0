# Utvecklingslogg och driftsstatus – SupportApp 2.0

**Senast uppdaterad:** 2026-10-20  
**Aktiv driftsgren:** `internal-tasks`  
**Pågående säkerhetsarbete:** `security-session-review` ([utkast PR #3](https://github.com/lmimproveit/SupportApp-2.0/pull/3))

Det här dokumentet skiljer på **driftsatt och verifierat**, **kod som är förberedd men inte driftsatt** och **återstående arbete**. Det är en arbetslogg, inte ett intyg om att systemet är produktionssäkert.

## 1. Syfte och mål

SupportApp 2.0 utvecklas för LM Improve IT. Första steget är en intern webbportal för att hantera arbetsärenden. Långsiktigt planeras även kundernas supportärenden och en mobilapp. Kunddata ska avgränsas per företag.

## 2. Arkitektur

| Del | Teknik / tjänst | Status |
| --- | --- | --- |
| Webbfrontend | React, TypeScript, Vite | Driftsatt på Vercel |
| Backend/API | Node.js, NestJS | Driftsatt på Render |
| Databas | PostgreSQL på Supabase | Ansluten och verifierad genom ärendetest |
| Databasåtkomst | Prisma 7, `@prisma/adapter-pg` och `pg` | Implementerat |
| Inloggning | bcrypt, JWT, Passport | Implementerat |
| Behörigheter | `USER`, `SUPPORT`, `ADMIN` och `companyId` | Implementerat, ytterligare säkerhetsgranskning pågår |
| Interna arbetsärenden | `InternalTask` | Driftsatt |
| Kundportal | Frontend innehåller fortfarande demoinnehåll | Inte färdig för kundbruk |
| Mobilapp och separat adminportal | Planerade delar | Inte driftsatta |

**Driftad frontend:** https://support-app-2-0.vercel.app  
**Driftat API:** https://supportapp-2-0-backend.onrender.com

Vercel och Render använder för närvarande `internal-tasks` som produktionsgren. **Slå inte ihop `master` av misstag**; den grenen är inte aktuell driftkälla.

## 3. Vad som har genomförts

### Backend och databas

- Skapat NestJS-backend och PostgreSQL/Prisma-modeller för företag, användare, supportärenden och meddelanden.
- Implementerat autentisering med lösenordshashning (bcrypt) och JWT.
- Infört rollkontroller och företagsavgränsning i API:et.
- Lagt till interna arbetsärenden med skapa, lista, visa, uppdatera och ta bort via `/internal-tasks`.
- Konfigurerat Supabase, Render och Vercel för en fungerande intern pilot.
- Stängt publik registrering som standard: `/auth/register` är blockerad om inte `ENABLE_PUBLIC_REGISTRATION=true` uttryckligen sätts.

### Verifierat manuellt i driftsatt pilot

- Administratör kan logga in.
- Ett internt arbetsärende kan skapas.
- Ärendets status kan ändras från **Öppen** till **Pågår**.
- Översiktens statusräknare uppdateras.
- Efter omladdning (F5) försvinner inloggningen, men ärendet finns kvar efter ny inloggning. Det visar att ärendet sparats i databasen.

Dessa manuella kontroller bekräftar grundfunktionerna men är **inte** en fullständig säkerhets- eller behörighetstestning.

## 4. Säkerhetsarbete 2026-10-20 – förberett, ej publicerat

På grenen `security-session-review` i [PR #3](https://github.com/lmimproveit/SupportApp-2.0/pull/3):

- JWT-strategin har ändrats för att hämta aktuell användare, roll och `companyId` från databasen vid skyddade anrop, i stället för att lita på roll och företag som kan ha ändrats efter inloggning.
- Token för borttagen användare avvisas.
- Tre nya enhetstester har lagts till: ändrad roll/företag, borttagen användare och ogiltigt användar-ID.
- GitHub Actions **Backend CI** har körts. Första körningen misslyckades eftersom Jest inte kunde tolka ESM-modulen `@nestjs/passport`; testets mockning rättades.
- **Senaste CI-körningen för commit `bea00f17` lyckades**, inklusive backend-build och tester.

**Viktigt:** Ändringarna ligger fortfarande i en separat PR och är **inte** publicerade till produktionsappen. Godkänd CI innebär inte att driftsmiljön eller alla åtkomstscenarier är säkerhetsverifierade.

## 5. Kända problem och återstående säkerhetsarbete

### A. TLS mellan Render och Supabase – hög prioritet

Vid tidigare felsökning gav Prisma/`pg` felet `self-signed certificate in certificate chain` när anslutningssträngen innehöll `?sslmode=require`. Efter att parametern togs bort (och ett separat fel med dubbelt databasnamn korrigerades) fungerade inloggningen.

**Det är inte verifierat att databasanslutningen nu använder TLS med korrekt certifikatvalidering.** Detta måste undersökas innan riktiga kunduppgifter används. Lösningen får inte vara `rejectUnauthorized: false` eller `NODE_TLS_REJECT_UNAUTHORIZED=0` i produktion. Kontrollera leverantörernas aktuella rekommendationer och verifiera faktisk kryptering/certifikatkontroll.

### B. Inloggning försvinner vid F5

Frontend lagrar för närvarande JWT endast i React-minnet. Omladdning tömmer sessionen. Planera säker sessionshantering, exempelvis HttpOnly-cookie och kontrollerad förnyelse av session, med hänsyn till Vercel/Render på olika domäner, cookie-inställningar, CORS och CSRF. **Ingen lösning är implementerad ännu.**

### C. Behörigheter och driftsättning

- Testa uttryckligen att `USER` och `SUPPORT` inte kan använda administratörens interna arbetsärenden om de inte ska ha tillgång.
- Testa att användare från företag A inte kan läsa/ändra företag B:s uppgifter.
- Granska API-endpoints, DTO-validering, säkerhetsloggning och inloggningsbegränsning.
- Utred sårbarheter i beroenden. En CI-installation rapporterade 14 npm-audit-fynd (3 måttliga, 9 höga, 2 kritiska); **det är ännu inte fastställt vilka som berör produktionskod**.
- Inför senare MFA för administratörer, lösenordsåterställning, e-postverifiering och kontrollerad onboarding.
- Kontrollera säkerhetsinställningar i Supabase, inklusive RLS och exponering av databasnycklar. Att API:et filtrerar på `companyId` ersätter inte en genomgång av databasåtkomst.

## 6. Nästa arbetsordning

1. Verifiera och vid behov korrigera TLS med korrekt certifikatkontroll för Render → Supabase.
2. Testa behörigheter och företagsisolering samt granska npm-audit-fynd.
3. Färdigställ och verifiera säker sessionshantering så att omladdning inte kräver ny inloggning.
4. Kör tester och granska PR innan sammanslagning till `internal-tasks` och eventuell driftsättning.
5. Bygg vidare på kundportal och användarhantering först när grundsäkerheten är tillräckligt verifierad.

## 7. Säker hantering av inställningar

Miljövariabler hanteras i respektive tjänst. Lägg **aldrig** databaslösenord, fullständig `DATABASE_URL`, `JWT_SECRET`, API-nycklar eller riktiga användarlösenord i GitHub, ärenden, dokumentation eller skärmbilder.

## 8. Länkar

- [Pågående säkerhetsändringar (PR #3)](https://github.com/lmimproveit/SupportApp-2.0/pull/3)
- [GitHub Actions](https://github.com/lmimproveit/SupportApp-2.0/actions)
- [Frontend (Vercel)](https://support-app-2-0.vercel.app)
- [Backend (Render)](https://supportapp-2-0-backend.onrender.com)
