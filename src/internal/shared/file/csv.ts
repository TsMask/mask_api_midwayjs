type CSVRow = string[];

export function encodeCsv(data: CSVRow[]): Buffer {
  return Buffer.from(
    data
      .map(row =>
        row
          .map(field => {
            const value = String(field ?? '');
            const needsQuotes =
              value === '.' ||
              value.includes(',') ||
              value.includes('"') ||
              value.includes('\r') ||
              value.includes('\n') ||
              value.startsWith(' ');
            return needsQuotes ? `"${value.replace(/"/g, '""')}"` : value;
          })
          .join(',')
      )
      .join('\n') + (data.length > 0 ? '\n' : '')
  );
}

export function parseCsv(content: string): CSVRow[] {
  const rows: CSVRow[] = [];
  let row: CSVRow = [];
  let field = '';
  let quoted = false;
  let fieldStarted = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (quoted) {
      if (char === '"') {
        if (content[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"' && !fieldStarted) {
      quoted = true;
      fieldStarted = true;
      continue;
    }

    if (char === ',') {
      row.push(field);
      field = '';
      fieldStarted = false;
      continue;
    }

    if (char === '\n' || char === '\r') {
      if (char === '\r' && content[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      fieldStarted = false;
      continue;
    }

    field += char;
    fieldStarted = true;
  }

  if (quoted) {
    throw new Error('extraneous or missing " in quoted-field');
  }
  if (fieldStarted || field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

export function csvReadAll(content: string): Record<string, string>[] {
  const rows = parseCsv(content);
  if (rows.length === 0) return [];

  const header = rows[0].map(name => name.trim().toLowerCase());
  return rows.slice(1).map(row => {
    const record: Record<string, string> = {};
    header.forEach((name, index) => {
      if (name) record[name] = row[index] ?? '';
    });
    return record;
  });
}
