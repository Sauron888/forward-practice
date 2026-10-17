'use strict';
/*
 * Forward: ตัวกลางเรียก Gemini เพื่อคิดข้อสอบใหม่
 *
 * Environment Variables ที่ต้องตั้งใน Vercel
 *   GEMINI_API_KEY   (จำเป็น)  API key จาก Google AI Studio
 *   GEMINI_MODEL     (ไม่บังคับ) ค่าเริ่มต้น gemini-3.8-flash
 *   RATE_LIMIT       (ไม่บังคับ) จำนวนครั้งต่อ IP ต่อ 10 นาที ค่าเริ่มต้น 12
 *
 * หน้าเว็บส่งแค่ { subj, n, avoid } เท่านั้น คำสั่ง (prompt) สร้างที่ฝั่งเซิร์ฟเวอร์
 * เพื่อไม่ให้ใครนำ endpoint นี้ไปใช้กับงานอื่น
 */

const SUBJECTS = ['quant', 'qual', 'eng'];

const BASE = {
  quant:
    'สร้างโจทย์วิเคราะห์เชิงปริมาณทางธุรกิจ ระดับมัธยมปลาย ต้องคิดคำนวณด้วยมือได้ ใช้ตัวเลขกลมๆ มีคำตอบเดียวที่ถูกต้อง ให้คำนวณซ้ำสองรอบก่อนเลือกคำตอบ ห้ามต้องใช้รูปภาพประกอบ ถ้ามีตารางให้เขียนเป็นข้อความในโจทย์',
  qual:
    'สร้างโจทย์วิเคราะห์เชิงคุณภาพทางธุรกิจ โดยเขียนข้อความสั้นแนวข่าวธุรกิจหรือเศรษฐกิจ 90-140 คำ (เป็นสถานการณ์สมมติ ห้ามอ้างบริษัทหรือบุคคลจริง) ใส่ในช่อง ctx แล้วถามเรื่องการจับใจความ เชื่อมโยงข้อมูล หรือแยกข้อเท็จจริงกับความคิดเห็น ถ้าสร้างหลายข้อจากข้อความเดียว ให้ ctx เหมือนกันทุกตัวอักษร',
  eng:
    'Create Business English Communication items: business vocabulary in context, or a short business email or article excerpt (60-120 words, put it in "ctx") followed by comprehension questions. The stem and choices must be in English. The "why" explanations must be in Thai. If several items share one passage, repeat the identical ctx.'
};

const SCHEMA = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          skill: { type: 'string' },
          level: { type: 'integer' },
          ctx: { type: 'string' },
          stem: { type: 'string' },
          choices: { type: 'array', items: { type: 'string' } },
          ans: { type: 'integer' },
          why: { type: 'array', items: { type: 'string' } }
        },
        required: ['skill', 'level', 'ctx', 'stem', 'choices', 'ans', 'why']
      }
    }
  },
  required: ['items']
};

const LVT = { '1': 'ระดับง่าย', '2': 'ระดับปานกลาง', '3': 'ระดับยาก เทียบข้อสอบวัดความสามารถจริงที่ต้องคิดหลายขั้นตอน มีตัวเลือกลวงที่น่าสับสน', mix: 'ผสมหลายระดับ เน้นข้อยาก (ราวครึ่งหนึ่ง) ที่ต้องคิดหลายขั้นตอน' };
function buildPrompt(subj, n, avoid, lv) {
  const av = avoid.length ? 'หลีกเลี่ยงโจทย์ที่คล้ายกับรายการนี้:\n' + avoid.map((s) => '- ' + s).join('\n') + '\n' : '';
  return `${BASE[subj]}

จำนวน ${n} ข้อ ${LVT[lv] || ''} แต่ละข้อมี 4 ตัวเลือก มีข้อถูกเพียงข้อเดียว ตัวเลือกยาวใกล้เคียงกัน ห้ามใช้ "ทุกข้อ" หรือ "ไม่มีข้อใดถูก" ห้ามให้คำถามมีข้อมูลชี้นำคำตอบ
ในช่อง why ให้เขียนภาษาไทยอธิบายตัวเลือกแต่ละข้อตามลำดับเดียวกับ choices ข้อถูกขึ้นต้นด้วย "ถูกต้อง" ข้อผิดขึ้นต้นด้วย "ผิด" พร้อมเหตุผล
${av}ตอบเป็น JSON object เท่านั้น รูปแบบ {"items":[...]} แต่ละรายการมีฟิลด์: skill (ชื่อทักษะภาษาไทยสั้นๆ), level (1 ง่าย 2 ปานกลาง 3 ยาก), ctx (ข้อความประกอบ หรือ ""), stem, choices (array 4 ข้อ), ans (ดัชนี 0-3 ของข้อถูก), why (array 4 ข้อความ)`;
}

/* ---------- จำกัดจำนวนครั้งต่อ IP (ทำงานได้ดีที่สุดในแต่ละอินสแตนซ์ ไม่ใช่การรับประกันเด็ดขาด) ---------- */
const hits = new Map();
function limited(ip) {
  const now = Date.now();
  const win = 10 * 60 * 1000;
  const max = Number(process.env.RATE_LIMIT) || 12;
  const recent = (hits.get(ip) || []).filter((t) => now - t < win);
  if (recent.length >= max) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 500) {
    for (const [k, v] of hits) if (!v.some((t) => now - t < win)) hits.delete(k);
  }
  return false;
}

/* ---------- อ่านข้อความจากคำตอบของ Gemini (รองรับหลายรูปแบบ) ---------- */
function pickText(o) {
  if (!o || typeof o !== 'object') return '';
  if (typeof o.output_text === 'string' && o.output_text) return o.output_text;
  const found = [];
  (function walk(x) {
    if (Array.isArray(x)) x.forEach(walk);
    else if (x && typeof x === 'object') {
      for (const [k, v] of Object.entries(x)) {
        if (k === 'text' && typeof v === 'string') found.push(v);
        else walk(v);
      }
    }
  })(o);
  return found.length ? found[found.length - 1] : '';
}

function parseJson(text) {
  if (typeof text !== 'string') return null;
  const t = text.replace(/^\s*```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
  try {
    return JSON.parse(t);
  } catch (e) {
    const a = t.search(/[\[{]/);
    const b = Math.max(t.lastIndexOf(']'), t.lastIndexOf('}'));
    if (a >= 0 && b > a) {
      try {
        return JSON.parse(t.slice(a, b + 1));
      } catch (e2) {
        return null;
      }
    }
    return null;
  }
}

function toItems(parsed) {
  if (Array.isArray(parsed)) return parsed;
  if (parsed && Array.isArray(parsed.items)) return parsed.items;
  return null;
}

/* ---------- เรียก Gemini ---------- */
const HOST = 'https://generativelanguage.googleapis.com/v1beta';

function viaInteractions(prompt, key, model, signal) {
  return fetch(`${HOST}/interactions`, {
    method: 'POST',
    headers: { 'x-goog-api-key': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      input: prompt,
      response_format: { type: 'text', mime_type: 'application/json', schema: SCHEMA }
    }),
    signal
  });
}

function viaGenerateContent(prompt, key, model, signal) {
  return fetch(`${HOST}/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: { 'x-goog-api-key': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.9 }
    }),
    signal
  });
}

async function attempt(fn, prompt, key, model, signal) {
  const r = await fn(prompt, key, model, signal);
  if (!r.ok) {
    let snippet = '';
    try {
      snippet = (await r.text()).slice(0, 300);
    } catch (e) {}
    console.error('Gemini error', fn.name, r.status, snippet);
    return { status: r.status, items: null };
  }
  let data = null;
  try {
    data = await r.json();
  } catch (e) {}
  const items = toItems(parseJson(pickText(data)));
  if (!items) console.error('Gemini returned no usable JSON via', fn.name);
  return { status: 200, items };
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const key = process.env.GEMINI_API_KEY;

  if (req.method === 'GET') return res.status(200).json({ configured: Boolean(key) });
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  if (!key) return res.status(503).json({ error: 'not_configured' });

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      body = {};
    }
  }
  body = body || {};
  const subj = body.subj;
  const n = Number(body.n);
  if (!SUBJECTS.includes(subj) || !Number.isInteger(n) || n < 1 || n > 5) {
    return res.status(400).json({ error: 'bad_request' });
  }
  const avoid = (Array.isArray(body.avoid) ? body.avoid : [])
    .slice(0, 8)
    .map((s) => String(s).replace(/\s+/g, ' ').slice(0, 80));

  const lv = ['1', '2', '3', 'mix'].includes(String(body.lv)) ? String(body.lv) : 'mix';
  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  if (limited(ip)) return res.status(429).json({ error: 'rate_limited' });

  const model = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
  const prompt = buildPrompt(subj, n, avoid, lv);
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 55000);

  try {
    let out = await attempt(viaInteractions, prompt, key, model, ctl.signal);
    if (!out.items && out.status !== 429 && out.status !== 401 && out.status !== 403) {
      out = await attempt(viaGenerateContent, prompt, key, model, ctl.signal);
    }
    if (out.items) return res.status(200).json({ items: out.items.slice(0, n + 2) });
    if (out.status === 429) return res.status(429).json({ error: 'quota' });
    return res.status(502).json({ error: 'upstream', status: out.status });
  } catch (e) {
    console.error('Gemini call failed', e && e.name);
    return res.status(502).json({ error: 'upstream' });
  } finally {
    clearTimeout(timer);
  }
};
