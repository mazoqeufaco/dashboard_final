// entrada.js — triângulo PNG com clique/arraste + auto-balance + modal Ok/Redefinir
export const DEFAULTS = {
  canvasId: 'tri',
  imgSrc: 'triangulo2.png',
  vertexToChannel: ['B', 'R', 'G'], // [top,left,right] -> B,R,G (Prazo, Custo, Qualidade)
  ui: {
    rSel: '#r', gSel: '#g', bSel: '#b',
    confirmBtnSel: '#confirm',
    confirmDlgSel: '#confirmDlg', confirmDlgTextSel: '#dlgText',
    confirmOkSel: '#dlgOk', confirmResetSel: '#dlgReset'
  }
};

const area = (ax, ay, bx, by, cx, cy) => (bx - ax) * (cy - ay) - (cx - ax) * (by - ay);
function barycentric(px, py, A, B, C) {
  const d = area(A.x, A.y, B.x, B.y, C.x, C.y);
  const w1 = area(px, py, B.x, B.y, C.x, C.y) / d, w2 = area(px, py, C.x, C.y, A.x, A.y) / d, w3 = 1 - w1 - w2; return [w1, w2, w3];
}
const inside = (w, t = 1e-6) => w[0] >= t && w[1] >= t && w[2] >= t;
const norm3p = (r, g, b) => { const s = Math.max(r + g + b, 1e-12); return [r / s * 100, g / s * 100, b / s * 100]; };
const clamp01p = v => Math.max(0, Math.min(100, v));
function baryToRGB([wt, wl, wr], map) {
  const idx = { 'R': 0, 'G': 1, 'B': 2 }, out = [0, 0, 0], w = [wt, wl, wr];
  map.forEach((lab, i) => out[idx[lab]] = w[i]); const s = Math.max(out[0] + out[1] + out[2], 1e-12);
  return [out[0] / s, out[1] / s, out[2] / s];
}
function rgbToBary([r, g, b], map) { const val = { 'R': r, 'G': g, 'B': b }; return [val[map[0]], val[map[1]], val[map[2]]]; }

function detectVerticesByAlpha(img, w, h) {
  const off = document.createElement('canvas'); off.width = w; off.height = h;
  const octx = off.getContext('2d');
  octx.drawImage(img, 0, 0, w, h);

  let data, pts = [], TH = 30;

  try {
    // Tenta obter dados da imagem
    const imageData = octx.getImageData(0, 0, w, h);
    if (!imageData || !imageData.data || imageData.data.length === 0) {
      throw new Error('getImageData retornou dados inválidos');
    }
    data = imageData.data;

    // Verifica se o tamanho dos dados está correto
    const expectedLength = w * h * 4;
    if (data.length !== expectedLength) {
      throw new Error(`Tamanho de dados incorreto: esperado ${expectedLength}, obtido ${data.length}`);
    }

    // Procura em toda a área da imagem
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4 + 3;
        if (idx >= data.length) break;
        const alpha = data[idx];
        if (!isNaN(alpha) && alpha >= TH) pts.push({ x, y });
      }
    }
  } catch (err) {
    // Se getImageData falhar (CORS/tainted canvas no Chrome), usa fallback geométrico
    console.warn('getImageData falhou, usando detecção geométrica:', err.message || err);
    // Retorna vértices baseados na geometria esperada do triângulo
    return { top: { x: Math.floor(w / 2), y: 0 }, left: { x: 0, y: h - 1 }, right: { x: w - 1, y: h - 1 } };
  }

  if (!pts.length) return { top: { x: Math.floor(w / 2), y: 0 }, left: { x: 0, y: h - 1 }, right: { x: w - 1, y: h - 1 } };

  const extreme = (key, min = true, band = 3) => {
    // Fallback seguro se não houver pontos
    const fallback = key === 'y'
      ? { x: Math.floor(w / 2), y: 0 }
      : (min ? { x: 0, y: h - 1 } : { x: w - 1, y: h - 1 });

    if (!pts || pts.length === 0) return fallback;

    // Filtra pontos válidos
    const validPts = pts.filter(p => p && typeof p === 'object' && !isNaN(p[key]) && p[key] !== null && p[key] !== undefined);
    if (validPts.length === 0) return fallback;

    // Encontra o valor extremo
    let ex = validPts[0][key];
    for (let i = 1; i < validPts.length; i++) {
      const val = validPts[i][key];
      if (min ? val < ex : val > ex) ex = val;
    }

    if (isNaN(ex)) return fallback;

    // Filtra pontos próximos ao extremo
    const sel = validPts.filter(p => Math.abs(p[key] - ex) <= band);

    if (sel.length === 0) {
      // Se nenhum ponto na banda, retorna o mais próximo do extremo
      let closest = validPts[0];
      let minDist = Math.abs(closest[key] - ex);
      for (let i = 1; i < validPts.length; i++) {
        const dist = Math.abs(validPts[i][key] - ex);
        if (dist < minDist) {
          minDist = dist;
          closest = validPts[i];
        }
      }
      return closest;
    }

    // Para o topo (y), encontra o ponto mais central em x
    if (key === 'y') {
      let sumX = 0;
      for (let i = 0; i < sel.length; i++) sumX += sel[i].x;
      const cx = sumX / sel.length;
      if (isNaN(cx)) return fallback;

      let closest = sel[0];
      let minDist = Math.abs(closest.x - cx);
      for (let i = 1; i < sel.length; i++) {
        const dist = Math.abs(sel[i].x - cx);
        if (dist < minDist) {
          minDist = dist;
          closest = sel[i];
        }
      }
      return closest;
    }

    // Para esquerda/direita (x), encontra o ponto mais baixo em y
    let lowest = sel[0];
    for (let i = 1; i < sel.length; i++) {
      if (sel[i].y > lowest.y) lowest = sel[i];
    }
    return lowest;
  };

  try {
    return { top: extreme('y', true), left: extreme('x', true), right: extreme('x', false) };
  } catch (err) {
    console.warn('Erro ao detectar vértices, usando fallback geométrico:', err);
    return { top: { x: Math.floor(w / 2), y: 0 }, left: { x: 0, y: h - 1 }, right: { x: w - 1, y: h - 1 } };
  }
}

function drawScene(ctx, canvas, img, rect, point, rgb = [1 / 3, 1 / 3, 1 / 3], vertices = null) {
  // Fundo preto
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Se temos vértices, desenha triângulo colorido dinamicamente
  if (vertices && vertices.top && vertices.left && vertices.right && rgb && rgb.length === 3) {
    const [r, g, b] = rgb;
    const r255 = Math.round(r * 255);
    const g255 = Math.round(g * 255);
    const b255 = Math.round(b * 255);

    const topX = rect.x + vertices.top.x;
    const topY = rect.y + vertices.top.y;
    const leftX = rect.x + vertices.left.x;
    const leftY = rect.y + vertices.left.y;
    const rightX = rect.x + vertices.right.x;
    const rightY = rect.y + vertices.right.y;

    // Cores dos vértices conforme especificado
    // Topo (Prazo): #0d09e8 (rgb(13,9,232))
    // Esquerda (Custo): #f20308 (rgb(242,3,8))
    // Direita (Qualidade): #13e40a (rgb(19,228,10))
    // As pontas SEMPRE têm as cores puras e saturadas
    const topColorFull = '#0d09e8';      // Azul/roxo escuro no topo (prazo) - cor pura
    const leftColorFull = '#f20308';     // Vermelho à esquerda (custo) - cor pura
    const rightColorFull = '#13e40a';   // Verde à direita (qualidade) - cor pura

    ctx.save();

    // Define o caminho do triângulo
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.lineTo(leftX, leftY);
    ctx.lineTo(rightX, rightY);
    ctx.closePath();

    // Clip para limitar o desenho ao triângulo
    ctx.clip();

    // Calcula distâncias para gradientes
    const centerX = (topX + leftX + rightX) / 3;
    const centerY = (topY + leftY + rightY) / 3;
    const maxDist = Math.max(
      Math.sqrt((topX - centerX) ** 2 + (topY - centerY) ** 2),
      Math.sqrt((leftX - centerX) ** 2 + (leftY - centerY) ** 2),
      Math.sqrt((rightX - centerX) ** 2 + (rightY - centerY) ** 2)
    ) * 2.5; // Alcance maior para gradiente mais completo

    // Usa coordenadas baricêntricas para calcular cor de cada pixel
    // Cores dos vértices conforme especificado
    const colorTop = [13, 9, 232];      // #0d09e8 (azul) - Topo
    const colorLeft = [242, 3, 8];     // #f20308 (vermelho) - Esquerda
    const colorRight = [19, 228, 10];   // #13e40a (verde) - Direita

    // Função para calcular cor usando coordenadas baricêntricas
    function barycentricColor(x, y, A, B, C, colorA, colorB, colorC) {
      const denom = ((B.y - C.y) * (A.x - C.x) + (C.x - B.x) * (A.y - C.y));
      if (Math.abs(denom) < 0.0001) return null; // Evita divisão por zero

      const w1 = ((B.y - C.y) * (x - C.x) + (C.x - B.x) * (y - C.y)) / denom;
      const w2 = ((C.y - A.y) * (x - C.x) + (A.x - C.x) * (y - C.y)) / denom;
      const w3 = 1 - w1 - w2;

      // Interpola as cores
      const r = Math.round(w1 * colorA[0] + w2 * colorB[0] + w3 * colorC[0]);
      const g = Math.round(w1 * colorA[1] + w2 * colorB[1] + w3 * colorC[1]);
      const b = Math.round(w1 * colorA[2] + w2 * colorB[2] + w3 * colorC[2]);

      return [r, g, b];
    }

    // Cria imagem de dados
    const imageData = ctx.createImageData(canvas.width, canvas.height);
    const data = imageData.data;

    // Vértices do triângulo
    const A = { x: topX, y: topY };
    const B = { x: leftX, y: leftY };
    const C = { x: rightX, y: rightY };

    // Calcula área do triângulo original para verificação
    const areaOrig = Math.abs(
      A.x * (B.y - C.y) + B.x * (C.y - A.y) + C.x * (A.y - B.y)
    );

    // Para cada pixel, calcula se está dentro do triângulo e sua cor
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const i = (y * canvas.width + x) * 4;

        // Verifica se o pixel está dentro do triângulo usando áreas
        const area1 = Math.abs(
          x * (B.y - C.y) + B.x * (C.y - y) + C.x * (y - B.y)
        );
        const area2 = Math.abs(
          A.x * (y - C.y) + x * (C.y - A.y) + C.x * (A.y - y)
        );
        const area3 = Math.abs(
          A.x * (B.y - y) + B.x * (y - A.y) + x * (A.y - B.y)
        );

        // Se a soma das áreas dos sub-triângulos é igual à área original (com tolerância)
        // Usa tolerância fixa como no exemplo fornecido
        if (Math.abs(area1 + area2 + area3 - areaOrig) < 0.1) {
          // Calcula cor usando coordenadas baricêntricas
          const rgb = barycentricColor(x, y, A, B, C, colorTop, colorLeft, colorRight);
          if (rgb) {
            data[i] = rgb[0];     // R
            data[i + 1] = rgb[1]; // G
            data[i + 2] = rgb[2]; // B
            data[i + 3] = 255;    // A (opaco)
          } else {
            data[i] = 0;
            data[i + 1] = 0;
            data[i + 2] = 0;
            data[i + 3] = 0; // Transparente
          }
        } else {
          // Fora do triângulo - transparente
          data[i] = 0;
          data[i + 1] = 0;
          data[i + 2] = 0;
          data[i + 3] = 0;
        }
      }
    }

    // Desenha a imagem de dados no canvas
    ctx.putImageData(imageData, 0, 0);

    ctx.restore();
  } else {
    // Fallback: desenha apenas a imagem original
    ctx.drawImage(img, rect.x, rect.y, rect.w, rect.h);
  }

  // Desenha o ponto indicador branco
  if (point) {
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(point[0], point[1], 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
}

// Função para redimensionar canvas responsivamente
function resizeCanvas(canvas) {
  const container = canvas.parentElement;
  if (!container) return;

  const containerWidth = container.clientWidth;
  const maxWidth = Math.min(containerWidth - 32, 900); // -32 para padding
  const aspectRatio = 900 / 620; // Proporção original do canvas

  // Calcula altura baseada na largura, respeitando max-height em mobile
  let newWidth = maxWidth;
  let newHeight = newWidth / aspectRatio;

  // Em mobile, limita altura máxima para não ultrapassar a viewport
  if (window.innerWidth <= 768) {
    const maxHeight = window.innerHeight * 0.7; // 70vh
    if (newHeight > maxHeight) {
      newHeight = maxHeight;
      newWidth = newHeight * aspectRatio;
    }
  }

  // Ajusta o tamanho interno do canvas (resolução) - deve ser inteiro
  canvas.width = Math.floor(newWidth);
  canvas.height = Math.floor(newHeight);

  // Ajusta o tamanho de exibição CSS - mantém proporção exata
  canvas.style.width = Math.floor(newWidth) + 'px';
  canvas.style.height = Math.floor(newHeight) + 'px';
  canvas.style.maxWidth = '100%';
  // Usa aspect-ratio CSS para manter proporção mesmo se houver conflitos
  canvas.style.aspectRatio = `${Math.floor(newWidth)} / ${Math.floor(newHeight)}`;
}

export async function initEntrada(opts = {}) {
  const cfg = { ...DEFAULTS, ...opts, ui: { ...DEFAULTS.ui, ...(opts.ui || {}) } };
  const canvas = document.getElementById(cfg.canvasId);

  // Redimensiona canvas inicialmente
  resizeCanvas(canvas);

  const ctx = canvas.getContext('2d');
  const rEl = document.querySelector(cfg.ui.rSel);
  const gEl = document.querySelector(cfg.ui.gSel);
  const bEl = document.querySelector(cfg.ui.bSel);
  const btn = document.querySelector(cfg.ui.confirmBtnSel);
  const dlg = document.querySelector(cfg.ui.confirmDlgSel);
  const dlgText = document.querySelector(cfg.ui.confirmDlgTextSel);
  const dlgOk = document.querySelector(cfg.ui.confirmOkSel);
  const dlgReset = document.querySelector(cfg.ui.confirmResetSel);

  let img = new Image();
  // Tenta carregar com CORS para permitir getImageData no Chrome
  // Se o servidor não suportar CORS, tenta sem CORS (fallback geométrico será usado se getImageData falhar)
  img.crossOrigin = 'anonymous';
  await new Promise((res, rej) => {
    let triedWithoutCors = false;
    img.onload = res;
    img.onerror = (e) => {
      // Se falhar com CORS, tenta sem CORS (para servidores locais sem CORS)
      if (!triedWithoutCors) {
        triedWithoutCors = true;
        img = new Image(); // Nova instância sem CORS
        img.onload = res;
        img.onerror = (e2) => {
          console.error('Erro ao carregar imagem:', cfg.imgSrc, e2);
          rej(e2);
        };
        img.src = cfg.imgSrc;
      } else {
        console.error('Erro ao carregar imagem:', cfg.imgSrc, e);
        rej(e);
      }
    };
    img.src = cfg.imgSrc;
  });

  // Calcula posição e tamanho do triângulo dentro do canvas
  // Usa padding adaptativo baseado no tamanho do canvas
  const padTop = Math.max(20, canvas.height * 0.05);
  const padBottom = Math.max(20, canvas.height * 0.05);
  const padSides = Math.max(20, canvas.width * 0.02);
  const maxW = canvas.width - (padSides * 2);
  const maxH = canvas.height - padTop - padBottom;

  // Força proporção de triângulo equilátero (altura = lado * sqrt(3) / 2)
  const equilateralRatio = Math.sqrt(3) / 2; // ~0.866

  let finalW, finalH;
  // Verifica se o limitante é a largura ou a altura
  if (maxH / maxW > equilateralRatio) {
    // Canvas é mais alto que o necessário, limita pela largura
    finalW = maxW;
    finalH = finalW * equilateralRatio;
  } else {
    // Canvas é mais largo que o necessário, limita pela altura
    finalH = maxH;
    finalW = finalH / equilateralRatio;
  }

  // Aplica uma margem de segurança (75% do tamanho disponível para dar espaço aos labels)
  finalW *= 0.75;
  finalH *= 0.75;

  const w = Math.round(finalW);
  const h = Math.round(finalH);
  const x = Math.floor((canvas.width - w) / 2);
  const y = padTop + Math.floor((canvas.height - padTop - padBottom - h) / 2);

  // Define vértices para um triângulo equilátero perfeito
  const v = {
    top: { x: w / 2, y: 0 },
    left: { x: 0, y: h },
    right: { x: w, y: h }
  };

  console.log('Vértices calculados (Equilátero):', v);
  // Variáveis que serão atualizadas no resize
  let rect = { x, y, w, h };
  let Vtop = { x: x + v.top.x, y: y + v.top.y };
  let Vleft = { x: x + v.left.x, y: y + v.left.y };
  let Vright = { x: x + v.right.x, y: y + v.right.y };

  let rgb = [1 / 3, 1 / 3, 1 / 3]; let dragging = false;

  // Função para recalcular posições quando canvas é redimensionado
  const recalculateTriangle = () => {
    resizeCanvas(canvas);

    // Recalcula posição e tamanho do triângulo
    const padTop = Math.max(20, canvas.height * 0.05);
    const padBottom = Math.max(20, canvas.height * 0.05);
    const padSides = Math.max(20, canvas.width * 0.02);
    const maxW = canvas.width - (padSides * 2);
    const maxH = canvas.height - padTop - padBottom;

    const imgAspect = img.width / img.height;
    const canvasAspect = maxW / maxH;

    let scale;
    if (imgAspect > canvasAspect) {
      scale = (maxW / img.width) * 0.85;
    } else {
      scale = (maxH / img.height) * 0.85;
    }

    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);
    const x = Math.floor((canvas.width - w) / 2);
    const y = padTop + Math.floor((canvas.height - padTop - padBottom - h) / 2);

    rect = { x, y, w, h };

    // Recalcula vértices proporcionalmente
    const scaleX = w / img.width;
    const scaleY = h / img.height;
    const newV = {
      top: { x: Math.floor(v.top.x * scaleX), y: Math.floor(v.top.y * scaleY) },
      left: { x: Math.floor(v.left.x * scaleX), y: Math.floor(v.left.y * scaleY) },
      right: { x: Math.floor(v.right.x * scaleX), y: Math.floor(v.right.y * scaleY) }
    };

    Vtop = { x: x + newV.top.x, y: y + newV.top.y };
    Vleft = { x: x + newV.left.x, y: y + newV.left.y };
    Vright = { x: x + newV.right.x, y: y + newV.right.y };

    // Redesenha
    drawFromRGB();
  };

  const drawFromRGB = () => {
    const [wt, wl, wr] = rgbToBary(rgb, cfg.vertexToChannel);
    const px = wt * Vtop.x + wl * Vleft.x + wr * Vright.x, py = wt * Vtop.y + wl * Vleft.y + wr * Vright.y;
    drawScene(ctx, canvas, img, rect, [px, py], rgb, v);
  };

  // Listener para redimensionamento da janela
  let resizeTimeout;
  const handleResize = () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      recalculateTriangle();
    }, 150);
  };
  window.addEventListener('resize', handleResize);

  // Observa mudanças no DOM que podem afetar o layout (como ranking abrindo)
  const observer = new MutationObserver(() => {
    // Recalcula triângulo quando há mudanças no DOM que podem afetar o layout
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      recalculateTriangle();
    }, 100);
  });

  // Observa mudanças no container do triângulo e elementos próximos
  if (canvas.parentElement) {
    observer.observe(canvas.parentElement, {
      attributes: true,
      attributeFilter: ['style', 'class'],
      childList: false,
      subtree: false
    });
  }

  // Observa mudanças no body que podem indicar ranking abrindo/fechando
  observer.observe(document.body, {
    attributes: false,
    childList: true,
    subtree: false
  });

  function setPerc(r, g, b, draw = true) {
    rEl.value = r.toFixed(2); gEl.value = g.toFixed(2); bEl.value = b.toFixed(2);
    rgb = [r / 100, g / 100, b / 100]; if (draw) drawFromRGB();
  }
  function rebalance(focus, newVal) {
    let r = parseFloat(rEl.value) || 0, g = parseFloat(gEl.value) || 0, b = parseFloat(bEl.value) || 0;
    [r, g, b] = norm3p(r, g, b); newVal = clamp01p(newVal);
    if (focus === 'R') { const rem = g + b, k = rem ? (100 - newVal) / rem : 0.5; g *= k; b *= k; r = newVal; }
    else if (focus === 'G') { const rem = r + b, k = rem ? (100 - newVal) / rem : 0.5; r *= k; b *= k; g = newVal; }
    else { const rem = r + g, k = rem ? (100 - newVal) / rem : 0.5; r *= k; g *= k; b = newVal; }
    const tot = r + g + b; if (Math.abs(tot - 100) > 0.001) {
      if (focus !== 'R') r *= 100 / tot; if (focus !== 'G') g *= 100 / tot; if (focus !== 'B') b *= 100 / tot;
    }
    setPerc(r, g, b);
  }

  ['input', 'change'].forEach(evt => {
    rEl.addEventListener(evt, () => rebalance('R', parseFloat(rEl.value) || 0));
    gEl.addEventListener(evt, () => rebalance('G', parseFloat(gEl.value) || 0));
    bEl.addEventListener(evt, () => rebalance('B', parseFloat(bEl.value) || 0));
  });

  const handlePoint = (mx, my) => {
    const wts = barycentric(mx, my, Vtop, Vleft, Vright);
    if (!inside(wts)) return false;
    const [r, g, b] = baryToRGB(wts, cfg.vertexToChannel);
    setPerc(r * 100, g * 100, b * 100);
    return true;
  };
  // Suporte para mouse e touch
  const getPointFromEvent = (e) => {
    const r = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - r.left,
      y: clientY - r.top
    };
  };

  // Mouse events
  canvas.addEventListener('mousedown', e => {
    const pt = getPointFromEvent(e);
    dragging = handlePoint(pt.x, pt.y);
  });
  canvas.addEventListener('mousemove', e => {
    if (!dragging) return;
    const pt = getPointFromEvent(e);
    handlePoint(pt.x, pt.y);
  });
  window.addEventListener('mouseup', () => { dragging = false; });
  canvas.addEventListener('click', e => {
    const pt = getPointFromEvent(e);
    handlePoint(pt.x, pt.y);
  });

  // Touch events para mobile
  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    const pt = getPointFromEvent(e);
    dragging = handlePoint(pt.x, pt.y);
  });
  canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    if (!dragging) return;
    const pt = getPointFromEvent(e);
    handlePoint(pt.x, pt.y);
  });
  canvas.addEventListener('touchend', e => {
    e.preventDefault();
    dragging = false;
  });
  canvas.addEventListener('touchcancel', e => {
    e.preventDefault();
    dragging = false;
  });

  let onConfirm = null;
  btn.addEventListener('click', () => {
    const [r, g, b] = rgb;
    dlgText.textContent =
      `Suas prioridades de seleção da solução:

${(r * 100).toFixed(2)}% de peso para custo anual,
${(g * 100).toFixed(2)}% de qualidade (aderência a seus requisitos) e
${(b * 100).toFixed(2)}% para prazo.`;
    dlg.showModal();
    const ok = () => { dlg.close(); onConfirm && onConfirm({ r, g, b }); cleanup(); };
    const re = () => { dlg.close(); cleanup(); };
    const cleanup = () => { dlgOk.removeEventListener('click', ok); dlgReset.removeEventListener('click', re); };
    dlgOk.addEventListener('click', ok); dlgReset.addEventListener('click', re);
  });

  setPerc(33.3333, 33.3333, 33.3333); drawFromRGB();
  return { getRGB: () => ({ r: rgb[0], g: rgb[1], b: rgb[2] }), onConfirm: (fn) => { onConfirm = fn; } };
}
