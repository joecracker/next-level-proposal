// Turns the single "address" box into mailing-envelope lines:
//   street
//   City, ST 12345
// If it was typed on separate lines already, those lines are kept as they are.

const SUFFIXES = [
  'St', 'Street', 'Rd', 'Road', 'Ave', 'Avenue', 'Dr', 'Drive', 'Ln', 'Lane', 'Ct', 'Court',
  'Blvd', 'Boulevard', 'Way', 'Pl', 'Place', 'Pkwy', 'Parkway', 'Hwy', 'Highway', 'Trl', 'Trail',
  'Cir', 'Circle', 'Ter', 'Terrace', 'Loop', 'Run', 'Pike', 'Path', 'Sq', 'Square',
];

const CITY_STATE_ZIP = /^(.+?)[,\s]+([A-Za-z]{2})\.?(?:[,\s]+(\d{5}(?:-\d{4})?))?$/;

/** "Clio MI. 48420" -> "Clio, MI 48420". Leaves anything it does not recognise alone. */
const tidyCityLine = (line: string): string => {
  const m = line.trim().match(CITY_STATE_ZIP);
  if (!m) return line.trim();
  const city = m[1].replace(/[,.\s]+$/, '');
  return `${city}, ${m[2].toUpperCase()}${m[3] ? ' ' + m[3] : ''}`;
};

const looksLikeUnit = (part: string) => /^(apt|apartment|unit|suite|ste|lot|#)\b/i.test(part.trim());

export const splitAddress = (raw?: string): string[] => {
  const text = (raw || '').trim();
  if (!text) return [];

  // Already typed on more than one line.
  const typed = text.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  if (typed.length > 1) return typed;

  // Commas: "123 Main St, Clio, MI 48420" (an apartment/unit part stays with the street).
  const parts = text.split(',').map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 2) {
    const streetParts = [parts[0]];
    let i = 1;
    while (i < parts.length - 1 && looksLikeUnit(parts[i])) streetParts.push(parts[i++]);
    const rest = parts.slice(i).join(', ');
    return rest ? [streetParts.join(', '), tidyCityLine(rest)] : [streetParts.join(', ')];
  }

  // No commas: break after the last street word (Rd, St, Ave...) or P.O. Box number,
  // as long as what follows reads like "City ST 12345".
  const suffix = new RegExp(`\\b(?:${SUFFIXES.join('|')})\\b\\.?|\\bbox\\s*\\d+\\b`, 'gi');
  let best = -1;
  for (const m of text.matchAll(suffix)) {
    const end = (m.index ?? 0) + m[0].length;
    const rest = text.slice(end).trim();
    if (rest && CITY_STATE_ZIP.test(rest) && /^[A-Za-z]/.test(rest)) best = end;
  }
  if (best > 0) return [text.slice(0, best).trim(), tidyCityLine(text.slice(best))];

  return [text];
};