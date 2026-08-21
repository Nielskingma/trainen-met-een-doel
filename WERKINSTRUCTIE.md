# Trainen-met-een-doel — WERKINSTRUCTIE

## Doel
PWA (Progressive Web App) voor hardlopers om trainingsschema's te volgen op basis van doelen, hartslag en prestaties.

## Huidige staat
In actieve ontwikkeling, beta-fase. Zie memory-bestand voor gedetailleerde architectuur en open punten:
~/.claude/projects/-Users-nielskingma/memory/project_trainen_met_een_doel.md

## Architectuur
Volledig client-side PWA — geen server, alles in de browser.
HTML + CSS + JavaScript, opgeslagen in ~/Trainen-met-een-doel/

## Ontwerpregel: elke invoer moet een passend effect hebben (21 aug 2026)
Elk veld dat de gebruiker invult in de intake moet een aantoonbaar, bij die invoer passend
effect hebben op het gegenereerde schema. Geen velden die alleen opgeslagen worden zonder ooit
gelezen te worden in de generatielogica.

**Waarom**: bij een volledige doorlichting van elk profielveld (zie de gepubliceerde
generator-referentie) bleek dat een flink aantal velden met een eigen formulierstap nergens in
de generatielogica gelezen wordt — de gebruiker vult iets in en verwacht terecht dat het meetelt.

**Bekende overtredingen (nog op te lossen)**:
- `geslacht` — geen effect
- `hl_tempo` — geen effect
- `materiaal[]` — geen effect (de gymvraag `gym` werkt wél)
- `herstel_van` / `herstel_duur` — geen effect
- `doeldatum` — alleen een waarschuwingstekst, herberekent de schemaduur niet
- `injury`: "Hart of bloeddruk" / "Anders" — geen factor toegepast, alleen als tag getoond

**Hoe toepassen**: bij een nieuw formulierveld in dezelfde wijziging ook de generatorcode
aanpassen zodat het veld een reëel effect krijgt — of bewust weglaten/als puur informatief
labelen als er geen zinvol effect is. Bij twijfel: liever geen veld dan een schijn van invloed.

## Bestanden
| Bestand | Rol |
|---------|-----|
| index.html | Startscherm — keuze tussen "Maak jouw schema" en "Kant-en-klare schema's" |
| onboarding.html | Intakeformulier + schema-generatoren (genRunning/genCycling/genSwimming/genWalking/genStrength/genRecovery/genCombo) |
| mijn-schema.html | Gegenereerd persoonlijk schema: voortgang, adaptief schema, prestatieverwachting, GPS-tracker (vanaf een sessie of als losse "Start training"), Bluetooth-hartslag, pauzeknop, herstel na onderbreking |
| schema.html | Vier vaste kant-en-klare schema's (5km/10km/HM/jongere) met eigen GPS-tracker — losse, standalone lane |
| design.css | Stijlen |
| manifest.json + sw.js + icons/ | PWA-installeerbaarheid (toegevoegd 21 aug 2026) |

(19 aug 2026: `generator.html` verwijderd — was dode code, de allereerste versie van de app, nergens meer aan gelinkt.)

## Kernmodel van schema-generatie (19 aug 2026 — belangrijk bij verder werken)
1. **Intaketest = altijd sessie 1** — maar alleen wanneer hardlopen de hoofdsport is (sport met de meeste sessies/week; de enige sport met een GPS-testprotocol in de app). Bij hardlopen als hoofdsport vervangt `generateSchema()` automatisch de eerste sessie door een 12-minuten-Cooper-test, getrackt via de gewone "Start met GPS"-knop in mijn-schema.html.
2. **Echte uitslag herberekent het schema** — zodra die intakesessie is afgerond, wordt het gemeten resultaat (i.p.v. de zelf-ingeschatte afstand) in `profile.intaketest.hl` gezet en het schema opnieuw gegenereerd.
3. **Rollend 2-wekenvenster** — het schema wordt nog wel volledig doorgerekend (deterministisch), maar alleen de eerstkomende 2 weken (`plannedThroughWeek`) krijgen zichtbare sessie-inhoud. Latere weken tonen een ingeklapte kaart (weeknummer + ruwe richting) tot mijn-schema.html ze automatisch bijvult via `ensureConcreteWeeks()` — hetzelfde regenerate-mechanisme dat ook curve-aanpassingen gebruikt.
4. **Voortgang blijft behouden bij herberekenen** — `reconcileProgressAfterRegen()` in mijn-schema.html vergelijkt bij elke herberekening (curve-aanpassing, sessies/week wijzigen, intake-resultaat, horizon bijvullen) het vorige en nieuwe schema per week; alleen weken waar de sessie-indeling écht verandert verliezen hun afvinkjes/RPE/GPS-resultaten.
5. **GPS-tracker** (mijn-schema.html): sessies met `sport` = hardlopen/fietsen/wandelen krijgen een "▶ Start training"-knop, of via de losse "Start training"-kaart op index.html/de zwevende knop in mijn-schema.html (sportkeuze, niet aan een schema gekoppeld). Sportkeuze/bevestiging/live-cijfers staan allemaal op één scherm (geen schermwissel bij op start drukken); bij een sessie staat de trainingsomschrijving er ook bij. Sessies met een warming-up in de omschrijving (of elke lichte/lange sessie, vast op minimaal 5 min) krijgen een aparte, getrackte warming-up-lap. Optioneel: Bluetooth-hartslagsensor koppelen — **alleen Chrome-achtige browsers (Web Bluetooth), niet Safari/iOS**.
6. **Beperking**: intake-als-sessie-1 en het rollend venster gelden vooralsnog alleen als hardlopen de hoofdsport is. Fietsen/zwemmen/wandelen/kracht-schema's blijven het oude gedrag: volledig gegenereerd, geen verplichte intake.

## GPS-tracker: robuustheid (toegevoegd 19 aug 2026, n.a.v. live testen)
- **GPS zoekt al vóór starten**: zodra het trainingsscherm opent begint de app te zoeken naar
  een positie met een onzekerheid ≤ 30 m; de startknop blijft uitgeschakeld ("GPS zoeken…") tot
  die er is (na 20 sec zonder succes versoepelt de eis naar 100 m, anders blijf je vast zitten
  binnenshuis). Voorkomt dat een slechte "koude" eerste fix als beginpunt gebruikt wordt.
- **Afstandsfilter tijdens het lopen**: fixes met > 30 m onzekerheid worden genegeerd, bewegingen
  < 5 m gelden als ruis, sprongen > 150 m tussen twee updates (onrealistisch voor 1×/seconde)
  tellen niet mee als afstand. Was nodig na een gemelde bug (100 m lopen → 2 km getoond).
- **Pauzeknop** (⏸/▶): GPS en klok stoppen netjes, gepauzeerde tijd/afstand telt niet mee bij
  hervatten.
- **Herstel na onderbreking**: mobiele browsers kunnen een achtergrond-pagina volledig herladen
  (vooral tijdens een telefoongesprek) — alle trackerstate leeft alleen in het geheugen, dus was
  dan gewoon kwijt. Nu wordt de lopende training elke seconde naar `localStorage`
  (`tmg_active_training`) weggeschreven en pas opgeruimd bij bewust stoppen/opslaan/sluiten. Staat
  die er bij het laden nog, dan toont de app een banner "Onderbroken training gevonden" met
  Hervatten/Verwijderen. **Dit voorkomt niet dát de pagina gedood kan worden** (kan een
  client-side web-app niet afdwingen zonder server/native app) — het zorgt alleen dat voortgang
  herstelbaar is i.p.v. spoorloos te verdwijnen.
- **Waarschuwing tijdens actief trainen** (toegevoegd 21 aug 2026): zodra de training loopt
  (op zowel het vrij-trainen- als het sessie-scherm, én op het vergrendelscherm) staat er nu een
  amber-gekleurde melding: "Zet het scherm niet handmatig uit en sluit de app niet af — de
  training kan dan verloren gaan. Moet je stoppen? Gebruik de pauzeknop." Gedeelde class
  `.trk-active-warning`, getoond/verborgen op exact dezelfde momenten als de pauze/stop-knoppen
  (`beginFreeTraining()`/`beginSessionTraining()`/`resumeActiveTraining()` tonen 'm,
  `resetFreeStartButtons()`/`showIdleScreen()` verbergen 'm weer).
- **Herstel-balk ook op index.html** (toegevoegd 20 aug 2026, n.a.v. live testen): bij handmatig
  het scherm uitzetten (aan/uit-knop) bleek de telefoon de app soms niet te "pauzeren" maar
  volledig te herstarten bij de startpagina — dan draaide de herstel-check in mijn-schema.html
  nooit, dus geen banner, training leek spoorloos weg. `tmg_active_training` staat in dezelfde
  localStorage ongeacht welke pagina 'm schreef, dus index.html checkt nu bij het laden ook zelf
  of er een onderbroken training is en toont daar dezelfde banner. "Hervatten" gaat naar
  `mijn-schema.html?resume=1`, wat aan het eind van het script automatisch `resumeActiveTraining()`
  aanroept (zelfde patroon als `?free=1`). Getest via Node-simulatie van beide pagina's.

## Product-audit uitgevoerd — hoog/matig-prioriteit doorgevoerd (21 aug 2026)
Op verzoek een onafhankelijke doorlichting gedaan van onboarding, overzicht en GPS-tracker
(zie het gepubliceerde artifact voor de volledige audit), en direct de hoog/matig-bevindingen
geïmplementeerd:
- **Stap 3 opgesplitst met sub-navigatie**: was één ongestructureerd megaformulier (basis,
  materiaal, niveau/intake per sport, hartslag, doel/herstel, blessures allemaal na elkaar).
  Nu een sticky chip-balk (`renderStep3Nav()`) die alleen de daadwerkelijk zichtbare secties
  toont en er via `scrollIntoView` + `IntersectionObserver` naartoe navigeert/highlight. Raakt
  de bestaande sport-afhankelijke show/hide-logica (`toggle()`/`updateCondBlocks()`) niet aan —
  puur een navigatielaag erbovenop.
- **Live voorbeeld onder de tuning-sliders** (stap 4): curve/focus/conflict waren drie abstracte
  cijfers zonder zichtbaar effect. `computeTuningPreview()` draait de ECHTE generatorfunctie
  (dezelfde als "Schema genereren" gebruikt, geen herïmplementatie) en toont de zwaarste
  niet-taper/hersteweek live mee terwijl je sleept ("Rond week 9 van 12 train je in je zwaarste
  week ongeveer 42 km").
- **Slimme startwaarden op de sliders**: `computeSmartTuningDefaults()` zet curve/focus/
  perfHerstel bij een écht nieuw profiel op een berekend beginpunt (o.b.v. doelen, blessures,
  huidige activiteit) i.p.v. altijd blind op het neutrale midden — met een "voorgesteld"-hint.
  Overschrijft nooit een bestaand/aangepast profiel (guard op `tmg_generated_schema` +
  fabrieksdefault-check + `tuningTouched`-vlag zodra de gebruiker zelf aan een slider zit).
- **"Instellingen aanpassen" springt direct naar stap 4**: de knop in mijn-schema.html's header
  ging naar `onboarding.html` zonder parameter — dat startte altijd bij stap 1, dus moest je
  Doel → Activiteit → Situatie opnieuw langs voor één slider. Nu `onboarding.html?step=4`,
  afgehandeld ná de `let currentStep`-declaratie aan het eind van het script (zelfde
  TDZ-patroon als `?free=1`/`?resume=1` in mijn-schema.html).
- **Installeerbare PWA**: `manifest.json` (standalone display, target-icoon in `icons/`) + een
  bewust kale `sw.js` (geen enkele cache — alleen install/activate/fetch-passthrough, puur om
  aan Android's installeerbaarheidscriteria te voldoen) toegevoegd aan alle 4 pagina's. Lost het
  achtergrond-kill-probleem niet fundamenteel op, maar geïnstalleerde PWA's worden door Android
  doorgaans minder agressief opgeruimd dan een los tabblad — de goedkoopste stap met echt effect.
- **Banner-kleurhiërarchie** (21 aug 2026, alsnog toegevoegd op verzoek): resume-banner
  (onderbroken training — tijdgevoelig, voortgang kan alsnog verloren gaan) gebruikt nu
  `--danger` i.p.v. dezelfde amber (`--warn`) als adaptive-banner (optionele suggestie), op zowel
  index.html als mijn-schema.html. `.pred-overview` (prestatieverwachting) bleek bij nader inzien
  al neutraal gestyled (`var(--surface)`, geen amber) — geen wijziging nodig, de audit overschatte
  dit punt licht.
- **Bewust nog niet gedaan**: de grote gok (Capacitor-wrapper voor náadloze achtergrond-GPS) —
  pas de moeite waard bij bewezen noodzaak.
- **Getest**: nieuwe Node-simulaties voor live-preview, slimme defaults (4 scenario's incl. "niet
  overschrijven bij terugkerende gebruiker") en de `?step=4`-sprong; volledige 22-profielen
  generator-regressietest herbevestigd (identieke output, dus de architectuur-opschoning is niet
  geraakt); alle eerdere sessie-tests (GPS/pauze/herstel/schermen) opnieuw gedraaid, geen
  regressies. Nog niet live in de browser getest door de gebruiker.

## Architectuur-opschoning (uitgevoerd 19 aug 2026)
De 7 sport-generators hadden elk hun eigen, licht verschillende kopie van de volume-opbouw-logica
(herstelweek-ritme, taper, groei-percentages). Nu samengevoegd tot één gedeelde
`buildVolumeCurve(startVol, totalWeeks, curve, opts)` — teruggebracht uit de aanpak van de
allereerste versie (`generator.html`), parameterbaar per aanroeper (`increaseRate`, `hasTaper`,
`taperFinal`/`taperOther`, `recoveryDrop`) zodat de bestaande, bewust net-iets-verschillende
getallen per sport exact behouden blijven. Gebruikt door `genRunning`/`genCycling`/`genSwimming`/
`genWalking` en (drie keer parallel, voor hardlopen/fietsen/zwemmen tegelijk) door `genCombo`.
Daarnaast een gedeelde `bikeSession()` en `walkSession()`. Bij het samenvoegen bleek `genCombo`'s
eigen fiets-sessietekst al langer inhoudelijk net anders dan `genCycling`'s tekst (geen
blessure-aanpassingen, andere formulering), en wandelen binnen combo gebruikte vaste minuten
(20/30/45) i.p.v. een meegroeiende curve. Op verzoek van gebruiker alsnog gelijkgetrokken
(commit `454ec2a`): `genCombo` gebruikt nu overal dezelfde `bikeSession()`/`walkSession()` als
de losse schema's, inclusief een echte, meegroeiende wandelvolume-curve. `genStrength` (sets-gebaseerd,
geen taper) en `genRecovery` (vaste pool, geen groei) zijn bewust niet in deze abstractie
geperst — die groeien fundamenteel anders.

Geverifieerd met een regressietest: 22 representatieve profielen (elk schema-type, curve-uitersten
1 en 11, taper-grenzen bij 8/12 weken, blessures, combo met/zonder hardlopen/taper/wandelen)
gegenereerd met de oude en de nieuwe code, output byte-voor-byte vergeleken — identiek in alle
gevallen.

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
- **Stand 20 aug 2026**: `main` én `beta` op GitHub staan beide op `a87d777` (gebruiker heeft
  bewust ook main gepusht, niet alleen beta zoals eerder de bedoeling was) — productie is dus nu
  ook bijgewerkt met alle GPS/pauze/herstel-fixes uit deze en de vorige sessie.

## Openstaande taken
Zie memory: ~/.claude/projects/-Users-nielskingma/memory/project_trainen_met_een_doel.md

## Bekende problemen / valkuilen
- Zie memory voor gedetailleerde bugs en beslissingen
