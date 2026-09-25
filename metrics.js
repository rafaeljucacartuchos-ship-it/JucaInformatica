(function (root) {
  'use strict';
  const ZONE = 'America/Campo_Grande';
  const dayKey = value => new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONE, year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date(value));
  function periodStart(period, now = new Date()) {
    if (String(period) === 'all') return null;
    const start = new Date(dayKey(now) + 'T00:00:00-04:00');
    start.setUTCDate(start.getUTCDate() - (Number(period) - 1));
    return start.toISOString();
  }
  function isWhatsAppClick(row) {
    // Old events also used this name for opening the on-site bubble.
    return row.event_type === 'whatsapp_click' && /^https:\/\/wa\.me\//i.test(row.details?.href || '');
  }
  function summarize(rows) {
    const views = rows.filter(r => r.event_type === 'page_view');
    const sessions = new Set(views.map(r => r.session_id));
    const clicks = rows.filter(isWhatsAppClick);
    const converted = new Set(clicks.filter(r => sessions.has(r.session_id)).map(r => r.session_id));
    // Version 2 identifies each page view and counts only visible time.
    // Old cumulative wall-clock samples cannot be converted reliably.
    const durations = new Map();
    for (const row of rows) {
      if (row.details?.version !== 2 || !row.details?.view_id) continue;
      const key = row.session_id + ':' + row.details.view_id;
      if (row.event_type === 'page_view') durations.set(key, durations.get(key) || 0);
      if (row.event_type === 'time_active') durations.set(key,
        Math.max(durations.get(key) || 0, Number(row.duration_seconds) || 0));
    }
    const average = durations.size ? Math.round([...durations.values()].reduce((a, b) => a + b, 0) / durations.size) : null;
    return { views, sessions: sessions.size, clicks: clicks.length,
      conversions: converted.size, rate: sessions.size ? Math.round(converted.size / sessions.size * 100) : 0,
      average, measuredViews: durations.size };
  }
  async function fetchEvents(client, period, now = new Date()) {
    const from = periodStart(period, now), until = now.toISOString(), rows = [], size = 1000;
    for (let offset = 0; ; offset += size) {
      let query = client.from('site_events').select('*').lte('occurred_at', until);
      if (from) query = query.gte('occurred_at', from);
      const { data, error } = await query.order('occurred_at', { ascending: false })
        .order('id', { ascending: false }).range(offset, offset + size - 1);
      if (error) throw error;
      rows.push(...(data || []));
      if (!data || data.length < size) return rows;
    }
  }
  const api = { ZONE, dayKey, periodStart, isWhatsAppClick, summarize, fetchEvents };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.JucaMetrics = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
