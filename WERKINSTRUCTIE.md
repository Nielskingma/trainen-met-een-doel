# Trainen-met-een-doel — WERKINSTRUCTIE

## Doel
PWA (Progressive Web App) voor hardlopers om trainingsschema's te volgen op basis van doelen, hartslag en prestaties.

## Huidige staat
In actieve ontwikkeling, beta-fase. Zie memory-bestand voor gedetailleerde architectuur en open punten:
~/.claude/projects/-Users-nielskingma/memory/project_trainen_met_een_doel.md

## Architectuur
Volledig client-side PWA — geen server, alles in de browser.
HTML + CSS + JavaScript, opgeslagen in ~/Trainen-met-een-doel/

## Bestanden
| Bestand | Rol |
|---------|-----|
| index.html | Startscherm — keuze tussen "Maak jouw schema" en "Kant-en-klare schema's" |
| onboarding.html | Intakeformulier + schema-generatoren (genRunning/genCycling/genSwimming/genWalking/genStrength/genRecovery/genCombo) |
| mijn-schema.html | Gegenereerd persoonlijk schema: voortgang, adaptief schema, prestatieverwachting, GPS-tracker (start training vanaf een hardloop/fiets/wandel-sessie), Bluetooth-hartslag |
| schema.html | Vier vaste kant-en-klare schema's (5km/10km/HM/jongere) met eigen GPS-tracker — losse, standalone lane |
| design.css | Stijlen |

(19 aug 2026: `generator.html` verwijderd — was dode code, de allereerste versie van de app, nergens meer aan gelinkt.)

## Kernmodel van schema-generatie (19 aug 2026 — belangrijk bij verder werken)
1. **Intaketest = altijd sessie 1** — maar alleen wanneer hardlopen de hoofdsport is (sport met de meeste sessies/week; de enige sport met een GPS-testprotocol in de app). Bij hardlopen als hoofdsport vervangt `generateSchema()` automatisch de eerste sessie door een 12-minuten-Cooper-test, getrackt via de gewone "Start met GPS"-knop in mijn-schema.html.
2. **Echte uitslag herberekent het schema** — zodra die intakesessie is afgerond, wordt het gemeten resultaat (i.p.v. de zelf-ingeschatte afstand) in `profile.intaketest.hl` gezet en het schema opnieuw gegenereerd.
3. **Rollend 2-wekenvenster** — het schema wordt nog wel volledig doorgerekend (deterministisch), maar alleen de eerstkomende 2 weken (`plannedThroughWeek`) krijgen zichtbare sessie-inhoud. Latere weken tonen een ingeklapte kaart (weeknummer + ruwe richting) tot mijn-schema.html ze automatisch bijvult via `ensureConcreteWeeks()` — hetzelfde regenerate-mechanisme dat ook curve-aanpassingen gebruikt.
4. **Voortgang blijft behouden bij herberekenen** — `reconcileProgressAfterRegen()` in mijn-schema.html vergelijkt bij elke herberekening (curve-aanpassing, sessies/week wijzigen, intake-resultaat, horizon bijvullen) het vorige en nieuwe schema per week; alleen weken waar de sessie-indeling écht verandert verliezen hun afvinkjes/RPE/GPS-resultaten.
5. **GPS-tracker** (mijn-schema.html): sessies met `sport` = hardlopen/fietsen/wandelen krijgen een "Start met GPS"-knop → idle-scherm met sessienaam → expliciete start → live afstand/tijd/tempo. Sessies met een warming-up in de omschrijving (of gewoon elke lichte/lange sessie, vast op minimaal 5 min) krijgen een aparte, getrackte warming-up-lap vóór de hoofdtraining. Optioneel: Bluetooth-hartslagsensor koppelen (borstband of horloge-broadcast-app) — **alleen Chrome-achtige browsers (Web Bluetooth), niet Safari/iOS**.
6. **Beperking**: dit alles (intake-als-sessie-1, rollend venster) geldt vooralsnog alleen als hardlopen de hoofdsport is. Fietsen/zwemmen/wandelen/kracht-schema's blijven het oude gedrag: volledig gegenereerd, geen verplichte intake.

## Architectuur-opschoning (uitgevoerd 19 aug 2026)
De 7 sport-generators hadden elk hun eigen, licht verschillende kopie van de volume-opbouw-logica
(herstelweek-ritme, taper, groei-percentages). Nu samengevoegd tot één gedeelde
`buildVolumeCurve(startVol, totalWeeks, curve, opts)` — teruggebracht uit de aanpak van de
allereerste versie (`generator.html`), parameterbaar per aanroeper (`increaseRate`, `hasTaper`,
`taperFinal`/`taperOther`, `recoveryDrop`) zodat de bestaande, bewust net-iets-verschillende
getallen per sport exact behouden blijven. Gebruikt door `genRunning`/`genCycling`/`genSwimming`/
`genWalking` en (drie keer parallel, voor hardlopen/fietsen/zwemmen tegelijk) door `genCombo`.
Daarnaast een gedeelde `bikeSession()` (was dubbel: los in `genCycling` + inline in `genCombo`)
en `walkSession()` (voor standalone wandelen). **Let op**: `genCombo`'s eigen fiets-sessietekst
bleek bij nader inzien al langer inhoudelijk net anders dan `genCycling`'s tekst (geen
blessure-aanpassingen, andere formulering) — dat is *niet* gelijkgetrokken, want dat zou wél
gedrag veranderen; alleen de volumecurve zelf is samengevoegd. `genStrength` (sets-gebaseerd,
geen taper) en `genRecovery` (vaste pool, geen groei) zijn bewust niet in deze abstractie
geperst — die groeien fundamenteel anders.

Geverifieerd met een regressietest: 22 representatieve profielen (elk schema-type, curve-uitersten
1 en 11, taper-grenzen bij 8/12 weken, blessures, combo met/zonder hardlopen/taper/wandelen)
gegenereerd met de oude en de nieuwe code, output byte-voor-byte vergeleken — identiek in alle
gevallen. Nog niet live in de browser getest, alleen via Node-simulatie van de daadwerkelijke
generatorfuncties.

## Starten (dagelijks gebruik)
Open index.html in browser, of gebruik een lokale server:
`cd ~/Trainen-met-een-doel && python3 -m http.server 8080`
→ http://localhost:8080

GPS/Bluetooth werken alleen met https — testen op de telefoon gaat via de `beta`-branch
(GitHub Pages-bron staat daar tijdelijk op, i.p.v. `main`), niet via de lokale server.

## Git-workflow (sinds 19 aug 2026)
- `main` = productie (nielskingma.github.io/trainen-met-een-doel/ zodra Pages-bron terug op main staat)
- `beta` = testbranch, Pages-bron staat er nu op — **Claude kan hier niet naar pushen** (geen
  Keychain-toegang in de sandbox), dat moet de gebruiker zelf doen in een eigen Terminal:
  `cd ~/Trainen-met-een-doel && git push origin beta` (en na wijzigingen op main: `git branch -f beta main`
  laat Claude al doen, alleen de push zelf niet)
- Na akkoord op alle beta-functionaliteit: main pushen om ook de productie-app bij te werken

## Openstaande taken
Zie memory: ~/.claude/projects/-Users-nielskingma/memory/project_trainen_met_een_doel.md

## Bekende problemen / valkuilen
- Zie memory voor gedetailleerde bugs en beslissingen
