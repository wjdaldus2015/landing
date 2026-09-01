$('.btn-contact').click(function(){
  window.scrollTo({top: document.body.scrollHeight, behavior: "smooth"});
});

//sc-intro 


// 인트로 - 커서로 뚫는 마스크 + 진행률
(function () {
  const intro = document.getElementById('intro');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function handoff() {
    document.dispatchEvent(new CustomEvent('intro:done'));
  }

  if (!intro) { handoff(); return; }

  if (reduced) {
    intro.remove();
    handoff();
    return;
  }

  document.documentElement.classList.add('is-intro');

  const hole = intro.querySelector('.hole');
  const trails = Array.from(intro.querySelectorAll('.trail'));
  const rule = intro.querySelector('.intro-rule i');
  const countEl = intro.querySelector('.intro-count');
  const warp = intro.querySelector('#introWarp feDisplacementMap');

  // 가로로 길게 찢긴 구멍 - 원이 아니라 배경 천의 결을 따르는 비율
  const WIDE = 2.3;
  const TALL = 0.62;

  // 커서가 오기 전까지는 화면 한가운데
  let px = window.innerWidth / 2;
  let py = window.innerHeight / 2;
  let tx = px;
  let ty = py;

  const state = { r: 0, bump: 0, progress: 0, trail: 1 };

  intro.addEventListener('pointermove', function (e) {
    tx = e.clientX;
    ty = e.clientY;
  });

  // 누르면 구멍이 잠깐 넓어진다
  intro.addEventListener('pointerdown', function () {
    gsap.to(state, { bump: 55, duration: 0.35, ease: 'power2.out' });
  });
  intro.addEventListener('pointerup', function () {
    gsap.to(state, { bump: 0, duration: 0.9, ease: 'elastic.out(1, 0.5)' });
  });

  // 잔상 - 앞선 원을 하나씩 늦게 따라가며 사슬을 이룬다
  const chain = trails.map(function () { return { x: px, y: py }; });

  let running = true;

  (function loop() {
    px += (tx - px) * 0.14;
    py += (ty - py) * 0.14;

    const r = Math.max(0, state.r + state.bump);

    // 구멍이 커져도 찢긴 정도가 같아 보이도록 왜곡을 비율대로 키운다
    warp.setAttribute('scale', (70 * Math.min(r / 84, 7)).toFixed(1));

    hole.setAttribute('cx', px.toFixed(1));
    hole.setAttribute('cy', py.toFixed(1));
    hole.setAttribute('rx', (r * WIDE).toFixed(1));
    hole.setAttribute('ry', (r * TALL).toFixed(1));

    let leadX = px;
    let leadY = py;
    for (let i = 0; i < chain.length; i++) {
      const c = chain[i];
      c.x += (leadX - c.x) * 0.13;
      c.y += (leadY - c.y) * 0.13;
      leadX = c.x;
      leadY = c.y;

      // 뒤로 갈수록 작아지고 더 납작해진다
      const k = (0.7 - i * 0.3) * state.trail;
      const el = trails[i];
      el.setAttribute('cx', c.x.toFixed(1));
      el.setAttribute('cy', c.y.toFixed(1));
      el.setAttribute('rx', (r * WIDE * k).toFixed(1));
      el.setAttribute('ry', (r * TALL * k * 0.8).toFixed(1));
    }

    if (running) requestAnimationFrame(loop);
  })();

  const LOAD = 2.6;

  gsap.timeline()
    // 구멍이 열리며 시작
    .to(state, { r: 84, duration: 1.1, ease: 'expo.out' }, 0)
    // 진행률 - 눈금선과 숫자가 함께 찬다
    .to(state, {
      progress: 1,
      duration: LOAD,
      ease: 'power2.inOut',
      onUpdate: function () {
        countEl.textContent = String(Math.round(state.progress * 100)).padStart(3, '0');
        rule.style.transform = 'scaleX(' + state.progress.toFixed(4) + ')';
        // 배경의 천이 이 진행률에 맞춰 짜인다
        document.dispatchEvent(new CustomEvent('intro:progress', { detail: state.progress }));
      }
    }, 0.2)
    // 다 차면 눈금이 반대쪽으로 걷힌다
    .to(rule, {
      scaleX: 0, transformOrigin: 'right center',
      duration: 0.7, ease: 'power3.inOut'
    }, LOAD + 0.45)
    .to(countEl, { opacity: 0, duration: 0.5, ease: 'power2.out' }, LOAD + 0.45)
    // 잔상은 본체로 빨려들듯 사라진다
    .to(state, { trail: 0, duration: 0.6, ease: 'power2.in' }, LOAD + 0.45)
    // 구멍이 화면을 삼키며 열린다
    .to(state, {
      r: Math.hypot(window.innerWidth, window.innerHeight),
      duration: 1.5,
      ease: 'expo.inOut',
      onComplete: function () {
        running = false;
        document.documentElement.classList.remove('is-intro');
        intro.remove();
        // 스크롤이 잠겨 있던 동안 잡힌 위치값을 다시 계산한다
        if (window.ScrollTrigger) ScrollTrigger.refresh();
      }
    }, LOAD + 0.55)
    // 막이 걷히는 동안 이미 히어로가 살아나 있도록 먼저 신호를 보낸다
    .add(handoff, LOAD + 0.75);
})();


// 타이틀 - 천의 물결이 글자로 이어진다
(function () {
  const inner = document.querySelector('.sc-intro .intro-inner');
  if (!inner) return;

  // 글자 단위로 쪼갠다 (<em> 강조 글자는 통째로 한 글자 취급)
  const chars = [];
  inner.querySelectorAll('.line-in').forEach(function (line) {
    const frag = document.createDocumentFragment();

    Array.from(line.childNodes).forEach(function (node) {
      if (node.nodeType === 1) {
        node.classList.add('ch');
        frag.appendChild(node);
        chars.push(node);
        return;
      }
      Array.from(node.textContent).forEach(function (c) {
        const span = document.createElement('span');
        span.className = 'ch';
        span.textContent = c === ' ' ? ' ' : c;
        frag.appendChild(span);
        chars.push(span);
      });
    });

    line.textContent = '';
    line.appendChild(frag);
  });

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // 강조 글자는 따로 연출한다
  const accents = chars.filter(function (c) { return c.tagName === 'EM'; });
  const plain = chars.filter(function (c) { return c.tagName !== 'EM'; });

  // 줄마다 선을 하나씩 깔아둔다
  const sweeps = [];
  inner.querySelectorAll('.title .line').forEach(function (line) {
    const bar = document.createElement('i');
    bar.className = 'sweep';
    line.appendChild(bar);
    sweeps.push(bar);
  });

  // 강조 글자를 세로 릴로 바꾼다 (오도미터가 숫자를 굴리는 방식)
  // 아래로 삐져나오는 글자는 칸에 잘리므로 제외한다
  const POOL = 'abcdefhiklmnorstuvwxz';
  const REEL_LEN = 16;
  const reels = accents.map(function (em) {
    const finalChar = em.textContent.trim();

    // 칸 너비를 최종 글자에 맞춰 고정 - 이래야 문장이 안 흔들린다
    const width = em.getBoundingClientRect().width;

    const mask = document.createElement('span');
    mask.className = 'reel-mask';
    const reel = document.createElement('span');
    reel.className = 'reel';

    for (let i = 0; i < REEL_LEN; i++) {
      const cell = document.createElement('i');
      cell.textContent = i === REEL_LEN - 1
        ? finalChar
        : POOL[(Math.random() * POOL.length) | 0];
      reel.appendChild(cell);
    }

    mask.appendChild(reel);
    em.dataset.char = finalChar;
    em.textContent = '';
    em.appendChild(mask);
    em.classList.add('reeling');
    em.style.width = width + 'px';

    return reel;
  });

  // 릴이 멈추면 껍데기를 걷어내고 평범한 글자로 되돌린다
  function clearReels() {
    accents.forEach(function (em) {
      em.textContent = em.dataset.char;
      em.classList.remove('reeling');
      em.style.width = '';
    });
  }

  gsap.set(inner, { autoAlpha: 0 });
  document.addEventListener('intro:done', start, { once: true });

  function start() {
    gsap.set(inner, { autoAlpha: 1 });
    // 강조 글자는 슬롯이 돌기 시작할 때 나타난다
    gsap.set(accents, { opacity: 0 });

    gsap.timeline({ defaults: { ease: 'expo.out' }, onComplete: ripple })
      .from('.sc-intro .eyebrow', { opacity: 0, y: 12, duration: 1 }, 0)

      // 1. 선이 먼저 그어진다
      .to(sweeps, {
        scaleX: 1, transformOrigin: 'right center',
        duration: 0.85, stagger: 0.12, ease: 'power3.inOut'
      }, 0.1)

      // 2. 글자가 선 위로 접혀 있다가 펼쳐진다
      .from(plain, {
        yPercent: 115,
        rotateX: -96,
        z: -180,
        opacity: 0,
        duration: 1.25,
        stagger: { each: 0.022 }
      }, 0.5)

      // 3. 전체 초점이 맞아 들어온다
      .from('.sc-intro .title', { filter: 'blur(18px)', duration: 1.4 }, 0.5)

      // 4. 강조 글자가 나타나고 릴이 돌다 제 글자에 멈춘다
      .to(accents, { opacity: 1, duration: 0.5, ease: 'power2.out' }, 1.0)
      .fromTo(reels,
        { yPercent: 0 },
        {
          yPercent: function (_, el) { return -(el.childElementCount - 1) / el.childElementCount * 100; },
          duration: 2,
          ease: 'expo.out',
          stagger: 0.18,
          onComplete: clearReels
        }, 1.0)

      // 5. 선이 반대 방향으로 걷힌 뒤 지운다
      .to(sweeps, {
        scaleX: 0, transformOrigin: 'left center',
        duration: 0.9, stagger: 0.1, ease: 'power3.inOut',
        onComplete: function () {
          sweeps.forEach(function (bar) { bar.remove(); });
        }
      }, 1.6);
  }

  // 등장이 끝나면 천처럼 계속 일렁인다
  function ripple() {
    (function loop() {
      const t = performance.now() * 0.001;
      for (let i = 0; i < chars.length; i++) {
        const phase = t * 1.05 + i * 0.24;
        chars[i].style.transform =
          'translateY(' + (Math.sin(phase) * 3.4).toFixed(2) + 'px)' +
          ' rotate(' + (Math.sin(phase - 0.5) * 1.2).toFixed(2) + 'deg)';
      }
      requestAnimationFrame(loop);
    })();
  }

  // 텍스트 블록 전체가 마우스를 아주 조금 따라간다
  let x = 0, y = 0, tx = 0, ty = 0;

  window.addEventListener('mousemove', e => {
    tx = (e.clientX - window.innerWidth / 2) * 0.014;
    ty = (e.clientY - window.innerHeight / 2) * 0.014;
  });

  (function loop() {
    x += (tx - x) * 0.04;
    y += (ty - y) * 0.04;
    inner.style.transform = 'translate(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px)';
    requestAnimationFrame(loop);
  })();
})();


// 배경 - three.js 점으로 짜인 천
(function () {
  const canvas = document.querySelector('.sc-intro .space-canvas');
  if (!canvas || typeof THREE === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(pixelRatio);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 300);
  camera.position.z = 34;

  const group = new THREE.Group();
  group.rotation.z = -0.12;
  scene.add(group);

  // 가로로 긴 격자 - 천을 짜는 실의 교차점이라고 보면 된다
  const SEG_X = 640;
  const SEG_Y = 112;
  const WIDTH = 72;
  const HEIGHT = 11;
  const COUNT = SEG_X * SEG_Y;

  const pos = new Float32Array(COUNT * 3);
  const scatter = new Float32Array(COUNT * 3);
  const rand = new Float32Array(COUNT);

  let i = 0;
  for (let ix = 0; ix < SEG_X; ix++) {
    for (let iy = 0; iy < SEG_Y; iy++) {
      pos[i * 3] = -WIDTH / 2 + (ix / (SEG_X - 1)) * WIDTH;
      pos[i * 3 + 1] = -HEIGHT / 2 + (iy / (SEG_Y - 1)) * HEIGHT;
      pos[i * 3 + 2] = 0;

      const t = Math.acos(2 * Math.random() - 1);
      const p = Math.random() * Math.PI * 2;
      scatter[i * 3] = Math.sin(t) * Math.cos(p);
      scatter[i * 3 + 1] = Math.sin(t) * Math.sin(p);
      scatter[i * 3 + 2] = Math.cos(t);

      rand[i] = Math.random();
      i++;
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geometry.setAttribute('aScatter', new THREE.BufferAttribute(scatter, 3));
  geometry.setAttribute('aRand', new THREE.BufferAttribute(rand, 1));

  const VERT = [
    'attribute vec3 aScatter;',
    'attribute float aRand;',
    'uniform float uTime;',
    'uniform float uPixelRatio;',
    'uniform vec2 uMouse;',
    'uniform vec2 uAspect;',
    'uniform float uRadius;',
    'uniform float uEntry;',
    'varying vec3 vNormal;',
    'varying float vRand;',
    // 격자 좌표를 천의 실제 모양으로 옮긴다
    'vec3 cloth(vec2 g, float t){',
    '  float x = g.x;',
    '  float y = g.y;',
    // 길이 방향으로 흘러가는 물결 - 주기가 다른 파형을 겹친다
    '  float w = sin(x * 0.15 + t * 0.62) * 1.9',
    '          + sin(x * 0.33 - t * 0.44) * 0.75',
    '          + sin(x * 0.06 + y * 0.42 + t * 0.31) * 1.5;',
    // 폭 방향 비틀림 - 천이 꼬이면서 앞뒷면이 드러난다
    '  float a = sin(x * 0.098 + t * 0.36) * 1.05',
    '          + sin(x * 0.041 - t * 0.23) * 0.62;',
    '  vec3 p;',
    '  p.x = x;',
    '  p.y = y * cos(a) + w + x * 0.13;',
    '  p.z = y * sin(a) + sin(x * 0.21 - t * 0.5) * 1.1;',
    '  return p;',
    '}',
    'void main(){',
    '  vec2 g = position.xy;',
    '  vec3 p = cloth(g, uTime);',
    // 이웃 두 점을 더 구해서 그 면의 법선을 얻는다
    '  vec3 gx = cloth(g + vec2(0.35, 0.0), uTime);',
    '  vec3 gy = cloth(g + vec2(0.0, 0.35), uTime);',
    '  vec3 n = normalize(cross(gx - p, gy - p));',
    // 흩어지기 전 위치를 먼저 투영해 커서와의 거리를 잰다
    '  vec4 pr0 = projectionMatrix * modelViewMatrix * vec4(p, 1.0);',
    '  vec2 ndc = pr0.xy / pr0.w;',
    '  float f = smoothstep(uRadius, 0.0, distance(ndc * uAspect, uMouse * uAspect));',
    '  p += n * f * 1.3;',
    '  p += aScatter * f * (0.4 + aRand * 1.2);',
    // 진입할 때 한 번 흩어졌다가 천으로 모인다
    '  p += aScatter * (1.0 - uEntry) * (6.0 + aRand * 16.0);',
    '  vNormal = normalize(normalMatrix * n);',
    '  vRand = aRand;',
    '  vec4 mv = modelViewMatrix * vec4(p, 1.0);',
    '  gl_PointSize = (0.85 + pow(aRand, 2.0) * 0.95) * uPixelRatio * (72.0 / -mv.z);',
    '  gl_Position = projectionMatrix * mv;',
    '}'
  ].join('\n');

  const FRAG = [
    'varying vec3 vNormal;',
    'varying float vRand;',
    'void main(){',
    '  vec2 uv = gl_PointCoord - 0.5;',
    '  float d = length(uv);',
    '  if (d > 0.5) discard;',
    '  float z = sqrt(max(0.0, 0.25 - d * d)) * 2.0;',
    '  vec3 n = normalize(vec3(uv * 2.0, z));',
    '  vec3 L = normalize(vec3(-0.4, 0.6, 0.7));',
    '  float diff = dot(n, L) * 0.5 + 0.5;',
    // 천은 앞뒤가 다 보이므로 법선의 방향을 접어서 쓴다
    '  float form = abs(dot(vNormal, L));',
    '  form = 0.16 + 0.84 * pow(form, 1.5);',
    '  vec3 col = vec3(0.014, 0.014, 0.017);',
    '  col += vec3(0.5, 0.5, 0.54) * pow(diff, 2.2) * form * (0.72 + vRand * 0.28);',
    '  col += vec3(1.0) * pow(form, 4.0) * 0.16;',
    '  gl_FragColor = vec4(col, smoothstep(0.5, 0.42, d));',
    '}'
  ].join('\n');

  const uniforms = {
    uTime: { value: 0 },
    uPixelRatio: { value: pixelRatio },
    uMouse: { value: new THREE.Vector2(99, 99) },
    uAspect: { value: new THREE.Vector2(1, 1) },
    uRadius: { value: 0.5 },
    uEntry: { value: 0 }
  };

  group.add(new THREE.Points(geometry, new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    depthWrite: true
  })));

  const target = new THREE.Vector2(99, 99);
  let rx = 0, ry = 0, tRx = 0, tRy = 0;
  let scrollT = 0;
  let camZ = 34;

  window.addEventListener('mousemove', function (e) {
    const r = canvas.getBoundingClientRect();
    target.set(
      ((e.clientX - r.left) / r.width) * 2 - 1,
      -((e.clientY - r.top) / r.height) * 2 + 1
    );
    tRx = (e.clientY / window.innerHeight - 0.5) * 0.3;
    tRy = (e.clientX / window.innerWidth - 0.5) * 0.28;
  });

  window.addEventListener('scroll', function () {
    scrollT = Math.min(1, window.scrollY / window.innerHeight);
  }, { passive: true });

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    uniforms.uAspect.value.set(camera.aspect, 1);
    // 좁은 화면에서는 천이 화면을 가로지르도록 뒤로 뺀다
    camZ = w / h < 1 ? 52 : 34;
  }

  window.addEventListener('resize', resize);
  resize();

  // 로딩 진행률만큼 천이 짜인다 - 인트로 구멍으로 그 과정이 보인다
  const reveal = { v: 0 };

  document.addEventListener('intro:progress', function (e) {
    uniforms.uEntry.value = e.detail;
  });

  document.addEventListener('intro:done', function () {
    // 막이 걷힐 때 천 쪽으로 한 걸음 들어간다
    gsap.to(uniforms.uEntry, { value: 1, duration: 1.2, ease: 'expo.out' });
    gsap.to(reveal, { v: 1, duration: 2.4, ease: 'expo.out' });
  }, { once: true });

  const clock = new THREE.Clock();

  (function loop() {
    uniforms.uTime.value = clock.getElapsedTime();
    uniforms.uMouse.value.lerp(target, 0.1);

    rx += (tRx - rx) * 0.03;
    ry += (tRy - ry) * 0.03;

    group.rotation.x = rx;
    group.rotation.y = ry;
    group.rotation.z = -0.12 + scrollT * 0.22;

    // 인트로 동안은 멀리서 보다가 막이 걷힐 때 다가간다
    camera.position.z = camZ + (1 - reveal.v) * 13;

    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  })();
})();




// 프로젝트 섹션 헤드라인 - 단어가 차례로 올라오고, 짚은 단어만 살아난다
(function () {
  const title = document.querySelector('.sc-projects .desc-area .title');
  if (!title) return;

  // 단어 단위로 마스크에 담는다 (<br>은 그대로 둔다)
  const words = [];
  const frag = document.createDocumentFragment();

  Array.from(title.childNodes).forEach(function (node) {
    if (node.nodeName === 'BR') {
      frag.appendChild(node.cloneNode());
      return;
    }

    node.textContent.split(/(\s+)/).forEach(function (part) {
      if (!part) return;
      if (!part.trim()) {
        frag.appendChild(document.createTextNode(' '));
        return;
      }
      const mask = document.createElement('span');
      mask.className = 'w-mask';
      const inner = document.createElement('span');
      inner.className = 'w-in';
      inner.textContent = part;
      mask.appendChild(inner);
      frag.appendChild(mask);
      words.push(inner);
    });
  });

  title.textContent = '';
  title.appendChild(frag);

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // 화면에 들어올 때 비스듬히 솟아오른다
  gsap.from(words, {
    yPercent: 130,
    skewY: 7,
    opacity: 0,
    duration: 1.3,
    ease: 'expo.out',
    stagger: 0.085,
    scrollTrigger: {
      trigger: title,
      start: 'top 82%',
      once: true
    }
  });

  // 짚은 단어는 밝아지며 떠오르고 나머지는 물러난다
  words.forEach(function (word) {
    word.parentNode.addEventListener('mouseenter', function () {
      gsap.to(word, { y: -8, color: '#ffffff', duration: 0.45, ease: 'expo.out' });
      words.forEach(function (other) {
        if (other !== word) gsap.to(other, { opacity: 0.35, duration: 0.45 });
      });
    });
  });

  title.addEventListener('mouseleave', function () {
    gsap.to(words, { y: 0, opacity: 1, color: '#888888', duration: 0.6, ease: 'power3.out' });
  });
})();


//sc-project
// 카드를 각각 돌리지 않는다. 카드는 평평한 한 줄로 두고, 월드 공간 높이장이
// 줄 전체를 하나의 띠처럼 휜다. 깊이는 대칭 포물선이 아니라 sin(pi*q)*exp(-q*q)
// 비대칭 S자라서 왼쪽이 앞으로, 오른쪽이 뒤로 흐른다. 대칭 포물선을 쓰면 원통이 된다.
(function () {
  const section = document.querySelector('.sc-projects');
  const sliderEls = Array.from(document.querySelectorAll('.sc-projects .slider'));
  if (!section || !sliderEls.length || !window.THREE) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const CAM_Z = 1500;
  const GAP = 140;          // 카드 사이 간격(px)
  const LERP = 0.09;
  const VEL_NORM = 70;      // 이 속도(px/프레임)에서 변형이 최대가 된다
  const MAX_TEXTURE = 1600;

  // 띠 모양을 정하는 값들
  const SHEET_T = 1.15;     // S가 프레임의 얼마를 도는가
  const SHEET_C = 1;        // 0이면 대칭 그릇(=원통), 1이면 비대칭 S
  const SHEET_DEPTH = 0.2;  // 파고. 프러스텀 반너비에 대한 비율
  const SHEET_VEL = 1.1;    // 빠를수록 파고가 커지는 정도
  const LEAN_DOOR = -0.12;  // 문짝처럼 한쪽으로 기우는 정도

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  } catch (err) {
    return;
  }
  if (!renderer || !renderer.getContext()) return;

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.className = 'slider-canvas';

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 1, 20000);
  camera.position.z = CAM_Z;

  let dirty = true;
  let onScreen = true;

  // ── 띠(sheet) — 원본과 같은 수식 ─────────────────────────────
  const SHEET_GLSL = [
    'const float SHEET_PI = 3.141592653589793;',
    'const float SHEET_BANK = -0.16;',   // 파형 기울기를 따라 눕는 각
    'const float SHEET_DIAG = 0.03;',    // 띠 전체가 오른쪽으로 살짝 올라간다
    'const float SHEET_REAR_Y = 0.1;',   // 흐를 때 뒤쪽이 들린다
    'const float SHEET_REAR_Z = 0.2;',
    'const float SHEET_VTWIST = 1.8;',   // 흐를 때 양 끝이 비틀린다
    'const float SHEET_TAIL = 1.0;',
    'const float SHEET_SHIFT = -0.2;',
    'uniform float u_sheetW;',
    'uniform float u_sheetD;',
    'uniform float u_sheetT;',
    'uniform float u_sheetC;',
    'uniform float u_sheetP;',
    'uniform float u_sheetV;',
    'uniform float u_leanA;',
    'uniform float u_leanW;',
    'float sheetQ(float wx) {',
    '  return wx / max(u_sheetW, 0.0001) * u_sheetT + SHEET_SHIFT;',
    '}',
    'float sheetShape(float q) {',
    '  return mix(1.0 - q * q, sin(SHEET_PI * q), u_sheetC) * exp(-SHEET_TAIL * q * q);',
    '}',
    'float sheetShapeSlope(float q) {',
    '  float g = exp(-SHEET_TAIL * q * q);',
    '  float bowl = -2.0 * q * (1.0 + SHEET_TAIL * (1.0 - q * q));',
    '  float ess = SHEET_PI * cos(SHEET_PI * q) - 2.0 * SHEET_TAIL * q * sin(SHEET_PI * q);',
    '  return mix(bowl, ess, u_sheetC) * g;',
    '}',
    'float sheetZ(float wx) {',
    '  return -u_sheetD * sheetShape(sheetQ(wx));',
    '}',
    'float sheetRoll(float wx) {',
    '  if (u_sheetW < 0.001) return 0.0;',
    '  return SHEET_BANK * sheetShapeSlope(sheetQ(wx)) / SHEET_PI * u_sheetC * u_sheetP;',
    '}',
    'vec4 sheetWind(vec4 w) {',
    '  float a = sheetRoll(w.x);',
    '  if (u_sheetV > 0.001 && u_sheetW > 0.001 && u_sheetP > 0.001) {',
    '    float qe = w.x / u_sheetW;',
    '    a += SHEET_VTWIST * u_sheetV * smoothstep(0.3, 0.9, abs(qe)) * sign(qe) * u_sheetP;',
    '  }',
    '  if (abs(a) < 0.0001) return w;',
    '  float s = sin(a);',
    '  float c = cos(a);',
    '  return vec4(w.x, w.y * c - w.z * s, w.y * s + w.z * c, w.w);',
    '}',
    'vec4 sheet(vec4 w) {',
    '  w = sheetWind(w);',
    '  w.z += sheetZ(w.x) * u_sheetP;',
    '  if (u_sheetW > 0.001) {',
    '    float qw = w.x / u_sheetW;',
    '    w.y += SHEET_DIAG * w.x * u_sheetP;',
    '    if (u_sheetV > 0.001) {',
    '      float m = 1.0 - smoothstep(-1.0, 0.3, qw);',
    '      w.y += SHEET_REAR_Y * u_sheetW * u_sheetV * m * u_sheetP;',
    '      w.z += SHEET_REAR_Z * u_sheetW * u_sheetV * m * u_sheetP;',
    '    }',
    '  }',
    '  return w;',
    '}',
    'float leanRamp(float s) {',
    '  s = clamp(s, -1.0, 1.0);',
    '  return s * (1.5 - 0.5 * s * s);',
    '}',
    'vec4 lean(vec4 w, float k) {',
    '  if (u_leanW > 0.001 && k > 0.001) {',
    '    w.z += u_leanA * leanRamp(w.x / u_leanW) * k;',
    '  }',
    '  return w;',
    '}'
  ].join('\n');

  const CARD_VERT = SHEET_GLSL + '\n' + [
    'varying vec2 vUv;',
    'void main() {',
    '  vUv = uv;',
    '  vec4 w = modelMatrix * vec4(position, 1.0);',
    '  w = sheet(w);',
    '  w = lean(w, u_sheetP);',
    '  gl_Position = projectionMatrix * viewMatrix * w;',
    '}'
  ].join('\n');

  const CARD_FRAG = [
    'uniform sampler2D uTexture;',
    'uniform vec2 uCover;',
    'uniform vec2 uSize;',
    'uniform float uRadius;',
    'uniform float uOpacity;',
    'uniform float uMirror;',
    'varying vec2 vUv;',
    'void main() {',
    '  vec2 uv = (vUv - 0.5) * uCover + 0.5;',
    '  vec4 color = texture2D(uTexture, uv);',
    '  vec2 p = (vUv - 0.5) * uSize;',
    '  vec2 d = abs(p) - (uSize * 0.5 - vec2(uRadius));',
    '  float dist = length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - uRadius;',
    '  float alpha = 1.0 - smoothstep(-1.0, 1.0, dist);',
    '  if (uMirror > 0.5) alpha *= pow(vUv.y, 4.0);',
    '  gl_FragColor = vec4(color.rgb, color.a * alpha * uOpacity);',
    '}'
  ].join('\n');

  // ── 바닥 — 카드와 같은 lean을 먹어야 두 면이 한 덩어리로 보인다 ──
  const FLOOR_VERT = SHEET_GLSL + '\n' + [
    'uniform float u_run;',
    'varying vec2 vUv;',
    'varying float vFar;',
    'void main() {',
    '  vUv = uv;',
    '  vec4 w = modelMatrix * vec4(position, 1.0);',
    '  vFar = -w.z / max(u_run, 0.0001);',
    '  w = lean(w, u_sheetP);',
    '  gl_Position = projectionMatrix * viewMatrix * w;',
    '}'
  ].join('\n');

  const FLOOR_FRAG = [
    'uniform vec3 u_c0;',
    'uniform vec3 u_c1;',
    'uniform float u_alpha;',
    'uniform float u_grid;',
    'uniform vec2 u_gridF;',
    'varying vec2 vUv;',
    'varying float vFar;',
    'void main() {',
    '  float fade = 1.0 - smoothstep(0.2, 0.95, vFar);',
    '  float contact = exp(-abs(vFar) * 14.0);',
    '  vec3 col = mix(u_c1, u_c0, smoothstep(0.0, 0.8, vFar));',
    '  col *= 1.0 - contact * 0.55;',
    '  vec2 g = vec2(vUv.x * u_gridF.x, vFar * u_gridF.y);',
    '  vec2 gf = abs(fract(g) - 0.5);',
    '  vec2 gw = fwidth(g) * 1.5;',
    '  vec2 lines = vec2(1.0) - smoothstep(vec2(0.0), gw, gf);',
    '  float line = max(lines.x, lines.y);',
    '  col += line * u_grid * fade;',
    '  gl_FragColor = vec4(col, u_alpha * fade);',
    '}'
  ].join('\n');

  // 셰이더가 옮긴 정점을 JS에서도 똑같이 따라가야 DOM 캡션이 카드에 붙는다
  const SHEET_PI = Math.PI;
  const SHEET_BANK = -0.16;
  const SHEET_DIAG = 0.03;
  const SHEET_REAR_Y = 0.1;
  const SHEET_REAR_Z = 0.2;
  const SHEET_VTWIST = 1.8;
  const SHEET_TAIL = 1.0;
  const SHEET_SHIFT = -0.2;

  function smoothstep(a, b, x) {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  }
  function sheetShape(q) {
    const bowl = 1 - q * q;
    const ess = Math.sin(SHEET_PI * q);
    return (bowl + (ess - bowl) * SHEET_C) * Math.exp(-SHEET_TAIL * q * q);
  }
  function sheetShapeSlope(q) {
    const g = Math.exp(-SHEET_TAIL * q * q);
    const bowl = -2 * q * (1 + SHEET_TAIL * (1 - q * q));
    const ess = SHEET_PI * Math.cos(SHEET_PI * q) - 2 * SHEET_TAIL * q * Math.sin(SHEET_PI * q);
    return (bowl + (ess - bowl) * SHEET_C) * g;
  }
  function leanRamp(s) {
    s = Math.min(1, Math.max(-1, s));
    return s * (1.5 - 0.5 * s * s);
  }

  function deform(x, y, u) {
    let z = 0;
    const q = x / Math.max(u.W, 0.0001) * SHEET_T + SHEET_SHIFT;

    let a = u.W < 0.001 ? 0 : SHEET_BANK * sheetShapeSlope(q) / SHEET_PI * SHEET_C;
    if (u.V > 0.001 && u.W > 0.001) {
      const qe = x / u.W;
      a += SHEET_VTWIST * u.V * smoothstep(0.3, 0.9, Math.abs(qe)) * Math.sign(qe);
    }
    if (Math.abs(a) >= 0.0001) {
      const s = Math.sin(a);
      const c = Math.cos(a);
      const ny = y * c - z * s;
      z = y * s + z * c;
      y = ny;
    }

    z += -u.D * sheetShape(q);

    if (u.W > 0.001) {
      const qw = x / u.W;
      y += SHEET_DIAG * x;
      if (u.V > 0.001) {
        const m = 1 - smoothstep(-1, 0.3, qw);
        y += SHEET_REAR_Y * u.W * u.V * m;
        z += SHEET_REAR_Z * u.W * u.V * m;
      }
    }

    if (u.W > 0.001) z += u.leanA * leanRamp(x / u.W);

    const scale = CAM_Z / (CAM_Z - z);
    return { sx: u.stageW / 2 + x * scale, sy: u.stageH / 2 - y * scale };
  }

  function makeSource(item) {
    const video = item.querySelector('.thumb-area video');
    if (video) {
      const texture = new THREE.VideoTexture(video);
      texture.minFilter = THREE.LinearFilter;
      texture.encoding = THREE.sRGBEncoding;
      const played = video.play();
      if (played && played.catch) played.catch(function () {});
      video.addEventListener('loadedmetadata', function () { dirty = true; });
      return {
        texture: texture,
        aspect: function () { return (video.videoWidth || 16) / (video.videoHeight || 9); }
      };
    }

    const img = item.querySelector('.thumb-area img');
    if (img) {
      const texture = new THREE.Texture();
      texture.minFilter = THREE.LinearFilter;
      texture.encoding = THREE.sRGBEncoding;

      function useImage() {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        if (!w || !h) return;
        // 원본이 크면 그대로 올릴 때 GPU 메모리를 크게 먹는다. 캔버스로 줄여서 올린다
        if (Math.max(w, h) > MAX_TEXTURE) {
          const scale = MAX_TEXTURE / Math.max(w, h);
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(w * scale);
          canvas.height = Math.round(h * scale);
          canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
          texture.image = canvas;
        } else {
          texture.image = img;
        }
        texture.needsUpdate = true;
        dirty = true;
      }

      if (img.complete && img.naturalWidth) useImage();
      else img.addEventListener('load', useImage, { once: true });

      return {
        texture: texture,
        aspect: function () { return (img.naturalWidth || 16) / (img.naturalHeight || 9); }
      };
    }

    // 이미지가 없는 준비중 카드는 라벨만 그린 캔버스를 텍스처로 쓴다
    const label = item.querySelector('.thumb-empty span');
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#16181b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'rgba(255,255,255,0.16)';
    ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = '500 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label ? label.textContent : '', canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.encoding = THREE.sRGBEncoding;
    return { texture: texture, aspect: function () { return 16 / 9; } };
  }

  // 모든 카드가 같은 띠 위에 있어야 하므로 sheet 유니폼은 하나를 공유한다
  const sheetUniforms = {
    u_sheetW: { value: 0 },
    u_sheetD: { value: 0 },
    u_sheetT: { value: SHEET_T },
    u_sheetC: { value: SHEET_C },
    u_sheetP: { value: 1 },
    u_sheetV: { value: 0 },
    u_leanA: { value: 0 },
    u_leanW: { value: 0 }
  };

  function makeMaterial(source, mirror) {
    const uniforms = {
      uTexture: { value: source.texture },
      uCover: { value: new THREE.Vector2(1, 1) },
      uSize: { value: new THREE.Vector2(1, 1) },
      uRadius: { value: 26 },
      uOpacity: { value: mirror ? 0.13 : 1 },
      uMirror: { value: mirror ? 1 : 0 }
    };
    Object.keys(sheetUniforms).forEach(function (key) { uniforms[key] = sheetUniforms[key]; });

    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: !mirror,
      vertexShader: CARD_VERT,
      fragmentShader: CARD_FRAG,
      uniforms: uniforms
    });
  }

  const floorUniforms = {
    u_run: { value: 1 },
    u_c0: { value: new THREE.Color(0x0b0c0e) },
    u_c1: { value: new THREE.Color(0x1c2026) },
    u_alpha: { value: 1 },
    u_grid: { value: 0.34 },
    u_gridF: { value: new THREE.Vector2(30, 11) }
  };
  Object.keys(sheetUniforms).forEach(function (key) { floorUniforms[key] = sheetUniforms[key]; });

  const floorMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    extensions: { derivatives: true },
    vertexShader: FLOOR_VERT,
    fragmentShader: FLOOR_FRAG,
    uniforms: floorUniforms
  });

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 64, 64), floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.renderOrder = -100;
  scene.add(floor);

  const panels = sliderEls.map(function (el) {
    const items = Array.from(el.querySelectorAll('.content-item'));
    if (!items.length) return null;

    const group = new THREE.Group();
    group.visible = false;
    scene.add(group);

    const cards = items.map(function (item) {
      const source = makeSource(item);
      const geometry = new THREE.PlaneGeometry(1, 1, 64, 24);

      const material = makeMaterial(source, false);
      const mesh = new THREE.Mesh(geometry, material);
      group.add(mesh);

      const mirrorMaterial = makeMaterial(source, true);
      const mirror = new THREE.Mesh(geometry, mirrorMaterial);
      mirror.renderOrder = -50;
      group.add(mirror);

      return {
        item: item,
        mesh: mesh,
        mirror: mirror,
        material: material,
        mirrorMaterial: mirrorMaterial,
        aspect: source.aspect
      };
    });

    const panel = {
      el: el,
      cards: cards,
      group: group,
      cardW: 0,
      cardH: 0,
      floorY: 0,
      slot: 0,
      total: 0,
      stageW: 0,
      stageH: 0,
      ready: false,
      target: 0,
      current: 0,
      vel: 0
    };

    // 숨은 패널은 폭이 0이라 잴 수 없다. 탭으로 보일 때 다시 잰다
    panel.measure = function () {
      const first = items[0];
      const thumb = first.querySelector('.thumb-area');
      panel.cardW = first.offsetWidth;
      panel.cardH = thumb ? thumb.offsetHeight : 0;
      if (!panel.cardW || !panel.cardH) {
        panel.ready = false;
        return;
      }

      // 카드는 화면 한가운데. 아래 남는 자리에 바닥이 깔린다
      panel.stageH = Math.round(panel.cardH + 380);
      panel.floorY = -panel.cardH / 2 - 24;
      panel.slot = panel.cardW + GAP;
      panel.total = cards.length * panel.slot;

      el.style.height = panel.stageH + 'px';
      panel.stageW = el.clientWidth;
      panel.ready = true;
    };

    panel.resize = function () {
      if (!panel.ready) return;
      renderer.setSize(panel.stageW, panel.stageH, false);
      camera.aspect = panel.stageW / panel.stageH;
      camera.fov = 2 * Math.atan((panel.stageH / 2) / CAM_Z) * 180 / Math.PI;
      camera.updateProjectionMatrix();

      // 프러스텀 반너비·반높이. 원본이 띠의 기준으로 쓰는 값
      const halfH = panel.stageH / 2;
      const halfW = panel.stageW / 2;
      const run = halfW * 4;

      floor.position.y = panel.floorY;
      floor.position.z = -run / 2;
      floor.scale.set(halfW * 6, run, 1);
      floorUniforms.u_run.value = run;

      panel.halfW = halfW;
      panel.halfH = halfH;
    };

    panel.layout = function () {
      if (!panel.ready) return;

      const W = panel.halfW;
      const V = panel.vel;

      sheetUniforms.u_sheetW.value = W;
      sheetUniforms.u_sheetD.value = W * SHEET_DEPTH * (1 + SHEET_VEL * V);
      sheetUniforms.u_sheetV.value = V;
      sheetUniforms.u_leanA.value = W * LEAN_DOOR;
      sheetUniforms.u_leanW.value = W;

      const shape = {
        W: W,
        D: W * SHEET_DEPTH * (1 + SHEET_VEL * V),
        V: V,
        leanA: W * LEAN_DOOR,
        stageW: panel.stageW,
        stageH: panel.stageH
      };

      const half = panel.total / 2;
      const halfCardW = panel.cardW / 2;
      const halfCardH = panel.cardH / 2;

      cards.forEach(function (card, i) {
        const raw = i * panel.slot - panel.current + half;
        const x = ((raw % panel.total) + panel.total) % panel.total - half;

        // 회전도 호 배치도 없다. 평평한 한 줄. 휘는 건 셰이더가 한다
        card.mesh.position.set(x, 0, 0);
        card.mesh.scale.set(panel.cardW, panel.cardH, 1);
        card.mesh.renderOrder = -Math.abs(x);

        card.mirror.position.set(x, 2 * panel.floorY, 0);
        card.mirror.scale.set(panel.cardW, -panel.cardH, 1);

        const texAspect = card.aspect();
        const planeAspect = panel.cardW / panel.cardH;
        const cover = planeAspect > texAspect
          ? [1, texAspect / planeAspect]
          : [planeAspect / texAspect, 1];

        [card.material, card.mirrorMaterial].forEach(function (material) {
          material.uniforms.uSize.value.set(panel.cardW, panel.cardH);
          material.uniforms.uCover.value.set(cover[0], cover[1]);
        });

        // 카드 네 변의 중점을 셰이더와 같은 식으로 옮겨 화면 좌표를 낸다
        const left = deform(x - halfCardW, 0, shape);
        const right = deform(x + halfCardW, 0, shape);
        const top = deform(x, halfCardH, shape);
        const bottom = deform(x, -halfCardH, shape);

        const cx = (left.sx + right.sx) / 2;
        const cy = (top.sy + bottom.sy) / 2;
        const sx = Math.abs(right.sx - left.sx) / panel.cardW;
        const sy = Math.abs(bottom.sy - top.sy) / panel.cardH;

        const inView = cx > -panel.cardW && cx < panel.stageW + panel.cardW;
        card.mesh.visible = inView;
        card.mirror.visible = inView;

        // 카드 중심이 무대 밖으로 나가면 캡션끼리 겹친다. 그 전에 접는다
        const edge = panel.cardW * 0.45;
        const style = card.item.style;
        if (!inView || cx < edge || cx > panel.stageW - edge) {
          style.visibility = 'hidden';
          return;
        }
        style.visibility = '';
        style.left = cx + 'px';
        style.top = cy + 'px';
        style.transformOrigin = '50% 50%';
        style.transform = 'translate(-50%, -50%) scale(' + sx + ',' + sy + ')';
        style.zIndex = String(Math.round(100 - Math.abs(x) / 10));
      });
    };

    panel.refresh = function () {
      panel.measure();
      panel.resize();
      panel.layout();
    };

    return panel;
  }).filter(Boolean);

  if (!panels.length) return;

  let active = panels[0];

  function activate(panel) {
    panels.forEach(function (p) { p.group.visible = p === panel; });
    active = panel;
    panel.el.appendChild(renderer.domElement);
    panel.refresh();
    dirty = true;
  }

  // 마우스 그랩 / 터치 스와이프
  let dragging = false;
  let pointerX = 0;
  let moved = 0;
  let velocity = 0;

  sliderEls.forEach(function (el) {
    el.addEventListener('pointerdown', function (e) {
      if (e.button !== 0 || !active.ready) return;
      // 카드 대부분이 링크라 링크 위에서도 드래그를 받아야 한다.
      // 실제로 끌었을 때만 아래 click 핸들러가 이동을 막는다
      dragging = true;
      pointerX = e.clientX;
      moved = 0;
      velocity = 0;
      el.setPointerCapture(e.pointerId);
      el.classList.add('grabbing');
    });

    el.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      const dx = e.clientX - pointerX;
      pointerX = e.clientX;
      moved += Math.abs(dx);
      active.target -= dx;
      // 마지막 몇 프레임을 섞어야 손 떨림에 관성이 튀지 않는다
      velocity = velocity * 0.6 + dx * 0.4;
    });

    function endDrag() {
      if (!dragging) return;
      dragging = false;
      el.classList.remove('grabbing');
      // 관성만큼 더 흐른 뒤 가장 가까운 카드에 물린다
      const flick = Math.max(-3, Math.min(3, -velocity * 8 / active.slot));
      active.target = (Math.round(active.target / active.slot) + Math.round(flick)) * active.slot;
      velocity = 0;
    }

    el.addEventListener('pointerup', endDrag);
    el.addEventListener('pointercancel', endDrag);

    // 가로 휠(트랙패드)만 받는다. 세로 휠은 페이지 스크롤로 넘긴다
    let wheelTimer;
    el.addEventListener('wheel', function (e) {
      if (!active.ready || Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      active.target += e.deltaX;
      clearTimeout(wheelTimer);
      wheelTimer = setTimeout(function () {
        active.target = Math.round(active.target / active.slot) * active.slot;
      }, 160);
    }, { passive: false });

    el.addEventListener('keydown', function (e) {
      if (!active.ready || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
      e.preventDefault();
      const step = e.key === 'ArrowRight' ? 1 : -1;
      active.target = (Math.round(active.target / active.slot) + step) * active.slot;
    });

    // 드래그로 끝난 동작은 링크 이동으로 이어지지 않게
    el.addEventListener('click', function (e) {
      if (moved > 10) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);

    el.addEventListener('dragstart', function (e) { e.preventDefault(); });
  });

  gsap.ticker.add(function () {
    if (!onScreen || !active.ready) return;

    const distance = active.target - active.current;
    const speed = distance * (reduceMotion ? 1 : LERP);

    if (Math.abs(distance) > 0.05 || dragging) {
      active.current += speed;
      dirty = true;
    }

    // 흐르는 속도가 그대로 띠의 파고와 비틀림이 된다
    const wanted = reduceMotion ? 0 : Math.min(1, Math.abs(speed) / VEL_NORM);
    if (Math.abs(wanted - active.vel) > 0.002) {
      active.vel += (wanted - active.vel) * 0.12;
      dirty = true;
    }

    if (dirty) {
      active.layout();
      dirty = false;
    }

    renderer.render(scene, camera);
  });

  // 화면 밖일 때까지 WebGL을 돌릴 이유가 없다
  if (window.IntersectionObserver) {
    new IntersectionObserver(function (entries) {
      onScreen = entries[0].isIntersecting;
    }, { rootMargin: '200px 0px' }).observe(section);
  }

  let resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { active.refresh(); }, 200);
  });

  document.querySelectorAll('.btn-tab').forEach(function (button) {
    button.addEventListener('click', function () {
      const tab = button.getAttribute('data-tab');

      document.querySelectorAll('.btn-tab').forEach(function (btn) {
        btn.classList.toggle('active', btn === button);
      });

      let next = null;
      panels.forEach(function (panel) {
        const visible = panel.el.getAttribute('data-panel') === tab;
        panel.el.classList.toggle('hidden', !visible);
        if (visible) next = panel;
      });
      if (next) activate(next);

      // 패널마다 카드 높이가 달라 핀 구간 길이가 바뀐다
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    });
  });

  // WebGL이 준비된 뒤에야 DOM 썸네일을 감춘다. 초기화에 실패하면 기존 화면이 그대로 남는다
  section.classList.add('is-gl');
  activate(panels[0]);
})();


$(window).mousemove(function(e){

  x=e.clientX;
  y=e.clientY;

  gsap.to('.cursor',{
      x:x,
      y:y,
  })

});


// 히어로 영역에서는 보라 점 커서를 감춘다
(function () {
  const hero = document.querySelector('.sc-intro');
  const cursor = document.querySelector('.curser-wrap');
  if (!hero || !cursor) return;

  hero.addEventListener('mouseenter', function () {
    cursor.classList.add('is-hidden');
  });
  hero.addEventListener('mouseleave', function () {
    cursor.classList.remove('is-hidden');
  });
})();










// 프로젝트 섹션이 화면 하단에 걸린 채 멈추고, 어바웃 섹션이 그 위로 올라와 덮는다
(function () {
  const projects = document.querySelector('.sc-projects');
  const about = document.querySelector('.sc-about');
  if (!projects || !about || !window.ScrollTrigger) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  ScrollTrigger.create({
    trigger: projects,
    start: 'bottom bottom',
    endTrigger: about,
    end: 'top top',
    pin: projects,
    pinSpacing: false,
    anticipatePin: 1
  });
})();
