# Interna arbetsuppgifter – LM pilot

Separat InternalTask-modell och adminskyddat API. Kundernas /ticket API använder endast Ticket.

## API
- GET /internal-tasks
- GET /internal-tasks/:id
- POST /internal-tasks
- PATCH /internal-tasks/:id
- DELETE /internal-tasks/:id

Alla endpoints kräver JWT och ADMIN. Alla uppgifter filtreras på companyId från JWT. Skaparen hämtas från JWT. Tilldelning begränsas till SUPPORT eller ADMIN inom samma företag. customerName är en intern textetikett, inte ett kundkonto.

## Lokalt
Kör från backend: npx prisma migrate dev, npx prisma generate, npm run build, npm test.

Migreringen är ännu inte körd mot någon databas. Granska och säkerhetskopiera före migrering i drift. Admin-MFA, rate limiting, säker onboarding och HTTPS krävs före extern pilot.
