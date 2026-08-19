# Trainen-met-een-doel — WERKINSTRUCTIE

## Doel
PWA (Progressive Web App) voor hardlopers om trainingsschema's te volgen op basis van doelen, hartslag en prestaties.

## Huidige staat
In ontwikkeling. Zie memory-bestanden voor gedetailleerde architectuur en open punten:
~/.claude/projects/-Users-nielskingma/memory/project_trainen_met_een_doel.md

## Architectuur
Volledig client-side PWA — geen server, alles in de browser.
HTML + CSS + JavaScript, opgeslagen in ~/Trainen-met-een-doel/

## Bestanden
| Bestand | Rol |
|---------|-----|
| index.html | Startscherm — keuze tussen "Maak jouw schema" en "Kant-en-klare schema's" |
| onboarding.html | Intakeformulier + schema-generatoren (genRunning/genCycling/genSwimming/genWalking/genStrength/genRecovery/genCombo) |
| mijn-schema.html | Gegenereerd persoonlijk schema: voortgang, adaptief schema, prestatieverwachting, GPS-tracker (start training vanaf een hardloop/fiets/wandel-sessie) |
| schema.html | Vier vaste kant-en-klare schema's (5km/10km/HM/jongere) met eigen GPS-tracker — losse, standalone lane |
| design.css | Stijlen |

(19 aug 2026: `generator.html` verwijderd — was dode code, nergens meer aan gelinkt sinds de generator-logica in `onboarding.html` zit.)

## Starten (dagelijks gebruik)
Open index.html in browser, of gebruik een lokale server:
`cd ~/Trainen-met-een-doel && python3 -m http.server 8080`
→ http://localhost:8080

## Openstaande taken
Zie memory: ~/.claude/projects/-Users-nielskingma/memory/project_trainen_met_een_doel.md

## Bekende problemen / valkuilen
- Zie memory voor gedetailleerde bugs en beslissingen
