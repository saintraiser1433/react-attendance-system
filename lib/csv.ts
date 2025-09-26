export function toCSV(rows: Array<Record<string, any>>): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: any) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    if (/[",\n]/.test(s)) return '"' + s.replaceAll('"', '""') + '"';
    return s;
  };
  const lines = [headers.join(",")] as string[];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(","));
  }
  return lines.join("\n");
}


