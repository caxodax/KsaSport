const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { execSync } = require('child_process');

const FFMPEG_BIN = path.resolve(__dirname, '../node_modules/ffmpeg-static/ffmpeg');
const TMP_DIR = '/tmp/ksasport_video';
const FRAMES_DIR = path.join(TMP_DIR, 'frames');
const AUDIO_PATH = path.join(TMP_DIR, 'soundtrack.wav');
const PUBLIC_OUTPUT = path.resolve(__dirname, '../public/videos/ksasport_showcase_foxbyte.mp4');
const ARTIFACT_OUTPUT = '/home/lmontes/.gemini/antigravity/brain/8cfe3dff-8b28-4e25-ad73-1c176fb8a8bd/ksasport_showcase_foxbyte.mp4';

const WIDTH = 720;
const HEIGHT = 1280;
const FPS = 25;
const DURATION_SEC = 20;
const TOTAL_FRAMES = FPS * DURATION_SEC; // 500 frames

fs.mkdirSync(FRAMES_DIR, { recursive: true });

// ==========================================
// 1. CARGA Y PREPARACIÓN DE ASSETS
// ==========================================
async function prepareAssets() {
  console.log('[Assets] Verificando y optimizando imágenes...');

  // 1. Avatar PNG
  const avatarPath = path.join(TMP_DIR, 'avatar.png');
  if (!fs.existsSync(avatarPath)) {
    await sharp(path.join(TMP_DIR, 'avatar.webp')).png().toFile(avatarPath);
  }

  // 2. Fox Byte Logo transparente en paleta oficial naranja
  const foxbyteTransparentPath = path.join(TMP_DIR, 'foxbyte_transparent.png');
  if (!fs.existsSync(foxbyteTransparentPath)) {
    const rawFox = await sharp('/home/lmontes/Documentos/Foxbyte.png')
      .resize(260, 260)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    for (let i = 0; i < rawFox.data.length; i += 4) {
      const r = rawFox.data[i], g = rawFox.data[i + 1], b = rawFox.data[i + 2];
      const maxVal = Math.max(r, g, b);
      if (maxVal < 18) {
        rawFox.data[i + 3] = 0;
      } else if (maxVal < 42) {
        rawFox.data[i + 3] = Math.floor(((maxVal - 18) / 24) * 255);
      }
    }
    await sharp(rawFox.data, { raw: { width: rawFox.info.width, height: rawFox.info.height, channels: 4 } })
      .png()
      .toFile(foxbyteTransparentPath);
  }

  return {
    avatarB64: fs.readFileSync(avatarPath).toString('base64'),
    teamB64: fs.readFileSync(path.join(TMP_DIR, 'team.png')).toString('base64'),
    logoB64: fs.readFileSync(path.resolve(__dirname, '../public/icon.png')).toString('base64'),
    foxbyteB64: fs.readFileSync(foxbyteTransparentPath).toString('base64'),
  };
}

// ==========================================
// 2. SÍNTESIS DE AUDIO DE ALTA FIDELIDAD (TECH-HOUSE / CYBERPUNK)
// ==========================================
function generateAudio() {
  console.log('[Audio] Sintetizando banda sonora electrónica de alta fidelidad y efectos SFX...');
  const sampleRate = 44100;
  const numChannels = 2;
  const bytesPerSample = 2;
  const numSamples = sampleRate * DURATION_SEC;
  const dataSize = numSamples * numChannels * bytesPerSample;
  const wavBuf = Buffer.alloc(44 + dataSize);

  // Encabezado WAV
  wavBuf.write('RIFF', 0);
  wavBuf.writeUInt32LE(36 + dataSize, 4);
  wavBuf.write('WAVE', 8);
  wavBuf.write('fmt ', 12);
  wavBuf.writeUInt32LE(16, 16);
  wavBuf.writeUInt16LE(1, 20); // PCM
  wavBuf.writeUInt16LE(numChannels, 22);
  wavBuf.writeUInt32LE(sampleRate, 24);
  wavBuf.writeUInt32LE(sampleRate * numChannels * bytesPerSample, 28);
  wavBuf.writeUInt16LE(numChannels * bytesPerSample, 32);
  wavBuf.writeUInt16LE(16, 34);
  wavBuf.write('data', 36);
  wavBuf.writeUInt32LE(dataSize, 40);

  const bpm = 126;
  const beatSec = 60 / bpm; // ~0.476s
  const sixteenth = beatSec / 4; // ~0.119s

  let kickPhase = 0;
  let bassPhase1 = 0;
  let bassPhase2 = 0;
  let arpPhase = 0;
  let noiseState = 0;

  // Acordes modernos (D minor tech-house): Dm9 -> Bbmaj7 -> Gm7 -> C7
  const chords = [
    [146.83, 174.61, 220.00, 261.63, 329.63], // Dm9
    [116.54, 146.83, 174.61, 220.00, 261.63], // Bbmaj7
    [97.99,  116.54, 146.83, 174.61, 220.00], // Gm7
    [130.81, 164.81, 196.00, 233.08, 293.66], // C7
  ];

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let l = 0, r = 0;

    const beatIndex = Math.floor(t / beatSec);
    const timeInBeat = t % beatSec;
    const chordIdx = Math.floor(beatIndex / 8) % chords.length;
    const currentChord = chords[chordIdx];

    // --- 1. KICK DRUM 808 (Puro, cálido, con acumulador de fase continuo) ---
    if (t >= 0.2 && t < 19.5) {
      if (timeInBeat < 0.28) {
        const kf = 46 + 180 * Math.exp(-timeInBeat * 38);
        kickPhase += 2 * Math.PI * kf / sampleRate;
        const kEnv = Math.exp(-timeInBeat * 14);
        const click = timeInBeat < 0.006 ? Math.sin(2 * Math.PI * 1600 * timeInBeat) * 0.25 : 0;
        const kick = (Math.sin(kickPhase) * 0.85 + click) * kEnv;
        l += kick * 0.72;
        r += kick * 0.72;
      } else {
        kickPhase = 0;
      }
    }

    // --- 2. SNARE / CLAP (Tiempos 2 y 4 con cuerpo y brillo filtrado) ---
    if (t >= 3.0 && t < 19.0) {
      const isClapBeat = (beatIndex % 2 === 1);
      if (isClapBeat && timeInBeat < 0.22) {
        const cEnv = Math.exp(-timeInBeat * 24);
        const white = (Math.random() * 2 - 1);
        const clapTone = Math.sin(2 * Math.PI * 220 * timeInBeat) * Math.exp(-timeInBeat * 30);
        const clap = (white * 0.6 + clapTone * 0.4) * cEnv * 0.42;
        l += clap * 0.75;
        r += clap * 0.75;
      }
    }

    // --- 3. HI-HAT (Groove en semicorcheas con swing y filtro paso alto) ---
    if (t >= 1.5 && t < 19.0) {
      const sixteenthIdx = Math.floor(t / sixteenth);
      const timeInSixteenth = t % sixteenth;
      if (timeInSixteenth < 0.045) {
        const hEnv = Math.exp(-timeInSixteenth * 90);
        const rawNoise = (Math.random() * 2 - 1);
        noiseState = rawNoise - 0.78 * noiseState; // High-pass filter
        const vel = (sixteenthIdx % 2 === 1) ? 0.26 : 0.14;
        const hat = noiseState * hEnv * vel;
        const pan = (sixteenthIdx % 4 === 1) ? 0.35 : 0.65;
        l += hat * (1 - pan);
        r += hat * pan;
      }
    }

    // --- 4. SUB & PLUCK BASS (Bajo potente y redondo en semicorcheas) ---
    if (t >= 3.0 && t < 19.0) {
      const bassRoot = currentChord[0];
      const bassStep = Math.floor(t / sixteenth) % 16;
      const bassHits = [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0];
      if (bassHits[bassStep]) {
        const timeInHit = t % sixteenth;
        const bEnv = Math.exp(-timeInHit * 18);
        bassPhase1 += 2 * Math.PI * (bassRoot * 0.5) / sampleRate;
        bassPhase2 += 2 * Math.PI * (bassRoot * 0.5 * 1.004) / sampleRate; // micro-detune
        const bOsc = (Math.sin(bassPhase1) + 0.35 * Math.sin(bassPhase2) + 0.2 * Math.sin(bassPhase1 * 2)) * bEnv;
        l += bOsc * 0.38;
        r += bOsc * 0.38;
      }
    }

    // --- 5. SYNTH ARPEGGIO & CHORDS (Melodía abierta y envolvente) ---
    if (t >= 0.4 && t < 19.2) {
      const arpIdx = Math.floor(t / (sixteenth * 2)) % currentChord.length;
      const arpFreq = currentChord[arpIdx] * 2;
      const timeInArp = t % (sixteenth * 2);
      const aEnv = Math.exp(-timeInArp * 8);
      arpPhase += 2 * Math.PI * arpFreq / sampleRate;
      const arp = (Math.sin(arpPhase) + 0.25 * Math.sin(arpPhase * 2) + 0.1 * Math.sin(arpPhase * 3)) * aEnv * 0.18;
      const pan = 0.5 + 0.35 * Math.sin(t * 3.5);
      l += arp * (1 - pan);
      r += arp * pan;
    }

    // --- SFX 1: Riser / Sweep hacia Cromo 3D (2.4s a 3.0s) ---
    if (t >= 2.4 && t < 3.0) {
      const p = (t - 2.4) / 0.6;
      const sweepNoise = (Math.random() * 2 - 1) * Math.pow(p, 2) * 0.22;
      const sweepSine = Math.sin(2 * Math.PI * (180 + p * 800) * t) * p * 0.18;
      l += sweepNoise + sweepSine;
      r += sweepNoise + sweepSine;
    }

    // --- SFX 2: Destello Holográfico (5.2s) ---
    if (t >= 5.2 && t < 6.0) {
      const dt = t - 5.2;
      const chimeFreq = 1760; // A6
      const chime = Math.sin(2 * Math.PI * chimeFreq * dt) * Math.exp(-dt * 6) * 0.15;
      l += chime * 0.3;
      r += chime * 0.7;
    }

    // --- SFX 3: Transición a Pizarra Táctica (6.8s a 7.2s) ---
    if (t >= 6.8 && t < 7.2) {
      const dt = t - 6.8;
      const whistle = Math.sin(2 * Math.PI * (880 + dt * 400) * dt) * Math.exp(-dt * 8) * 0.14;
      l += whistle * 0.6;
      r += whistle * 0.6;
    }

    // --- SFX 4: Obturador de Cámara en Historia Viral (10.8s) ---
    if (t >= 10.8 && t < 11.2) {
      const dt = t - 10.8;
      const shutter = (Math.random() * 2 - 1) * Math.exp(-dt * 45) * 0.3;
      l += shutter;
      r += shutter;
    }

    // --- SFX 5: Doble Beep Árbitro QR (14.6s y 14.85s) ---
    if ((t >= 14.6 && t < 14.75) || (t >= 14.85 && t < 15.0)) {
      const dt = t >= 14.85 ? t - 14.85 : t - 14.6;
      const beepFreq = t >= 14.85 ? 1318.5 : 987.77; // B5 -> E6
      const beepEnv = Math.sin((dt / 0.15) * Math.PI);
      const beep = Math.sin(2 * Math.PI * beepFreq * dt) * beepEnv * 0.3;
      l += beep * 0.6;
      r += beep * 0.6;
    }

    // --- SFX 6: Sub Boom Impacto Fox Byte (17.4s a 19.5s) ---
    if (t >= 17.4 && t < 19.5) {
      const dt = t - 17.4;
      const boom = Math.sin(2 * Math.PI * 48 * dt) * Math.exp(-dt * 2.5) * 0.45;
      l += boom;
      r += boom;
    }

    // Soft Limiter (tanh) para cero saturación digital
    l = Math.tanh(l * 1.12);
    r = Math.tanh(r * 1.12);

    // Fade out en los últimos 0.6 segundos
    if (t > 19.4) {
      const fade = (20.0 - t) / 0.6;
      l *= fade;
      r *= fade;
    }

    const sampleL = Math.max(-32767, Math.min(32767, Math.floor(l * 32767 * 0.88)));
    const sampleR = Math.max(-32767, Math.min(32767, Math.floor(r * 32767 * 0.88)));

    wavBuf.writeInt16LE(sampleL, offset);
    wavBuf.writeInt16LE(sampleR, offset + 2);
    offset += 4;
  }

  fs.writeFileSync(AUDIO_PATH, wavBuf);
  console.log('[Audio] Banda sonora sintetizada con éxito.');
}

// ==========================================
// 3. RENDER DE FRAMES VISUALES
// ==========================================
async function renderFrames(assets) {
  const { avatarB64, teamB64, logoB64, foxbyteB64 } = assets;
  const tStart = Date.now();
  console.log(`[Video Generator] Renderizando ${TOTAL_FRAMES} frames con 6 escenas dinámicas...`);

  for (let frame = 0; frame < TOTAL_FRAMES; frame++) {
    const t = frame / FPS; // 0.0s a 20.0s
    let svg = '';

    // ----------------------------------------------------
    // ESCENA 1: EL DOLOR / EL CAOS TRADICIONAL (0.0s - 3.0s, f: 0-74)
    // ----------------------------------------------------
    if (frame < 75) {
      const p = frame / 75;
      const textAlpha = Math.min(1, p * 3);

      svg = `
      <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#0F0103" />
            <stop offset="50%" stop-color="#24040A" />
            <stop offset="100%" stop-color="#0A0102" />
          </linearGradient>
          <radialGradient id="redSpot" cx="50%" cy="40%" r="50%">
            <stop offset="0%" stop-color="rgba(220, 38, 38, 0.28)" />
            <stop offset="100%" stop-color="transparent" />
          </radialGradient>
        </defs>
        <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)" />
        <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#redSpot)" />

        <!-- Warning Pill -->
        <g opacity="${textAlpha}">
          <rect x="160" y="240" width="400" height="48" rx="24" fill="#3B0810" stroke="#DC2626" stroke-width="2"/>
          <text x="360" y="271" font-family="sans-serif" font-weight="900" font-size="16" fill="#FCA5A5" text-anchor="middle" letter-spacing="2">
            ⚠️ GESTIÓN DEPORTIVA TRADICIONAL
          </text>
        </g>

        <!-- Titular de impacto -->
        <g opacity="${textAlpha}">
          <text x="360" y="360" font-family="sans-serif" font-weight="900" font-size="40" fill="#FFFFFF" text-anchor="middle" letter-spacing="1">
            ¿GESTIONAS TU TORNEO
          </text>
          <text x="360" y="415" font-family="sans-serif" font-weight="900" font-size="40" fill="#EF4444" text-anchor="middle" letter-spacing="1">
            EN PAPEL Y WHATSAPP?
          </text>
        </g>

        <!-- Dolores del Organizador -->
        <g transform="translate(110, 490)" opacity="${Math.max(0, (p - 0.2) * 1.6)}">
          <rect x="0" y="0" width="500" height="110" rx="24" fill="rgba(30, 4, 8, 0.85)" stroke="#7F1D1D" stroke-width="1.5" />
          <circle cx="55" cy="55" r="28" fill="#450A0A" />
          <text x="55" y="65" font-family="sans-serif" font-weight="900" font-size="28" fill="#EF4444" text-anchor="middle">✕</text>
          <text x="105" y="45" font-family="sans-serif" font-weight="800" font-size="18" fill="#FEE2E2">Planillas de papel extraviadas</text>
          <text x="105" y="75" font-family="sans-serif" font-size="14" fill="#9CA3AF">Arbitraje retrasado y desorden en campo</text>
        </g>

        <g transform="translate(110, 630)" opacity="${Math.max(0, (p - 0.35) * 1.8)}">
          <rect x="0" y="0" width="500" height="110" rx="24" fill="rgba(30, 4, 8, 0.85)" stroke="#7F1D1D" stroke-width="1.5" />
          <circle cx="55" cy="55" r="28" fill="#450A0A" />
          <text x="55" y="65" font-family="sans-serif" font-weight="900" font-size="28" fill="#EF4444" text-anchor="middle">✕</text>
          <text x="105" y="45" font-family="sans-serif" font-weight="800" font-size="18" fill="#FEE2E2">Comprobantes perdidos en chats</text>
          <text x="105" y="75" font-family="sans-serif" font-size="14" fill="#9CA3AF">Horas cuadrando pagos en Bs / USD / EUR</text>
        </g>

        <g transform="translate(110, 770)" opacity="${Math.max(0, (p - 0.5) * 2.0)}">
          <rect x="0" y="0" width="500" height="110" rx="24" fill="rgba(30, 4, 8, 0.85)" stroke="#7F1D1D" stroke-width="1.5" />
          <circle cx="55" cy="55" r="28" fill="#450A0A" />
          <text x="55" y="65" font-family="sans-serif" font-weight="900" font-size="28" fill="#EF4444" text-anchor="middle">✕</text>
          <text x="105" y="45" font-family="sans-serif" font-weight="800" font-size="18" fill="#FEE2E2">Suplantación de identidad</text>
          <text x="105" y="75" font-family="sans-serif" font-size="14" fill="#9CA3AF">Carnets de cartulina fáciles de falsificar</text>
        </g>

        <!-- Barra de progreso hacia la solución -->
        <g transform="translate(180, 1020)">
          <rect x="0" y="0" width="360" height="50" rx="25" fill="#1F2937" stroke="#374151" stroke-width="2"/>
          <rect x="0" y="0" width="${360 * p}" height="50" rx="25" fill="#EF4444" />
          <text x="180" y="32" font-family="sans-serif" font-weight="900" font-size="15" fill="#FFFFFF" text-anchor="middle" letter-spacing="1">
            EL DEPORTE EVOLUCIONÓ...
          </text>
        </g>
      </svg>`;
    }

    // ----------------------------------------------------
    // ESCENA 2: CROMO HOLOGRÁFICO 3D (3.0s - 7.0s, f: 75-174)
    // ----------------------------------------------------
    else if (frame < 175) {
      const p = (frame - 75) / 100;
      // Inclinación sinusoidal de giroscopio físico
      const tiltAngle = Math.sin(p * Math.PI * 4) * 8.5;
      const sheenX = 360 + Math.sin(p * Math.PI * 4) * 220;
      const phoneScale = 0.95 + Math.min(0.05, p * 0.1);

      svg = `
      <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="stadiumBg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#140105" />
            <stop offset="45%" stop-color="#460B17" />
            <stop offset="100%" stop-color="#0E0103" />
          </linearGradient>
          <radialGradient id="spotGold" cx="50%" cy="30%" r="55%">
            <stop offset="0%" stop-color="rgba(212, 175, 55, 0.35)" />
            <stop offset="100%" stop-color="transparent" />
          </radialGradient>
          <radialGradient id="sheen" cx="${(sheenX / WIDTH) * 100}%" cy="45%" r="40%">
            <stop offset="0%" stop-color="rgba(255,255,255,0.85)" />
            <stop offset="40%" stop-color="rgba(212,175,55,0.4)" />
            <stop offset="100%" stop-color="transparent" />
          </radialGradient>
          <clipPath id="avatarClip">
            <circle cx="360" cy="510" r="115" />
          </clipPath>
          <clipPath id="teamClip">
            <circle cx="435" cy="585" r="42" />
          </clipPath>
        </defs>
        <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#stadiumBg)" />
        <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#spotGold)" />

        <!-- Subtítulo Superior -->
        <text x="360" y="110" font-family="sans-serif" font-weight="900" font-size="16" fill="#D4AF37" text-anchor="middle" letter-spacing="3">
          ★ PLATAFORMA DEPORTIVA KSASPORT ★
        </text>
        <text x="360" y="155" font-family="sans-serif" font-weight="900" font-size="36" fill="#FFFFFF" text-anchor="middle" letter-spacing="1">
          CROMO HOLOGRÁFICO 3D
        </text>
        <text x="360" y="195" font-family="sans-serif" font-weight="800" font-size="16" fill="#FDE68A" text-anchor="middle" letter-spacing="2">
          ⚡ GIROSCOPIO FÍSICO ACTIVO
        </text>

        <!-- TARJETA 3D ROTANDO EN PERSPECTIVA -->
        <g transform="translate(360, 640) rotate(${tiltAngle}) scale(${phoneScale}) translate(-360, -640)">
          <!-- Sombra proyectada -->
          <rect x="135" y="245" width="450" height="710" rx="36" fill="rgba(0,0,0,0.6)" />

          <!-- Tarjeta Base Vinotinto KSA -->
          <rect x="140" y="240" width="440" height="700" rx="36" fill="#2E040B" stroke="#D4AF37" stroke-width="5" />
          <rect x="150" y="250" width="420" height="680" rx="26" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1.5" />

          <!-- Watermark escudo de Auroras -->
          <image href="data:image/png;base64,${teamB64}" x="210" y="440" width="300" height="300" opacity="0.08" />

          <!-- Destello Holográfico Tornasol -->
          <rect x="140" y="240" width="440" height="700" rx="36" fill="url(#sheen)" style="mix-blend-mode: overlay;" />

          <!-- Header de Tarjeta: Categoría y Estatus -->
          <rect x="170" y="275" width="160" height="36" rx="18" fill="rgba(0,0,0,0.5)" stroke="rgba(212,175,55,0.4)" stroke-width="1.5"/>
          <text x="250" y="298" font-family="sans-serif" font-weight="900" font-size="13" fill="#D4AF37" text-anchor="middle" letter-spacing="1">KICKINGBALL</text>

          <rect x="380" y="275" width="170" height="36" rx="18" fill="#059669" />
          <text x="465" y="298" font-family="sans-serif" font-weight="900" font-size="13" fill="#FFFFFF" text-anchor="middle" letter-spacing="1">● HABILITADA</text>

          <!-- Foto del Atleta (Estefania Avendaño) con marco dorado -->
          <circle cx="360" cy="510" r="122" fill="none" stroke="#D4AF37" stroke-width="5" />
          <image href="data:image/png;base64,${avatarB64}" x="245" y="395" width="230" height="230" clip-path="url(#avatarClip)" preserveAspectRatio="xMidYMid slice" />

          <!-- Micro Escudo Auroras acoplado -->
          <circle cx="435" cy="585" r="44" fill="#FFFFFF" stroke="#D4AF37" stroke-width="4" />
          <image href="data:image/png;base64,${teamB64}" x="395" y="545" width="80" height="80" clip-path="url(#teamClip)" preserveAspectRatio="xMidYMid slice" />

          <!-- Posición Pill -->
          <rect x="270" y="640" width="180" height="28" rx="14" fill="rgba(0,0,0,0.6)" stroke="rgba(212,175,55,0.4)" stroke-width="1"/>
          <text x="360" y="659" font-family="sans-serif" font-weight="900" font-size="12" fill="#FDE68A" text-anchor="middle" letter-spacing="1">PITCHER ABRIL</text>

          <!-- Nombre y Equipo -->
          <text x="360" y="705" font-family="sans-serif" font-weight="900" font-size="30" fill="#FFFFFF" text-anchor="middle" letter-spacing="2">
            ESTEFANIA AVENDAÑO
          </text>
          
          <g transform="translate(360, 738)">
            <text x="0" y="0" font-family="sans-serif" font-weight="900" font-size="18" fill="#D4AF37" text-anchor="middle" letter-spacing="3">
              AURORAS • C.I. 27.290.418
            </text>
          </g>

          <!-- Métricas de Rendimiento (AVG, HITS, CI, CA) -->
          <g transform="translate(165, 770)">
            <rect x="0" y="0" width="390" height="74" rx="20" fill="rgba(10, 1, 3, 0.75)" stroke="rgba(212,175,55,0.3)" stroke-width="1.5"/>
            
            <text x="48" y="24" font-family="sans-serif" font-size="11" fill="#9CA3AF" text-anchor="middle">AVG</text>
            <text x="48" y="56" font-family="sans-serif" font-weight="900" font-size="22" fill="#FFFFFF" text-anchor="middle">.385</text>

            <line x1="98" y1="14" x2="98" y2="60" stroke="#374151" stroke-width="1" />

            <text x="146" y="24" font-family="sans-serif" font-size="11" fill="#9CA3AF" text-anchor="middle">HITS</text>
            <text x="146" y="56" font-family="sans-serif" font-weight="900" font-size="22" fill="#FFFFFF" text-anchor="middle">14</text>

            <line x1="195" y1="14" x2="195" y2="60" stroke="#374151" stroke-width="1" />

            <text x="244" y="24" font-family="sans-serif" font-size="11" fill="#9CA3AF" text-anchor="middle">CI</text>
            <text x="244" y="56" font-family="sans-serif" font-weight="900" font-size="22" fill="#FFFFFF" text-anchor="middle">9</text>

            <line x1="293" y1="14" x2="293" y2="60" stroke="#374151" stroke-width="1" />

            <text x="342" y="24" font-family="sans-serif" font-size="11" fill="#9CA3AF" text-anchor="middle">CA</text>
            <text x="342" y="56" font-family="sans-serif" font-weight="900" font-size="22" fill="#FFFFFF" text-anchor="middle">8</text>
          </g>

          <text x="360" y="875" font-family="sans-serif" font-size="11" fill="#D1D5DB" text-anchor="middle" letter-spacing="1">
            FICHA OFICIAL DIGITAL • VERIFICACIÓN ANTIFRAUDE
          </text>
        </g>

        <!-- Indicador de acción abajo -->
        <g transform="translate(190, 1070)">
          <rect x="0" y="0" width="340" height="50" rx="25" fill="rgba(0,0,0,0.5)" stroke="#D4AF37" stroke-width="1.5"/>
          <text x="170" y="32" font-family="sans-serif" font-weight="800" font-size="14" fill="#FFFFFF" text-anchor="middle">
            📱 Inclina el móvil para activar el reflejo
          </text>
        </g>
      </svg>`;
    }

    // ----------------------------------------------------
    // ESCENA 3: NUEVO APARTADO: PIZARRA TÁCTICA & LINEUP (7.0s - 11.0s, f: 175-274)
    // ----------------------------------------------------
    else if (frame < 275) {
      const p = (frame - 175) / 100;
      const zoom = 0.95 + Math.min(0.05, p * 0.1);
      const pulsePitcher = Math.sin(p * Math.PI * 6) * 4;

      svg = `
      <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bgField" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#051D14" />
            <stop offset="50%" stop-color="#0A3324" />
            <stop offset="100%" stop-color="#04160E" />
          </linearGradient>
          <radialGradient id="fieldLight" cx="50%" cy="45%" r="55%">
            <stop offset="0%" stop-color="rgba(16, 185, 129, 0.28)" />
            <stop offset="100%" stop-color="transparent" />
          </radialGradient>
          <clipPath id="pMiniClip">
            <circle cx="0" cy="0" r="38" />
          </clipPath>
        </defs>

        <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bgField)" />
        <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#fieldLight)" />

        <!-- Header -->
        <g transform="translate(0, 80)">
          <rect x="160" y="0" width="400" height="40" rx="20" fill="rgba(16, 185, 129, 0.2)" stroke="#10B981" stroke-width="1.5" />
          <text x="360" y="26" font-family="sans-serif" font-weight="900" font-size="14" fill="#34D399" text-anchor="middle" letter-spacing="2">
            ★ ESTRATEGIA &amp; PIZARRA TÁCTICA ★
          </text>
          <text x="360" y="75" font-family="sans-serif" font-weight="900" font-size="34" fill="#FFFFFF" text-anchor="middle" letter-spacing="1">
            ALINEACIÓN EN VIVO
          </text>
          <text x="360" y="110" font-family="sans-serif" font-weight="800" font-size="17" fill="#FDE68A" text-anchor="middle">
            13 Posiciones • Control de Mesa Técnica
          </text>
        </g>

        <!-- EL DIAMANTE DE JUEGO INTERACTIVO -->
        <g transform="translate(360, 520) scale(${zoom}) translate(-360, -520)">
          <!-- Cancha de tierra exterior -->
          <path d="M 360 480 L 590 250 A 330 330 0 0 0 130 250 Z" fill="rgba(0,0,0,0.3)" stroke="#10B981" stroke-width="2" opacity="0.7" />

          <!-- Líneas de cal del diamante -->
          <polygon points="360,490 530,320 360,150 190,320" fill="rgba(16, 185, 129, 0.15)" stroke="#FFFFFF" stroke-width="3" stroke-dasharray="6,4" />

          <!-- Bases -->
          <polygon points="360,490 350,505 370,505" fill="#FFFFFF" stroke="#D4AF37" stroke-width="2"/>
          <rect x="520" y="310" width="20" height="20" fill="#FFFFFF" stroke="#D4AF37" stroke-width="2" transform="rotate(45 530 320)"/>
          <rect x="350" y="140" width="20" height="20" fill="#FFFFFF" stroke="#D4AF37" stroke-width="2" transform="rotate(45 360 150)"/>
          <rect x="180" y="310" width="20" height="20" fill="#FFFFFF" stroke="#D4AF37" stroke-width="2" transform="rotate(45 190 320)"/>

          <!-- Posiciones en Outfield (Jardineras) -->
          <g transform="translate(360, 40)">
            <circle cx="0" cy="0" r="20" fill="#064E3B" stroke="#10B981" stroke-width="2"/>
            <text x="0" y="5" font-family="sans-serif" font-weight="900" font-size="11" fill="#FFFFFF" text-anchor="middle">CF</text>
          </g>
          <g transform="translate(170, 90)">
            <circle cx="0" cy="0" r="20" fill="#064E3B" stroke="#10B981" stroke-width="2"/>
            <text x="0" y="5" font-family="sans-serif" font-weight="900" font-size="11" fill="#FFFFFF" text-anchor="middle">LF</text>
          </g>
          <g transform="translate(550, 90)">
            <circle cx="0" cy="0" r="20" fill="#064E3B" stroke="#10B981" stroke-width="2"/>
            <text x="0" y="5" font-family="sans-serif" font-weight="900" font-size="11" fill="#FFFFFF" text-anchor="middle">RF</text>
          </g>

          <!-- Infielders -->
          <g transform="translate(265, 230)">
            <circle cx="0" cy="0" r="22" fill="#0F766E" stroke="#14B8A6" stroke-width="2"/>
            <text x="0" y="5" font-family="sans-serif" font-weight="900" font-size="11" fill="#FFFFFF" text-anchor="middle">SS</text>
          </g>
          <g transform="translate(455, 230)">
            <circle cx="0" cy="0" r="22" fill="#0F766E" stroke="#14B8A6" stroke-width="2"/>
            <text x="0" y="5" font-family="sans-serif" font-weight="900" font-size="11" fill="#FFFFFF" text-anchor="middle">2B</text>
          </g>
          <g transform="translate(170, 320)">
            <circle cx="0" cy="0" r="22" fill="#0F766E" stroke="#14B8A6" stroke-width="2"/>
            <text x="0" y="5" font-family="sans-serif" font-weight="900" font-size="11" fill="#FFFFFF" text-anchor="middle">3B</text>
          </g>
          <g transform="translate(550, 320)">
            <circle cx="0" cy="0" r="22" fill="#0F766E" stroke="#14B8A6" stroke-width="2"/>
            <text x="0" y="5" font-family="sans-serif" font-weight="900" font-size="11" fill="#FFFFFF" text-anchor="middle">1B</text>
          </g>
          <g transform="translate(360, 520)">
            <circle cx="0" cy="0" r="24" fill="#064E3B" stroke="#D4AF37" stroke-width="2"/>
            <text x="0" y="6" font-family="sans-serif" font-weight="900" font-size="12" fill="#FFFFFF" text-anchor="middle">C</text>
          </g>

          <!-- JUGADORA EN EL MONTÍCULO (PITCHER: ESTEFANIA AVENDAÑO) -->
          <g transform="translate(360, 340)">
            <circle cx="0" cy="0" r="${50 + pulsePitcher}" fill="rgba(212, 175, 55, 0.25)" stroke="#D4AF37" stroke-width="3"/>
            <circle cx="0" cy="0" r="44" fill="#FFFFFF" stroke="#D4AF37" stroke-width="3"/>
            <image href="data:image/png;base64,${avatarB64}" x="-38" y="-38" width="76" height="76" clip-path="url(#pMiniClip)" preserveAspectRatio="xMidYMid slice" />
            
            <!-- Badge de Posición -->
            <rect x="-32" y="44" width="64" height="22" rx="11" fill="#D4AF37" />
            <text x="0" y="59" font-family="sans-serif" font-weight="900" font-size="11" fill="#1F040C" text-anchor="middle">PITCHER</text>
            
            <!-- Nombre flotante -->
            <rect x="-105" y="70" width="210" height="30" rx="15" fill="rgba(0,0,0,0.85)" stroke="#D4AF37" stroke-width="1.5"/>
            <text x="0" y="90" font-family="sans-serif" font-weight="900" font-size="13" fill="#FFFFFF" text-anchor="middle">
              E. AVENDAÑO ● APTA
            </text>
          </g>
        </g>

        <!-- TARJETA INFERIOR: LIVE MATCH CONTROL & STATS -->
        <g transform="translate(60, 930)">
          <rect x="0" y="0" width="600" height="240" rx="28" fill="rgba(15, 23, 42, 0.94)" stroke="#10B981" stroke-width="2"/>

          <!-- Marcador en Vivo -->
          <g transform="translate(40, 35)">
            <text x="0" y="0" font-family="sans-serif" font-weight="900" font-size="17" fill="#10B981">PARTIDO EN VIVO</text>
            <text x="0" y="32" font-family="sans-serif" font-weight="900" font-size="26" fill="#FFFFFF">AURORAS  4 - 2  BANDIDAS</text>
            <text x="0" y="58" font-family="sans-serif" font-weight="700" font-size="14" fill="#94A3B8">Inning 4 • Alta • 2 Outs • 1 En Base</text>
          </g>

          <!-- Stat Pills -->
          <g transform="translate(40, 125)">
            <rect x="0" y="0" width="240" height="42" rx="21" fill="rgba(16, 185, 129, 0.15)" stroke="#10B981" stroke-width="1"/>
            <text x="120" y="26" font-family="sans-serif" font-weight="800" font-size="13" fill="#34D399" text-anchor="middle">
              ✓ 13/13 Jugadoras Solventes
            </text>

            <rect x="260" y="0" width="260" height="42" rx="21" fill="rgba(212, 175, 55, 0.15)" stroke="#D4AF37" stroke-width="1"/>
            <text x="390" y="26" font-family="sans-serif" font-weight="800" font-size="13" fill="#FDE68A" text-anchor="middle">
              ⚡ Actualización Instantánea
            </text>
          </g>

          <!-- Botón de Acción -->
          <g transform="translate(130, 180)">
            <rect x="0" y="0" width="340" height="44" rx="22" fill="#10B981"/>
            <text x="170" y="28" font-family="sans-serif" font-weight="900" font-size="14" fill="#042F2E" text-anchor="middle" letter-spacing="1">
              + REGISTRAR ACCIÓN DEFENSIVA
            </text>
          </g>
        </g>
      </svg>`;
    }

    // ----------------------------------------------------
    // ESCENA 4: VIRALIDAD ORGÁNICA / HISTORIAS (11.0s - 14.5s, f: 275-362)
    // ----------------------------------------------------
    else if (frame < 363) {
      const p = (frame - 275) / 88;
      const zoom = 0.95 + Math.min(0.06, p * 0.12);

      svg = `
      <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bgStory" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#180206" />
            <stop offset="40%" stop-color="#380612" />
            <stop offset="100%" stop-color="#120104" />
          </linearGradient>
          <clipPath id="avatarStory">
            <circle cx="360" cy="450" r="130" />
          </clipPath>
          <clipPath id="teamStory">
            <circle cx="445" cy="535" r="45" />
          </clipPath>
        </defs>
        <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bgStory)" />

        <!-- Header -->
        <text x="360" y="110" font-family="sans-serif" font-weight="900" font-size="16" fill="#D4AF37" text-anchor="middle" letter-spacing="3">
          ★ VIRALIDAD ORGÁNICA INSTANTÁNEA ★
        </text>
        <text x="360" y="155" font-family="sans-serif" font-weight="900" font-size="34" fill="#FFFFFF" text-anchor="middle" letter-spacing="1">
          DE LA CANCHA A TUS HISTORIAS
        </text>
        <text x="360" y="195" font-family="sans-serif" font-weight="800" font-size="18" fill="#FBBF24" text-anchor="middle">
          Afiche 1080×1920 en 1 solo toque
        </text>

        <!-- AFICHE EXPANDIDO VERTICAL -->
        <g transform="translate(360, 560) scale(${zoom}) translate(-360, -560)">
          <rect x="150" y="225" width="420" height="590" rx="32" fill="#250409" stroke="#D4AF37" stroke-width="4"/>
          <image href="data:image/png;base64,${teamB64}" x="210" y="370" width="300" height="300" opacity="0.09" />

          <!-- Foto Avatar Grande -->
          <circle cx="360" cy="450" r="138" fill="none" stroke="#D4AF37" stroke-width="5" />
          <image href="data:image/png;base64,${avatarB64}" x="230" y="320" width="260" height="260" clip-path="url(#avatarStory)" preserveAspectRatio="xMidYMid slice" />

          <!-- Sello Auroras -->
          <circle cx="445" cy="535" r="48" fill="#FFFFFF" stroke="#D4AF37" stroke-width="4" />
          <image href="data:image/png;base64,${teamB64}" x="400" y="490" width="90" height="90" clip-path="url(#teamStory)" preserveAspectRatio="xMidYMid slice" />

          <!-- Nombre -->
          <text x="360" y="650" font-family="sans-serif" font-weight="900" font-size="32" fill="#FFFFFF" text-anchor="middle" letter-spacing="2">
            ESTEFANIA AVENDAÑO
          </text>
          <text x="360" y="685" font-family="sans-serif" font-weight="900" font-size="20" fill="#D4AF37" text-anchor="middle" letter-spacing="3">
            AURORAS • KICKINGBALL
          </text>

          <!-- Watermark -->
          <rect x="180" y="740" width="360" height="44" rx="22" fill="rgba(0,0,0,0.6)" stroke="#D4AF37" stroke-width="1.5"/>
          <text x="360" y="768" font-family="sans-serif" font-weight="800" font-size="13" fill="#FFFFFF" text-anchor="middle" letter-spacing="1">
            ksasport.com • Plataforma Deportiva
          </text>
        </g>

        <!-- Redes Sociales Flotantes -->
        <g transform="translate(140, 890)">
          <!-- WhatsApp Pill -->
          <rect x="0" y="0" width="210" height="56" rx="28" fill="#25D366" />
          <text x="105" y="35" font-family="sans-serif" font-weight="900" font-size="16" fill="#FFFFFF" text-anchor="middle">
            WhatsApp Status
          </text>
          <!-- Instagram Pill -->
          <rect x="230" y="0" width="210" height="56" rx="28" fill="#E1306C" />
          <text x="335" y="35" font-family="sans-serif" font-weight="900" font-size="16" fill="#FFFFFF" text-anchor="middle">
            Instagram Story
          </text>
        </g>

        <!-- Banner Inferior -->
        <g transform="translate(180, 990)">
          <rect x="0" y="0" width="360" height="52" rx="26" fill="#D4AF37" />
          <text x="180" y="33" font-family="sans-serif" font-weight="900" font-size="15" fill="#1C0207" text-anchor="middle" letter-spacing="1">
            ✨ LISTO PARA COMPARTIR
          </text>
        </g>
      </svg>`;
    }

    // ----------------------------------------------------
    // ESCENA 5: VALIDACIÓN ARBITRAL QR (14.5s - 17.5s, f: 363-437)
    // ----------------------------------------------------
    else if (frame < 438) {
      const p = (frame - 363) / 75;
      const laserY = 400 + Math.sin(p * Math.PI * 4) * 160;

      svg = `
      <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bgFieldScan" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#064E3B" />
            <stop offset="50%" stop-color="#022C22" />
            <stop offset="100%" stop-color="#0A1E17" />
          </linearGradient>
          <linearGradient id="laserGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="transparent" />
            <stop offset="50%" stop-color="#10B981" />
            <stop offset="100%" stop-color="transparent" />
          </linearGradient>
        </defs>
        <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bgFieldScan)" />

        <text x="360" y="110" font-family="sans-serif" font-weight="900" font-size="16" fill="#34D399" text-anchor="middle" letter-spacing="3">
          ★ VALIDACIÓN ARBITRAL EN CAMPO ★
        </text>
        <text x="360" y="155" font-family="sans-serif" font-weight="900" font-size="34" fill="#FFFFFF" text-anchor="middle" letter-spacing="1">
          CERO FRAUDE EN LA MESA TÉCNICA
        </text>

        <!-- Tarjeta QR Simulator -->
        <g transform="translate(180, 230)">
          <rect x="0" y="0" width="360" height="420" rx="28" fill="#FFFFFF" stroke="#10B981" stroke-width="6" />

          <!-- Mockup QR Code -->
          <rect x="40" y="40" width="280" height="280" fill="#000000" rx="16" />
          <rect x="60" y="60" width="240" height="240" fill="#FFFFFF" rx="8" />
          
          <rect x="80" y="80" width="60" height="60" fill="#000000" />
          <rect x="95" y="95" width="30" height="30" fill="#FFFFFF" />
          <rect x="220" y="80" width="60" height="60" fill="#000000" />
          <rect x="235" y="95" width="30" height="30" fill="#FFFFFF" />
          <rect x="80" y="220" width="60" height="60" fill="#000000" />
          <rect x="95" y="235" width="30" height="30" fill="#FFFFFF" />
          <circle cx="180" cy="180" r="28" fill="#5A0F1D" />
          <text x="180" y="186" font-family="sans-serif" font-weight="900" font-size="16" fill="#D4AF37" text-anchor="middle">KS</text>

          <text x="180" y="365" font-family="sans-serif" font-weight="800" font-size="15" fill="#374151" text-anchor="middle">
            ESCANEAR CON CÁMARA
          </text>
        </g>

        <!-- Haz Láser del Escáner -->
        <rect x="180" y="${laserY}" width="360" height="6" fill="#10B981" opacity="0.9" />
        <rect x="180" y="${laserY - 10}" width="360" height="26" fill="url(#laserGrad)" opacity="0.6" />

        <!-- RESULTADO DE VALIDACIÓN (Badge Esmeralda) -->
        <g transform="translate(110, 710)">
          <rect x="0" y="0" width="500" height="180" rx="30" fill="#065F46" stroke="#34D399" stroke-width="3" />
          <circle cx="60" cy="90" r="32" fill="#10B981" />
          <text x="60" y="100" font-family="sans-serif" font-weight="900" font-size="32" fill="#FFFFFF" text-anchor="middle">✓</text>
          
          <text x="120" y="65" font-family="sans-serif" font-weight="900" font-size="24" fill="#FFFFFF">HABILITADA OFICIAL</text>
          <text x="120" y="98" font-family="sans-serif" font-weight="800" font-size="18" fill="#A7F3D0">Estefania Avendaño (Auroras)</text>
          <text x="120" y="128" font-family="sans-serif" font-weight="700" font-size="14" fill="#6EE7B7">Solvente Temporada 2026 • C.I. 27.290.418</text>
        </g>

        <!-- Beneficio clave abajo -->
        <g transform="translate(100, 960)">
          <rect x="0" y="0" width="520" height="65" rx="32" fill="rgba(0,0,0,0.4)" stroke="rgba(52,211,153,0.4)" stroke-width="1.5"/>
          <text x="260" y="40" font-family="sans-serif" font-weight="800" font-size="17" fill="#E5E7EB" text-anchor="middle" letter-spacing="1">
            ⚡ Validación en 1 segundo sin descargar apps
          </text>
        </g>
      </svg>`;
    }

    // ----------------------------------------------------
    // ESCENA 6: OUTRO OFICIAL FOX BYTE (PALETA NARANJA & LOGO REAL) (17.5s - 20.0s, f: 438-499)
    // ----------------------------------------------------
    else {
      const p = (frame - 438) / 62;
      const glow = Math.sin(p * Math.PI) * 12;

      svg = `
      <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bgFox" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#07080B" />
            <stop offset="45%" stop-color="#160D08" />
            <stop offset="100%" stop-color="#050608" />
          </linearGradient>
          <radialGradient id="orangeGlow" cx="50%" cy="65%" r="50%">
            <stop offset="0%" stop-color="rgba(245, 158, 11, 0.38)" />
            <stop offset="50%" stop-color="rgba(217, 119, 6, 0.16)" />
            <stop offset="100%" stop-color="transparent" />
          </radialGradient>
          <linearGradient id="btnGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#F59E0B" />
            <stop offset="100%" stop-color="#EA580C" />
          </linearGradient>
        </defs>

        <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bgFox)" />
        <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#orangeGlow)" />

        <!-- Logo KsaSport Central Arriba -->
        <g transform="translate(295, 160)">
          <rect x="0" y="0" width="130" height="130" rx="32" fill="#FFFFFF" stroke="#D4AF37" stroke-width="4"/>
          <image href="data:image/png;base64,${logoB64}" x="15" y="15" width="100" height="100" />
        </g>

        <text x="360" y="340" font-family="sans-serif" font-weight="900" font-size="42" fill="#FFFFFF" text-anchor="middle" letter-spacing="4">
          KSASPORT
        </text>
        <text x="360" y="380" font-family="sans-serif" font-weight="800" font-size="18" fill="#D4AF37" text-anchor="middle" letter-spacing="3">
          PLATAFORMA DEPORTIVA INTELIGENTE
        </text>

        <!-- Divisor dorado/naranja -->
        <line x1="220" y1="420" x2="500" y2="420" stroke="#F59E0B" stroke-width="2" opacity="0.7" />

        <!-- TARJETA DE AUTORÍA OFICIAL: FOX BYTE -->
        <g transform="translate(90, 460)">
          <!-- Resplandor exterior dinámico -->
          <rect x="-6" y="-6" width="552" height="472" rx="36" fill="none" stroke="rgba(245, 158, 11, 0.28)" stroke-width="${10 + glow * 0.4}"/>
          <!-- Tarjeta principal -->
          <rect x="0" y="0" width="540" height="460" rx="30" fill="rgba(15, 17, 24, 0.95)" stroke="#F59E0B" stroke-width="3"/>

          <!-- Logotipo Oficial Fox Byte (F estilizada transparente) -->
          <image href="data:image/png;base64,${foxbyteB64}" x="195" y="25" width="150" height="150" />

          <text x="270" y="205" font-family="sans-serif" font-weight="800" font-size="13" fill="#94A3B8" text-anchor="middle" letter-spacing="3">
            ARQUITECTURA &amp; DESARROLLO POR
          </text>

          <text x="270" y="265" font-family="sans-serif" font-weight="900" font-size="48" fill="#FFFFFF" text-anchor="middle" letter-spacing="3">
            FOX <tspan fill="#F59E0B">BYTE</tspan>
          </text>

          <!-- Badges de tecnología -->
          <g transform="translate(35, 295)">
            <rect x="0" y="0" width="470" height="38" rx="19" fill="rgba(245, 158, 11, 0.1)" stroke="rgba(245, 158, 11, 0.35)" stroke-width="1.5"/>
            <text x="235" y="25" font-family="monospace" font-weight="700" font-size="14" fill="#FBBF24" text-anchor="middle">
              Next.js 16 • Turbopack • Cloudflare R2 • PWA
            </text>
          </g>

          <text x="270" y="375" font-family="sans-serif" font-weight="800" font-size="18" fill="#E2E8F0" text-anchor="middle" letter-spacing="1">
            Software Deportivo de Alto Rendimiento
          </text>

          <text x="270" y="405" font-family="sans-serif" font-weight="700" font-size="13" fill="#F59E0B" text-anchor="middle">
            Diseñado para escalar ligas y federaciones
          </text>
        </g>

        <!-- CTA Final Naranja -->
        <g transform="translate(160, 980)">
          <rect x="0" y="0" width="400" height="72" rx="36" fill="url(#btnGrad)" />
          <text x="200" y="45" font-family="sans-serif" font-weight="900" font-size="22" fill="#FFFFFF" text-anchor="middle" letter-spacing="2">
            foxbyte.dev ➔
          </text>
        </g>
      </svg>`;
    }

    const frameFile = path.join(FRAMES_DIR, `frame_${String(frame).padStart(4, '0')}.png`);
    await sharp(Buffer.from(svg)).png().toFile(frameFile);

    if (frame % 50 === 0 || frame === TOTAL_FRAMES - 1) {
      const elapsed = ((Date.now() - tStart) / 1000).toFixed(1);
      console.log(`[Video Generator] Renderizado frame ${frame}/${TOTAL_FRAMES} (${elapsed}s)...`);
    }
  }

  console.log(`[Video Generator] Todos los ${TOTAL_FRAMES} frames renderizados.`);
}

// ==========================================
// 4. CODIFICACIÓN FINAL MP4 CON FFMPEG
// ==========================================
async function encodeVideo() {
  const assets = await prepareAssets();
  generateAudio();
  await renderFrames(assets);

  console.log('[FFMPEG] Codificando video MP4 (H.264 + AAC)...');
  const inputPattern = path.join(FRAMES_DIR, 'frame_%04d.png');

  const cmd = `"${FFMPEG_BIN}" -y -framerate ${FPS} -i "${inputPattern}" -i "${AUDIO_PATH}" -c:v libx264 -pix_fmt yuv420p -preset fast -crf 20 -c:a aac -b:a 192k -shortest "${PUBLIC_OUTPUT}"`;

  execSync(cmd, { stdio: 'inherit' });

  // Copiar al directorio de artefactos para acceso directo
  fs.copyFileSync(PUBLIC_OUTPUT, ARTIFACT_OUTPUT);

  const stats = fs.statSync(PUBLIC_OUTPUT);
  console.log(`\n🎉 ¡VIDEO GENERADO CON ÉXITO!`);
  console.log(`📁 Ruta Pública: ${PUBLIC_OUTPUT} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`📁 Ruta Artefacto: ${ARTIFACT_OUTPUT}`);
}

encodeVideo().catch((err) => {
  console.error('[Error]', err);
  process.exit(1);
});
