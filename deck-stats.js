/* Statistiche ricavate esclusivamente da beyparts.json. */
window.BeyStats = (() => {
  const keys = ['attack', 'defense', 'stamina'];
  const groups = { Blade: 'blades', 'Full Blade': 'blades', 'Metal Blade': 'blades', 'Over Blade': 'over_blades', 'Assist Blade': 'assist_blades', 'Lock Chip': 'lock_chips', Ratchet: 'ratchets', Bit: 'bits' };
  const normalize = value => String(value ?? '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const names = record => [record.name, record.alias, record.altname].flat().filter(value => typeof value === 'string').map(normalize).filter(Boolean);
  const round = n => Math.round(n * 1e6) / 1e6;
  function create(data) {
    const indexes = new Map();
    for (const [category, group] of Object.entries(groups)) {
      const index = new Map();
      for (const record of Array.isArray(data[group]) ? data[group] : []) {
        for (const key of names(record)) {
          if (!index.has(key)) index.set(key, new Set());
          index.get(key).add(record);
        }
      }
      indexes.set(category, index);
    }
    function options(part) {
      if (!part || !indexes.has(part.category)) return [];
      const index = indexes.get(part.category), matches = new Set();
      for (const alias of [part.id, part.name, ...(part.aliases || []), ...(part.sourceIds || [])]) {
        for (const record of index.get(normalize(alias)) || []) matches.add(record);
      }
      const unique = new Map();
      for (const record of matches) {
        const variants = record.modes?.length ? record.modes : [record];
        for (const variant of variants) {
          const values = Object.fromEntries(keys.map(key => [key, variant[key] ?? record[key]]));
          if (!keys.every(key => typeof values[key] === 'number' && Number.isFinite(values[key]))) continue;
          const id = keys.map(key => values[key]).join('|');
          if (!unique.has(id)) unique.set(id, { id, label: variant.label || record.name, ...values });
        }
      }
      return [...unique.values()];
    }
    function combo(parts, choices = {}) {
      const rows = parts.map(part => {
        const variants = options(part);
        const selected = variants.length === 1 ? variants[0] : variants.find(v => v.id === choices[part?.id]);
        return { part, options: variants, selected: selected || null };
      });
      const count = categories => parts.filter(p => categories.includes(p?.category)).length;
      const complete = count(['Ratchet'])===1 && count(['Bit'])===1 && ((parts.length===3 && count(['Blade','Full Blade'])===1) || (parts.length===5 && count(['Lock Chip'])===1 && count(['Metal Blade','Over Blade'])===1 && count(['Assist Blade'])===1));
      if (!complete || rows.some(row => !row.selected)) return { rows, complete, totals: null, total: null };
      const totals = Object.fromEntries(keys.map(key => [key, round(rows.reduce((sum, row) => sum + row.selected[key], 0))]));
      return { rows, complete, totals, total: round(keys.reduce((sum, key) => sum + totals[key], 0)) };
    }
    return { options, combo };
  }
  return { create };
})();
