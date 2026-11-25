# Roosterplanner (demo)

Installeerbare web-app voor het rooster van de vakgroep, in de stijl van Apple Agenda.

**Openen:** https://boudewijn122.github.io/Roosterplanner/
Op de iPhone: open de link in Safari → Deel → **Zet op beginscherm**.

## Wat kan het
- Agenda per **dag, week en maand**, met codes uit MedSpace (OK3, LSU1, FKSU …)
- **Ingrepen** per OK/POK-blok (voorbeeld, zonder patiëntgegevens)
- **Lang drukken** (telefoon) of **rechtermuisknop** (computer) op een dag of blok: ziek melden, vrij vragen, notitie, details
- **Notities** per blok: privé, of zichtbaar voor iedereen voor wie dat recht heeft
- **Team**: wie staat waar; **Bezetting**: tekorten t.o.v. de normen uit de Excel
- **Afwezigheid** aanvragen en goedkeuren (planner)
- **Beheerder**-login (demo-code 1234): blokken en ingrepen aanpassen, rechten, notities, export
- **Planner/beheerder plant in** vanuit de agenda (+ of lang drukken → Inplannen); betrokkenen krijgen een melding
- **Tekorten** na goedkeuren of herplannen: zichtbaar in de agenda, met voorstel voor een invaller of een notitie
- **Vakantiesaldo in uren** per persoon (1 dag = 8 u); vakantie minimaal 12 weken vooraf
- **Profiel** via je eigen pictogram (contactgegevens, voorkeuren, meldingen)
- **Instellingen**: eigen kleuren per account, donkere modus, lettertype en tekstgrootte
- Team en Bezetting alleen voor planner en beheerder

## Let op
Demo met geanonimiseerde namen (Chirurg A–H, AIOS 1–6). Alles (ook meldingen) wordt alleen op het eigen toestel bewaard;
echt delen tussen telefoons en pushberichten vragen om een server;
de beheerderscode is geen echte beveiliging.

Na een wijziging: verhoog `VERSION` in `sw.js`, zodat telefoons de nieuwe versie ophalen.
