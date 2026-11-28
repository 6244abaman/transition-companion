/* pdf-maker.js — a small, private PDF writer that runs entirely on the device (27 Nov 2026).
   - Real text PDF (selectable, searchable, ATS-friendly): TrueType font embedded as CID font + ToUnicode map.
   - Hebrew and English on the same page with a simple, dependable bidi (RTL/LTR runs).
   - No network, no upload: the file is built in memory and downloaded.
   Font: "Momentum Sans" — a Hebrew+Latin subset of Liberation Sans (SIL OFL 1.1, see momentum-sans-OFL.txt). */
(function () {
  'use strict';
  const FONT_FILES = {regular: './momentum-sans-regular.ttf', bold: './momentum-sans-bold.ttf'};
  const fontCache = {};

  /* ---------- TrueType parsing (only what we need) ---------- */
  function parseTTF(buf) {
    const dv = new DataView(buf);
    const numTables = dv.getUint16(4);
    const tables = {};
    for (let i = 0; i < numTables; i++) {
      const o = 12 + i * 16;
      const tag = String.fromCharCode(dv.getUint8(o), dv.getUint8(o + 1), dv.getUint8(o + 2), dv.getUint8(o + 3));
      tables[tag] = {offset: dv.getUint32(o + 8), length: dv.getUint32(o + 12)};
    }
    const head = tables.head.offset, hhea = tables.hhea.offset, maxp = tables.maxp.offset;
    const unitsPerEm = dv.getUint16(head + 18);
    const bbox = [dv.getInt16(head + 36), dv.getInt16(head + 38), dv.getInt16(head + 40), dv.getInt16(head + 42)];
    const ascent = dv.getInt16(hhea + 4), descent = dv.getInt16(hhea + 6);
    const numHM = dv.getUint16(hhea + 34), numGlyphs = dv.getUint16(maxp + 4);
    const adv = new Uint16Array(numGlyphs);
    const hm = tables.hmtx.offset;
    let last = 0;
    for (let g = 0; g < numGlyphs; g++) { if (g < numHM) last = dv.getUint16(hm + g * 4); adv[g] = last; }
    // cmap: prefer (3,1) format 4
    const cm = tables.cmap.offset, n = dv.getUint16(cm + 2);
    let sub = null;
    for (let i = 0; i < n; i++) {
      const pid = dv.getUint16(cm + 4 + i * 8), eid = dv.getUint16(cm + 6 + i * 8), off = dv.getUint32(cm + 8 + i * 8);
      if (pid === 3 && eid === 1) sub = cm + off;
    }
    const map = new Map();
    if (sub !== null && dv.getUint16(sub) === 4) {
      const segX2 = dv.getUint16(sub + 6), segs = segX2 / 2;
      const ends = sub + 14, starts = ends + segX2 + 2, deltas = starts + segX2, ranges = deltas + segX2;
      for (let s = 0; s < segs; s++) {
        const end = dv.getUint16(ends + s * 2), start = dv.getUint16(starts + s * 2);
        const delta = dv.getInt16(deltas + s * 2), ro = dv.getUint16(ranges + s * 2);
        for (let c = start; c <= end && c !== 0xFFFF; c++) {
          let g;
          if (ro === 0) g = (c + delta) & 0xFFFF;
          else { const p = ranges + s * 2 + ro + (c - start) * 2; g = dv.getUint16(p); if (g) g = (g + delta) & 0xFFFF; }
          if (g) map.set(c, g);
        }
      }
    }
    let capHeight = Math.round(ascent * 0.7);
    if (tables['OS/2'] && tables['OS/2'].length > 90) { const v = dv.getInt16(tables['OS/2'].offset + 88); if (v > 0) capHeight = v; }
    return {buf, unitsPerEm, bbox, ascent, descent, adv, map, capHeight};
  }

  async function loadFont(kind) {
    if (fontCache[kind]) return fontCache[kind];
    const res = await fetch(FONT_FILES[kind]);
    if (!res.ok) throw new Error('font');
    fontCache[kind] = parseTTF(await res.arrayBuffer());
    return fontCache[kind];
  }

  /* ---------- bidi (simple, predictable) ---------- */
  const isR = c => (c >= 0x0590 && c <= 0x05FF) || (c >= 0xFB1D && c <= 0xFB4F);
  const isL = c => (c >= 0x30 && c <= 0x39) || (c >= 0x41 && c <= 0x5A) || (c >= 0x61 && c <= 0x7A) || (c >= 0xC0 && c <= 0xFF) || c === 0x40;
  const MIRROR = {'(': ')', ')': '(', '[': ']', ']': '[', '{': '}', '}': '{', '<': '>', '>': '<', '«': '»', '»': '«'};
  function hasHebrew(s) { for (const ch of s) if (isR(ch.codePointAt(0))) return true; return false; }
  function visual(text, rtl) {
    const chars = Array.from(text);
    const t = chars.map(ch => { const c = ch.codePointAt(0); return isR(c) ? 'R' : isL(c) ? 'L' : 'N'; });
    // numbers glue: ".,:/-" between digits/latin stay L
    for (let i = 1; i < t.length - 1; i++) if (t[i] === 'N' && t[i - 1] === 'L' && t[i + 1] === 'L' && /[.,:\/\-'%]/.test(chars[i])) t[i] = 'L';
    // resolve neutrals: same strong on both sides → that, else paragraph direction
    const base = rtl ? 'R' : 'L';
    for (let i = 0; i < t.length; i++) {
      if (t[i] !== 'N') continue;
      let j = i; while (j < t.length && t[j] === 'N') j++;
      const before = i > 0 ? t[i - 1] : base, after = j < t.length ? t[j] : base;
      const v = before === after ? before : base;
      for (let k = i; k < j; k++) t[k] = v;
      i = j - 1;
    }
    const runs = [];
    for (let i = 0; i < chars.length; i++) {
      if (!runs.length || runs[runs.length - 1].d !== t[i]) runs.push({d: t[i], s: []});
      runs[runs.length - 1].s.push(chars[i]);
    }
    const parts = runs.map(r => r.d === 'R' ? r.s.reverse().map(ch => MIRROR[ch] || ch).join('') : r.s.join(''));
    return (rtl ? parts.reverse() : parts).join('');
  }

  /* ---------- PDF document ---------- */
  const A4 = [595.28, 841.89];
  const hex4 = n => n.toString(16).padStart(4, '0').toUpperCase();
  const utf16hex = s => 'FEFF' + Array.from(s).map(ch => { const c = ch.codePointAt(0); if (c > 0xFFFF) { const v = c - 0x10000; return hex4(0xD800 + (v >> 10)) + hex4(0xDC00 + (v & 0x3FF)); } return hex4(c); }).join('');
  const rgb = hexc => { const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hexc || '#000000'); return m ? [1, 2, 3].map(i => (parseInt(m[i], 16) / 255).toFixed(3)).join(' ') : '0 0 0'; };

  function create(opts) {
    opts = opts || {};
    const rtl = opts.dir === 'rtl';
    const margin = opts.margin || 50;
    const fonts = {};
    const used = {regular: new Map(), bold: new Map()};
    const pages = [];
    let cur = null, y = 0;
    const W = A4[0], H = A4[1];

    function newPage() { cur = []; pages.push(cur); y = H - margin; return api; }
    function width(str, size, kind) {
      const f = fonts[kind]; let w = 0;
      for (const ch of str) { const g = f.map.get(ch.codePointAt(0)) || 0; w += f.adv[g]; }
      return w * size / f.unitsPerEm;
    }
    function encode(str, kind) {
      const f = fonts[kind]; let out = '';
      for (const ch of str) {
        const c = ch.codePointAt(0); const g = f.map.get(c) || 0;
        if (g) used[kind].set(g, c);
        out += hex4(g);
      }
      return out;
    }
    // draw one already-wrapped logical line
    function drawLine(line, o) {
      const size = o.size || 11, kind = o.bold ? 'bold' : 'regular';
      const lineRtl = o.dir ? o.dir === 'rtl' : (rtl || hasHebrew(line)) && hasHebrew(line) || rtl;
      const vis = visual(line, lineRtl);
      const w = width(vis, size, kind);
      const left = o.x !== undefined ? o.x : margin, right = o.right !== undefined ? o.right : W - margin;
      let x;
      const align = o.align || (lineRtl ? 'right' : 'left');
      if (align === 'right') x = right - w; else if (align === 'center') x = (left + right - w) / 2; else x = left;
      cur.push('BT /' + (kind === 'bold' ? 'F2' : 'F1') + ' ' + size + ' Tf ' + rgb(o.color) + ' rg ' + x.toFixed(2) + ' ' + o.y.toFixed(2) + ' Td <' + encode(vis, kind) + '> Tj ET');
      return w;
    }
    function wrap(text, size, kind, maxW) {
      const out = [];
      String(text).split('\n').forEach(par => {
        const words = par.split(/(\s+)/).filter(x => x.length);
        let line = '';
        words.forEach(wd => {
          const test = line + wd;
          if (line && width(test.trim(), size, kind) > maxW) { out.push(line.trim()); line = wd.trimStart(); }
          else line = test;
        });
        out.push(line.trim());
      });
      return out;
    }
    function ensure(h) { if (y - h < margin) newPage(); }

    const api = {
      W, H, margin,
      async ready() { fonts.regular = await loadFont('regular'); fonts.bold = await loadFont('bold'); newPage(); return api; },
      get y() { return y; }, set y(v) { y = v; },
      get pageCount() { return pages.length; },
      newPage,
      width: (s, size, bold) => width(s, size || 11, bold ? 'bold' : 'regular'),
      // paragraph with wrapping and page breaks; returns height used
      text(str, o) {
        o = o || {}; if (str === null || str === undefined || str === '') return 0;
        const size = o.size || 11, lh = (o.lineHeight || 1.45) * size, kind = o.bold ? 'bold' : 'regular';
        const ind = o.indent || 0, irtl = o.dir ? o.dir === 'rtl' : rtl;
        const left = (o.x !== undefined ? o.x : margin) + (irtl ? 0 : ind), right = (o.right !== undefined ? o.right : W - margin) - (irtl ? ind : 0);
        const lines = wrap(String(str), size, kind, right - left);
        lines.forEach(line => { ensure(lh); y -= size; drawLine(line, {...o, y, x: left, right}); y -= lh - size; });
        return lines.length * lh;
      },
      bullet(str, o) {
        o = o || {}; const size = o.size || 11, indent = o.indent || 14;
        const dirRtl = o.dir ? o.dir === 'rtl' : rtl;
        const left = margin + (dirRtl ? 0 : indent), right = W - margin - (dirRtl ? indent : 0);
        ensure(size * 1.5);
        const top = y;
        api.text(str, {...o, x: left, right});
        const by = top - size * 0.72;
        const bx = dirRtl ? W - margin - indent / 2 - 1.6 : margin + indent / 2 - 1.6;
        cur.push(rgb(o.dotColor || o.color) + ' rg ' + bx.toFixed(2) + ' ' + by.toFixed(2) + ' 3.2 3.2 re f');
      },
      keep(h) { ensure(h); },
      heading(str, o) {
        o = o || {}; const size = o.size || 12.5;
        ensure(size * 2.2); y -= size;
        const dirRtl = o.dir ? o.dir === 'rtl' : rtl;
        const sq = 6.5, gapX = 7;
        const right = W - margin, left = margin;
        if (o.marker) cur.push(rgb(o.marker) + ' rg ' + (dirRtl ? right - sq : left).toFixed(2) + ' ' + (y + 1).toFixed(2) + ' ' + sq + ' ' + sq + ' re f');
        drawLine(str, {...o, bold: true, y, x: dirRtl ? left : left + sq + gapX, right: dirRtl ? right - sq - gapX : right});
        y -= size * 0.45;
      },
      twoSided(a, b, o) {
        o = o || {}; const size = o.size || 11;
        ensure(size * 1.6); y -= size;
        const dirRtl = o.dir ? o.dir === 'rtl' : rtl;
        drawLine(a, {...o, y, align: dirRtl ? 'right' : 'left'});
        if (b) drawLine(b, {...o, bold: false, color: o.color2 || o.color, y, size: size - 1, align: dirRtl ? 'left' : 'right'});
        y -= size * 0.5;
      },
      rule(o) { o = o || {}; ensure(10); y -= (o.gap || 6); cur.push(rgb(o.color || '#CCCCCC') + ' RG ' + (o.width || 0.8) + ' w ' + margin + ' ' + y.toFixed(2) + ' m ' + (W - margin) + ' ' + y.toFixed(2) + ' l S'); y -= (o.gap || 6); },
      space(h) { y -= h; if (y < margin) newPage(); },
      rect(x, yy, w, h, color) { cur.push(rgb(color) + ' rg ' + x + ' ' + yy + ' ' + w + ' ' + h + ' re f'); },
      // Build the file
      build() {
        const enc = new TextEncoder();
        const chunks = []; const offsets = []; let pos = 0;
        const push = data => { const b = typeof data === 'string' ? enc.encode(data) : data; chunks.push(b); pos += b.length; };
        const objs = [];
        const add = body => { objs.push(body); return objs.length; };
        // fonts
        const fontObj = kind => {
          const f = fonts[kind];
          const k = 1000 / f.unitsPerEm;
          const fileId = add({stream: new Uint8Array(f.buf), dict: '/Length1 ' + f.buf.byteLength});
          const desc = add('<< /Type /FontDescriptor /FontName /MomentumSans-' + (kind === 'bold' ? 'Bold' : 'Regular') + ' /Flags 32 /FontBBox [' + f.bbox.map(v => Math.round(v * k)).join(' ') + '] /ItalicAngle 0 /Ascent ' + Math.round(f.ascent * k) + ' /Descent ' + Math.round(f.descent * k) + ' /CapHeight ' + Math.round(f.capHeight * k) + ' /StemV ' + (kind === 'bold' ? 120 : 80) + ' /FontFile2 ' + fileId + ' 0 R >>');
          const gids = [...used[kind].keys()].sort((a, b) => a - b);
          const wArr = gids.map(g => g + ' [' + Math.round(f.adv[g] * k) + ']').join(' ');
          const cid = add('<< /Type /Font /Subtype /CIDFontType2 /BaseFont /MomentumSans-' + (kind === 'bold' ? 'Bold' : 'Regular') + ' /CIDSystemInfo << /Registry (Adobe) /Ordering (Identity) /Supplement 0 >> /FontDescriptor ' + desc + ' 0 R /DW ' + Math.round(f.adv[0] * k) + ' /W [' + wArr + '] /CIDToGIDMap /Identity >>');
          let cmap = '/CIDInit /ProcSet findresource begin\n12 dict begin\nbegincmap\n/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def\n/CMapName /Adobe-Identity-UCS def\n/CMapType 2 def\n1 begincodespacerange\n<0000> <FFFF>\nendcodespacerange\n';
          for (let i = 0; i < gids.length; i += 100) {
            const part = gids.slice(i, i + 100);
            cmap += part.length + ' beginbfchar\n' + part.map(g => '<' + hex4(g) + '> <' + utf16hex(String.fromCodePoint(used[kind].get(g))).slice(4) + '>').join('\n') + '\nendbfchar\n';
          }
          cmap += 'endcmap\nCMapName currentdict /CMap defineresource pop\nend\nend';
          const tu = add({stream: enc.encode(cmap), dict: ''});
          return add('<< /Type /Font /Subtype /Type0 /BaseFont /MomentumSans-' + (kind === 'bold' ? 'Bold' : 'Regular') + ' /Encoding /Identity-H /DescendantFonts [' + cid + ' 0 R] /ToUnicode ' + tu + ' 0 R >>');
        };
        const f1 = fontObj('regular'), f2 = fontObj('bold');
        const pagesId = objs.length + 1 + pages.length * 2 + 0; // computed after pages are added
        const pageIds = [];
        const resources = '<< /Font << /F1 ' + f1 + ' 0 R /F2 ' + f2 + ' 0 R >> >>';
        const pagesRef = objs.length + pages.length * 2 + 1;
        pages.forEach(ops => {
          const content = add({stream: enc.encode(ops.join('\n')), dict: ''});
          pageIds.push(add('<< /Type /Page /Parent ' + pagesRef + ' 0 R /MediaBox [0 0 ' + W + ' ' + H + '] /Resources ' + resources + ' /Contents ' + content + ' 0 R >>'));
        });
        const pagesObj = add('<< /Type /Pages /Kids [' + pageIds.map(i => i + ' 0 R').join(' ') + '] /Count ' + pageIds.length + ' >>');
        if (pagesObj !== pagesRef) throw new Error('pdf structure');
        const info = add('<< /Title <' + utf16hex(opts.title || 'Document') + '> /Producer (Momentum Companion) /CreationDate (D:' + new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14) + 'Z) >>');
        const catalog = add('<< /Type /Catalog /Pages ' + pagesObj + ' 0 R /Lang (' + (opts.lang || (rtl ? 'he' : 'en')) + ') /ViewerPreferences << /Direction /' + (rtl ? 'R2L' : 'L2R') + ' /DisplayDocTitle true >> >>');
        void pagesId;
        push('%PDF-1.7\n%\xE2\xE3\xCF\xD3\n'.replace(/[\x80-\xFF]/g, '')); push(new Uint8Array([0x25, 0xE2, 0xE3, 0xCF, 0xD3, 0x0A]));
        objs.forEach((o, i) => {
          offsets[i] = pos;
          if (typeof o === 'string') push((i + 1) + ' 0 obj\n' + o + '\nendobj\n');
          else { push((i + 1) + ' 0 obj\n<< /Length ' + o.stream.length + (o.dict ? ' ' + o.dict : '') + ' >>\nstream\n'); push(o.stream); push('\nendstream\nendobj\n'); }
        });
        const xref = pos;
        let x = 'xref\n0 ' + (objs.length + 1) + '\n0000000000 65535 f \n';
        offsets.forEach(o => { x += String(o).padStart(10, '0') + ' 00000 n \n'; });
        push(x + 'trailer\n<< /Size ' + (objs.length + 1) + ' /Root ' + catalog + ' 0 R /Info ' + info + ' 0 R >>\nstartxref\n' + xref + '\n%%EOF\n');
        const out = new Uint8Array(pos); let p = 0; chunks.forEach(c => { out.set(c, p); p += c.length; });
        return new Blob([out], {type: 'application/pdf'});
      },
      download(filename) {
        const blob = api.build();
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob); a.download = filename || 'document.pdf';
        document.body.appendChild(a); a.click();
        setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
        return blob;
      }
    };
    return api;
  }

  window.MomentumPDF = {create, visual, hasHebrew};
})();
