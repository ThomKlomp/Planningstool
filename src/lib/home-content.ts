import { PRICE_TIERS, formatEuro } from "@/lib/pricing";

/** Gedeelde teksten van de homepage, voor alle ontwerpen (en de FAQ-schema). */
export const FEATURES = [
  { title: "Beschikbaarheid", body: "Medewerkers geven per dag of per shift aan of ze kunnen, net zo simpel als een datumprikker. Handig of je nu vooral in het weekend plant (café, bar) of ook doordeweeks met lunch en diner (restaurant): jij zet weken vooraf open, zodat er nooit een gat valt." },
  { title: "Rooster", body: "Beschikbaarheid staat er al naast zodra je gaat inplannen. Sleep niemand meer tussen appjes, het staat gewoon in beeld." },
  { title: "Teams", body: "Deel medewerkers in bij bediening, keuken of bar. Handig zodra je met meerdere onderdelen tegelijk plant, zoals keuken en bediening in een restaurant: op het rooster zie je in één oogopslag wie waar hoort." },
  { title: "Ruilen & overnemen", body: "Een medewerker kan niet meer? Die biedt de dienst aan, een collega neemt 'm over, en jij geeft (als je dat wil) nog even je akkoord." },
  { title: "Uren", body: "Gewerkte uren vullen zich deels vanzelf in op basis van het rooster. Medewerkers bevestigen, jij keurt goed of stuurt terug met een vraag." },
];

export const FAQ = [
  { q: "Wat is Shiftje?", a: `Shiftje is een Nederlandse rooster- en personeelsplanningapp voor kleine horecabedrijven, zoals cafés, restaurants en bars met tot 40 medewerkers. Beschikbaarheid, rooster, diensten ruilen en uren zitten allemaal in dezelfde app.` },
  { q: "Voor wie is Shiftje gemaakt?", a: `Voor kleine horecazaken tot 40 medewerkers: cafés, restaurants en bars. Eén team, één rooster, geen ingewikkelde configuratie vooraf.` },
  { q: "Wat kost Shiftje?", a: `Vanaf ${formatEuro(PRICE_TIERS[0].monthlyExcl)} per maand excl. btw voor 1–10 medewerkers, oplopend in staffels tot ${formatEuro(PRICE_TIERS[PRICE_TIERS.length - 1].monthlyExcl)} per maand voor 31–40 medewerkers. Je betaalt één vast bedrag per zaak, niet per gebruiker. Boven de 40 medewerkers reken je op maat.` },
  { q: "Kan ik maandelijks opzeggen?", a: `Ja, met een maandabonnement kun je elke maand opzeggen. Kies je een jaarabonnement (2 maanden korting), dan loopt dat een jaar.` },
  { q: "Kan ik Shiftje eerst gratis proberen?", a: `Ja, je kunt 7 dagen gratis beginnen zonder creditcard.` },
  { q: "Werkt Shiftje ook voor een restaurant met keuken én bediening?", a: `Ja. Je deelt medewerkers in bij teams zoals bediening en keuken, en plant lunch- en dinerdiensten los van elkaar in.` },
  { q: "Wat gebeurt er als iemand een dienst niet kan werken?", a: `Die biedt de dienst aan het team aan. Een collega neemt 'm over of ruilt, en jij ziet het meteen terug in het rooster.` },
  { q: "Is Shiftje een planningstool, roostertool of beschikbaarheidsprogramma?", a: `Eigenlijk alle drie tegelijk. Shiftje combineert beschikbaarheid doorgeven, een rooster maken en uren goedkeuren in één programma, zodat je niet drie losse tools nodig hebt.` },
];
