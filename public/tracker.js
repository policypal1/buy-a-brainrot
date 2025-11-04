/* public/tracker.js
   Minimal, safe tracker that POSTS to the API project.
   Reads window.TRACK_ENDPOINT so you never hardcode inside this file. */

(function () {
  const ENDPOINT = (typeof window !== 'undefined' && window.TRACK_ENDPOINT) || '';
  if (!ENDPOINT) { console.warn('TRACK_ENDPOINT missing'); return; }

  // Quick health check so you immediately see 404/403 in Network if the URL is wrong
  fetch(ENDPOINT, { method: 'GET', mode: 'cors' }).catch(() => {});

  const CLICK_ID = (crypto.randomUUID && crypto.randomUUID()) ||
                   (Date.now() + "-" + Math.random().toString(36).slice(2));

  function q(s){ try { return matchMedia(s).matches } catch { return null } }
  function gamut(){ if(q("(color-gamut: rec2020)")) return "rec2020";
                    if(q("(color-gamut: p3)")) return "p3";
                    if(q("(color-gamut: srgb)")) return "srgb"; return null; }
  function motion(){ return q("(prefers-reduced-motion: reduce)") ? "reduce" : "no-preference"; }
  function contrast(){ if(q("(prefers-contrast: more)")) return "more";
                      if(q("(prefers-contrast: less)")) return "less"; return "no-preference"; }
  function hdr(){ return q("(dynamic-range: high)") ? "high" : "standard"; }

  async function gpuInfo(){
    const info = { vendor:null, renderer:null, maxTextureSize:null };
    try {
      const gl = document.createElement('canvas').getContext('webgl');
      if (!gl) return info;
      const dbg = gl.getExtension('WEBGL_debug_renderer_info');
      if (dbg) {
        info.vendor   = gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL);
        info.renderer = gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL);
      }
      info.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) || null;
    } catch {}
    return info;
  }

  async function sha256Hex(s){
    try {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
      return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('').slice(0,32);
    } catch { return null; }
  }

  async function send(){
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || null;
    const fpSrc = JSON.stringify({
      ua:navigator.userAgent, platform:navigator.platform, lang:navigator.language,
      langs:navigator.languages, cores:navigator.hardwareConcurrency,
      mem:navigator.deviceMemory, dpr:devicePixelRatio,
      scr:[screen.width,screen.height,screen.colorDepth], tz
    });
    const [fpHash, gpu] = await Promise.all([sha256Hex(fpSrc), gpuInfo()]);

    const payload = {
      path: location.pathname, click_id: CLICK_ID, fpHash,
      language: navigator.language || null,
      languages: (navigator.languages && navigator.languages.slice(0,8)) || null,
      timezone: tz, timezoneOffsetMin: new Date().getTimezoneOffset(),
      extra: {
        platform: navigator.platform || null,
        vendor: navigator.vendor || null,
        cookieEnabled: navigator.cookieEnabled || null,
        doNotTrack: navigator.doNotTrack || null,
        maxTouchPoints: navigator.maxTouchPoints || 0,
        userAgentData: (navigator.userAgentData && {
          mobile: navigator.userAgentData.mobile || false,
          platform: navigator.userAgentData.platform || null,
          brands: (navigator.userAgentData.brands || []).map(b => `${b.brand} ${b.version}`).slice(0,6)
        }) || null
      },
      color: { scheme: matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
               gamut: gamut(), hdr: hdr(), prefersReducedMotion: motion(), prefersContrast: contrast() },
      screen: { w:screen.width, h:screen.height, colorDepth:screen.colorDepth,
                availW:screen.availWidth, availH:screen.availHeight,
                dpr: devicePixelRatio || 1, innerW: innerWidth, innerH: innerHeight },
      hw: { cores: navigator.hardwareConcurrency || null, memoryGB: navigator.deviceMemory || null },
      net: (navigator.connection ? { type: navigator.connection.effectiveType, downlink: navigator.connection.downlink } : null),
      battery: null, gpu
    };

    try {
      await fetch(ENDPOINT, {
        method:'POST', mode:'cors',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify(payload)
      });
    } catch {}
  }

  if (document.readyState === 'complete') send();
  else addEventListener('load', send);
})();
