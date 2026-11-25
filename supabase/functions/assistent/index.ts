// Roosterplanner-assistent: stuurt de vraag door naar Claude (Anthropic API).
// De API-sleutel staat als geheim in Supabase (ANTHROPIC_API_KEY), nooit in de app.
// Claude voert zelf niets uit: hij stelt acties voor, de app vraagt de gebruiker
// om "Toepassen" en controleert daarbij opnieuw de rechten.

const MODEL = Deno.env.get("ASSISTENT_MODEL") ?? "claude-sonnet-5-5";
const ORIGINS = ["https://boudewijn122.github.io", "http://localhost:8791", "http://127.0.0.1:8791"];
const MAX_BODY = 60_000;
const hits = new Map<string, number[]>();

function cors(origin: string | null) {
  const o = origin && ORIGINS.includes(origin) ? origin : ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": o,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function tooMany(ip: string) {
  const now = Date.now(), list = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  list.push(now); hits.set(ip, list);
  return list.length > 40;
}

const DAGDEEL = { type: "string", enum: ["ochtend", "middag", "dag"], description: "ochtend, middag of hele dag" };
const DATUM = { type: "string", description: "Datum als JJJJ-MM-DD" };
const PERSOON = { type: "string", description: "id van de persoon uit context.personen (leeg = de gebruiker zelf)" };

const TOOLS_ALLEN = [
  {
    name: "ziek_melden",
    description: "Meld de gebruiker (of, voor een planner, iemand anders) ziek voor een dag of dagdeel. Alleen vandaag of later.",
    input_schema: { type: "object", properties: { persoon: PERSOON, datum: DATUM, dagdeel: DAGDEEL }, required: ["datum", "dagdeel"] },
  },
  {
    name: "vrij_aanvragen",
    description: "Vraag vakantie, congres of cursus aan. Vakantie hoort minimaal 12 weken vooraf; eerder mag maar de planner kan afwijzen. Een planner legt het voor een ander direct vast.",
    input_schema: {
      type: "object",
      properties: {
        persoon: PERSOON,
        soort: { type: "string", enum: ["Vakantie", "Congres", "Congres organisatie", "Cursus / onderwijs"] },
        van: DATUM, tot: DATUM,
        van_dagdeel: { type: "string", enum: ["dag", "middag"], description: "dag = vanaf de ochtend" },
        tot_dagdeel: { type: "string", enum: ["dag", "ochtend"], description: "dag = tot en met de middag" },
        notitie: { type: "string", description: "korte toelichting, max 200 tekens" },
      },
      required: ["soort", "van", "tot"],
    },
  },
  {
    name: "geen_dienst",
    description: "Geef aan op welke dagen de gebruiker GEEN dienst kan (of zet dat weer terug). Alleen voor de gebruiker zelf.",
    input_schema: {
      type: "object",
      properties: { datums: { type: "array", items: DATUM, minItems: 1, maxItems: 62 }, kan_niet: { type: "boolean", description: "true = geen dienst, false = toch beschikbaar" } },
      required: ["datums", "kan_niet"],
    },
  },
];
const TOOLS_DIENST = [
  {
    name: "dienst_inplannen",
    description: "Plan iemand in voor de dienst op een datum (weekend: zaterdag en zondag gaan samen). Gebruik context.diensten om beschikbaarheid te checken. persoon leeg = dienst leegmaken.",
    input_schema: { type: "object", properties: { datum: DATUM, persoon: PERSOON }, required: ["datum"] },
  },
  {
    name: "diensten_verdelen",
    description: "Verdeel de nog lege diensten van een maand automatisch en eerlijk naar FTE, rekening houdend met vakantie en geen-dienstdagen.",
    input_schema: { type: "object", properties: { maand: { type: "string", description: "JJJJ-MM" } }, required: ["maand"] },
  },
];
const TOOLS_PLANNER = [
  {
    name: "inplannen",
    description: "Plan een activiteit in voor een of meer personen op een werkdag (overschrijft het basisrooster voor dat dagdeel).",
    input_schema: {
      type: "object",
      properties: {
        personen: { type: "array", items: { type: "string" }, minItems: 1, description: "ids uit context.personen" },
        datum: DATUM, dagdeel: DAGDEEL,
        activiteit: { type: "string", description: "bijv. 'OK MCL', 'su', 'pok', 'FK su', 'NS OK', 'AO', 'overleg', of eigen korte tekst" },
        notitie: { type: "string" },
      },
      required: ["personen", "datum", "dagdeel", "activiteit"],
    },
  },
];

const HANDLEIDING = `
Over de app (Roosterplanner, vervanger van MedSpace voor een kliniek plastische chirurgie):
- Tabs onderin: Agenda (dag/week/maand), Diensten, Afwezig; planners ook Team en Bezetting; beheerder ook Beheer.
- Rechtermuisknop (computer) of lang drukken (telefoon) op een dag, blok of leeg tijdstip opent een menu: afspraak op dat tijdstip, inplannen (planner), vrij vragen, ziek melden, notitie, geen dienst. Dubbelklik op een leeg tijdstip = nieuwe afspraak.
- Vrij vragen: vakantie minimaal 12 weken vooraf; eerder mag met waarschuwing. Alleen planner of beheerder keurt goed. Gearceerd = aangevraagd, effen = goedgekeurd. Saldo in dagen staat in je profiel (pictogram rechtsboven): 7 weken vakantie en 2 weken congres per jaar naar rato van werkdagen, plus eventuele sabbatical.
- Ziek melden kan via het menu of via de assistent; een ziekmelding kun je zelf weer verwijderen.
- Diensten: dagdienst doordeweeks, weekenddienst za+zo samen. Iedereen geeft in de tab Diensten (Mijn beschikbaarheid) of via lang drukken aan wanneer hij GEEN dienst kan; vakantie telt automatisch mee. De dienstplanner verdeelt op FTE (tabel met FTE, % dienst, doel, ingepland, gedaan).
- Afspraken (PT1, vergadering, wetenschap, onderwijs, overleg) per dagdeel incl. avond, via de + knop of het menu.
- Notities per blok: privé of gedeeld (als je dat recht hebt).
- Instellingen (tandwiel): kleuren per soort, zachte kleuren, donkere modus, lettertype, tekstgrootte. Op de computer: widgets rechts.
- Verbeterpunten: tekstwolkje bovenin, gaat naar de beheerder.
- Testfase: gegevens staan nog per toestel; gedeelde gegevens tussen collega's komen binnenkort.
`;

function systemPrompt(ctx: Record<string, unknown>) {
  return `Je bent de assistent in de Roosterplanner-app van een privékliniek plastische chirurgie. Antwoord in het Nederlands, kort en vriendelijk (dit wordt vaak op een telefoon gelezen).

Regels:
- Je mag alleen acties VOORSTELLEN via de tools; de gebruiker tikt daarna zelf op "Toepassen". Zeg dus niet dat iets al gedaan is; zeg dat je het klaarzet.
- Gebruik alleen de tools die je krijgt; die passen bij de rol van de gebruiker. Vraagt iemand iets waar hij geen recht op heeft, leg dan uit wie dat kan (planner, dienstplanner of beheerder).
- Werk met de gegevens in de context hieronder; verzin geen namen, datums of roosters. Is iets onduidelijk (welke dag? welk dagdeel?), vraag het eerst kort.
- Reken relatieve datums ("morgen", "volgende week vrijdag") om vanaf vandaag (${ctx.vandaag}, ${ctx.weekdag}).
- Bij diensten plannen: kijk naar beschikbaarheid (vakantie, aanvragen, geen dienst) en de verdeling naar FTE in de context; leg in één zin uit waarom je iemand kiest.
- Geen patiëntgegevens: vraag er niet naar, sla ze niet op en zet ze niet in notities. Als iemand patiëntinformatie typt, zeg dat die niet in deze app hoort.
- Geen medisch advies; dit gaat alleen over planning en het gebruik van de app.
${HANDLEIDING}
Context (JSON, alleen wat deze gebruiker mag zien):
${JSON.stringify(ctx)}`;
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin"), headers = cors(origin);
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...headers, "Content-Type": "application/json" } });
  if (req.method !== "POST") return json({ error: "Alleen POST" }, 405);
  if (origin && !ORIGINS.includes(origin)) return json({ error: "Niet toegestaan" }, 403);

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "?";
  if (tooMany(ip)) return json({ error: "Even rustig aan: probeer het over een paar minuten opnieuw." }, 429);

  const key = Deno.env.get("ANTHROPIC_API_KEY");
  if (!key) return json({ error: "De assistent is nog niet ingesteld (API-sleutel ontbreekt)." }, 503);

  const raw = await req.text();
  if (raw.length > MAX_BODY) return json({ error: "Gesprek te lang; begin een nieuw gesprek." }, 413);
  let body: { messages?: unknown[]; context?: Record<string, unknown> };
  try { body = JSON.parse(raw); } catch { return json({ error: "Ongeldige aanvraag" }, 400); }
  const messages = Array.isArray(body.messages) ? body.messages.slice(-30) : [];
  const ctx = body.context ?? {};
  if (!messages.length) return json({ error: "Geen bericht" }, 400);

  const rol = String(ctx.rol ?? "");
  const tools = [...TOOLS_ALLEN];
  if (rol === "admin" || rol === "dienst") tools.push(...TOOLS_DIENST);
  if (rol === "admin" || rol === "beheer") tools.push(...TOOLS_PLANNER);

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: MODEL, max_tokens: 1500, system: systemPrompt(ctx), tools, messages }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    console.error("Anthropic", r.status, JSON.stringify(data).slice(0, 500));
    return json({ error: "De assistent kon nu niet antwoorden (" + r.status + "). Probeer het later opnieuw." }, 502);
  }
  return json({ content: data.content ?? [], stop_reason: data.stop_reason });
});
