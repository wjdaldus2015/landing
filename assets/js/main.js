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
const projectSliders = [];

document.querySelectorAll('.sc-projects .slider').forEach(slider => {
  const list = slider.querySelector('.content-list');
  const dotWrap = slider.querySelector('.slider-dots');
  const originals = Array.from(slider.querySelectorAll('.content-item'));
  const count = originals.length;
  let index = 0;

  // 화면 밖 여유 슬롯을 확보해야 순환 지점이 안 보인다
  while (slider.querySelectorAll('.content-item').length < count + 5) {
    originals.forEach(item => {
      const clone = item.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      clone.querySelectorAll('a').forEach(link => link.tabIndex = -1);
      list.appendChild(clone);
    });
  }

  const items = Array.from(slider.querySelectorAll('.content-item'));
  const total = items.length;

  originals.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'dot';
    dot.innerHTML = '<span class="blind">' + (i + 1) + '번째 프로젝트</span>';
    dot.addEventListener('click', () => go(index + ((i - index % count) + count) % count));
    dotWrap.appendChild(dot);
  });
  const dots = Array.from(dotWrap.children);

  function render(animate) {
    items.forEach((item, i) => {
      let offset = (i - index) % total;
      if (offset > total / 2) offset -= total;
      if (offset < -total / 2) offset += total;

      const step = Math.abs(offset);
      const dir = Math.sign(offset);
      const opacity = step > 2 ? 0 : 1;

      // 뒤쪽 끝에서 앞쪽 끝으로 넘어가는 카드는 화면 밖에서 즉시 옮긴다
      const jumped = item.dataset.offset !== undefined &&
                     Math.abs(Number(item.dataset.offset) - offset) > total / 2;
      item.dataset.offset = offset;

      item.classList.toggle('active', step === 0);
      item.style.zIndex = 10 - step;
      item.style.pointerEvents = step > 2 ? 'none' : '';

      const position = {
        xPercent: -50 + dir * (step === 1 ? 108 : step >= 2 ? 190 : 0),
        yPercent: -50,
        scale: step === 0 ? 1 : step === 1 ? 0.72 : 0.52,
        rotateY: dir * (step === 0 ? 0 : 28)
      };

      gsap.to(item, Object.assign({
        opacity: opacity,
        duration: animate && !jumped ? 0.7 : 0,
        ease: 'power3.out'
      }, position));
    });

    const current = ((index % count) + count) % count;
    dots.forEach((dot, i) => dot.classList.toggle('active', i === current));
  }

  function go(i) {
    index = (i % total + total) % total;
    render(true);
  }

  slider.querySelector('.btn-prev').addEventListener('click', () => go(index - 1));
  slider.querySelector('.btn-next').addEventListener('click', () => go(index + 1));

  // 마우스 그랩 / 터치 스와이프
  let dragging = false;
  let startX = 0;
  let moved = 0;

  slider.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    // 화살표·도트·링크 위에서는 드래그를 잡지 않는다.
    // 포인터를 캡처해버리면 클릭이 슬라이더로 가로채여 버튼이 안 눌린다
    if (e.target.closest('.btn-prev, .btn-next, .dot, a')) return;

    dragging = true;
    startX = e.clientX;
    moved = 0;
    slider.setPointerCapture(e.pointerId);
    slider.classList.add('grabbing');
  });

  slider.addEventListener('pointermove', e => {
    if (!dragging) return;
    moved = e.clientX - startX;
  });

  function endDrag() {
    if (!dragging) return;
    dragging = false;
    slider.classList.remove('grabbing');
    if (Math.abs(moved) > 60) go(moved < 0 ? index + 1 : index - 1);
  }

  slider.addEventListener('pointerup', endDrag);
  slider.addEventListener('pointercancel', endDrag);

  // 드래그로 끝난 동작은 링크 이동으로 이어지지 않게
  slider.addEventListener('click', e => {
    if (Math.abs(moved) > 10) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);

  slider.addEventListener('dragstart', e => e.preventDefault());

  render(false);
  projectSliders.push({ el: slider, render: render });
});

document.querySelectorAll('.btn-tab').forEach(button => {
  button.addEventListener('click', () => {
    const tab = button.getAttribute('data-tab');

    document.querySelectorAll('.btn-tab').forEach(btn => {
      btn.classList.toggle('active', btn === button);
    });

    projectSliders.forEach(slider => {
      const visible = slider.el.getAttribute('data-panel') === tab;
      slider.el.classList.toggle('hidden', !visible);
      if (visible) slider.render(false);
    });
  });
});


$(window).mousemove(function(e){

  x=e.clientX;
  y=e.clientY;

  gsap.to('.cursor',{
      x:x,
      y:y,
  })

})


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








