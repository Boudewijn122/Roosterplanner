# Roosterplanner (demo)

Installeerbare web-app voor het rooster van de vakgroep, in de stijl van Apple Agenda.

**Openen:** https://boudewijn122.github.io/Roosterplanner/
Op de iPhone: open de link in Safari → Deel → **Zet op beginscherm**.

## Wat kan het
- Agenda per **dag, week en maand**, met codes uit MedSpace (OK3, LSU1, FKSU …)
- **Afspraken** per dagdeel (ochtend, middag, avond) met tijd, soort (PT1, vergadering, wetenschap …) en omschrijving
- **Visite** (08:00–08:30) automatisch vóór een ochtendspreekuur in het MCL
- **Lang drukken** (telefoon) of **rechtermuisknop** (computer) op een dag, blok of leeg tijdstip: afspraak op dat tijdstip, inplannen, ziek melden, vrij vragen, notitie; dubbelklik op een leeg tijdstip maakt direct een afspraak
- **Notities** per blok: privé, of zichtbaar voor iedereen voor wie dat recht heeft
- **Team**: wie staat waar; **Bezetting**: tekorten t.o.v. de normen uit de Excel
- **Afwezigheid** aanvragen en goedkeuren (planner)
- **Beheerder**-login (demo-code 1234): blokken en ingrepen aanpassen, rechten, notities, export
- **Planner/beheerder plant in** vanuit de agenda (+ of lang drukken → Inplannen); betrokkenen krijgen een melding
- **Tekorten** na goedkeuren of herplannen: zichtbaar in de agenda, met voorstel voor een invaller of een notitie
- **Saldo in dagen**: vakantie (standaard 7 weken + eventueel sabbatical) en congres (standaard 2 weken), naar rato van werkdagen per week; vakantie minimaal 12 weken vooraf
- **Inloggen** per account (gebruikersnaam + wachtwoord; demo: wachtwoorden alleen op dit toestel)
- **Profiel** via je eigen pictogram: naam, e-mail, 06, meldingen, wachtwoord wijzigen, uitloggen
- **Afwezigheid naast de planning** (zoals Apple Agenda); gearceerd = aangevraagd, effen = goedgekeurd; ziekmelding verwijderen
- **Verbeterpunten**-tab (bovenbalk): gaat alleen naar de beheerder (e-mailadres in `config.js`)
- **Widgets** op de computer: per account toevoegen, inklappen en verwijderen
- **Instellingen**: eigen kleuren per account, zachte kleuren, donkere modus, lettertype en tekstgrootte
- Werkt zichzelf automatisch bij op telefoons die de app op het beginscherm hebben
- Team en Bezetting alleen voor planner en beheerder
- **Diensten**-tab: de **dienstplanner** ziet alleen de diensten (dagdienst, weekenddienst za+zo), plant per dag of verdeelt automatisch naar FTE; vakantie en "geen dienst" tellen als niet beschikbaar
- Iedereen geeft in Diensten (of via lang drukken in de agenda) aan wanneer hij **geen dienst** kan; overzicht van FTE, % dienst, doel, ingepland en gedaan
- Rollen: beheerder, planner (2), dienstplanner (1), specialist, AIOS/ANIOS; FTE en "doet diensten" per persoon in Beheer

## Let op
Demo met geanonimiseerde namen (Chirurg A–H, AIOS 1–6). Alles (ook meldingen) wordt alleen op het eigen toestel bewaard;
echt delen tussen telefoons en pushberichten vragen om een server;
de beheerderscode is geen echte beveiliging.

Na een wijziging: verhoog `VERSION` in `sw.js`, zodat telefoons de nieuwe versie ophalen.

### Versie 18
- Meldingen in- en uitklapbaar, per stuk of allemaal te verwijderen (profiel en widget)
- Inplannen vraagt eerst bevestiging als het iets overschrijft (bijv. AO = hele dag)
- "Geen dienst" binnen 12 weken wordt een verzoek dat de (dienst)planner goedkeurt
- Diensten **uitrollen**: eerst geen dienst, vakantie en AO, dan eerlijk naar FTE; maand blijft concept tot **Publiceren**
- FTE-tabel voor iedereen zichtbaar (alleen gepubliceerde diensten)
- **Dienst ruilen**: collega gaat akkoord en het is direct geregeld; dienstplanner krijgt een melding
- Assistent in Claude-stijl
