(() => {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  gsap.registerPlugin(ScrollTrigger);
  document.body.classList.add("loading");
  $("#year").textContent = new Date().getFullYear();

  /* ---------- clock ---------- */
  const tick = () => {
    $("#clock").textContent = new Date().toLocaleTimeString("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" });
  };
  tick(); setInterval(tick, 15000);

  /* ---------- smooth scroll ---------- */
  let lenis;
  if (!reduced && window.Lenis) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  $$('a[href^="#"]').forEach((a) =>
    a.addEventListener("click", (e) => {
      const t = $(a.getAttribute("href") === "#top" ? "body" : a.getAttribute("href"));
      if (!t) return;
      e.preventDefault();
      lenis ? lenis.scrollTo(t, { duration: 1.6 }) : t.scrollIntoView({ behavior: "smooth" });
    })
  );

  /* ---------- split chars ---------- */
  $$(".split").forEach((el) => {
    el.innerHTML = [...el.textContent].map((c) => `<span class="ch">${c === " " ? "&nbsp;" : c}</span>`).join("");
  });
  $$(".scrub-text").forEach((el) => {
    el.innerHTML = el.textContent.trim().split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(" ");
  });

  /* ---------- ambient canvas: flowing particle field reacting to mouse ---------- */
  const cv = $("#bg"), ctx = cv.getContext("2d");
  let W, H, DPR, pts = [];
  const mouse = { x: -9999, y: -9999 };
  const resize = () => {
    DPR = Math.min(devicePixelRatio, 2);
    W = cv.width = innerWidth * DPR; H = cv.height = innerHeight * DPR;
    const n = Math.min(120, Math.floor((innerWidth * innerHeight) / 14000));
    pts = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3 }));
  };
  resize(); addEventListener("resize", resize);
  addEventListener("mousemove", (e) => { mouse.x = e.clientX * DPR; mouse.y = e.clientY * DPR; });
  let scrollY = 0;
  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    const g = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 500 * DPR);
    g.addColorStop(0, "rgba(124,92,255,0.10)"); g.addColorStop(1, "rgba(124,92,255,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const link = 130 * DPR;
    for (const p of pts) {
      const dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.hypot(dx, dy);
      if (d < 160 * DPR) { p.vx += (dx / d) * 0.05; p.vy += (dy / d) * 0.05; }
      p.vx *= 0.985; p.vy *= 0.985;
      p.x += p.vx + 0.05; p.y += p.vy - scrollY * 0.02;
      if (p.x < 0) p.x += W; if (p.x > W) p.x -= W; if (p.y < 0) p.y += H; if (p.y > H) p.y -= H;
    }
    scrollY *= 0.9;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      for (let j = i + 1; j < pts.length; j++) {
        const b = pts[j], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < link) { ctx.strokeStyle = `rgba(200,255,77,${(1 - d / link) * 0.18})`; ctx.lineWidth = DPR * 0.6; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
      }
      ctx.fillStyle = "rgba(242,240,234,0.55)"; ctx.beginPath(); ctx.arc(a.x, a.y, 1.2 * DPR, 0, 7); ctx.fill();
    }
    if (!reduced) requestAnimationFrame(draw);
  };
  draw();
  if (lenis) lenis.on("scroll", ({ velocity }) => (scrollY = velocity * DPR));

  /* ---------- cursor ---------- */
  if (fine) {
    const cur = $(".cursor"), dot = $(".cursor__dot"), ring = $(".cursor__ring"), label = $(".cursor__label");
    const dx = gsap.quickTo(dot, "x", { duration: 0.1 }), dy = gsap.quickTo(dot, "y", { duration: 0.1 });
    const rx = gsap.quickTo(ring, "x", { duration: 0.5, ease: "power3" }), ry = gsap.quickTo(ring, "y", { duration: 0.5, ease: "power3" });
    addEventListener("mousemove", (e) => { dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); });
    $$("a, button").forEach((el) => {
      el.addEventListener("mouseenter", () => {
        const l = el.dataset.cursor;
        if (l) { label.textContent = l; cur.classList.add("is-label"); } else cur.classList.add("is-hover");
      });
      el.addEventListener("mouseleave", () => cur.classList.remove("is-hover", "is-label"));
    });

    /* magnetic */
    $$(".magnetic").forEach((el) => {
      const xT = gsap.quickTo(el, "x", { duration: 0.6, ease: "elastic.out(1,0.4)" });
      const yT = gsap.quickTo(el, "y", { duration: 0.6, ease: "elastic.out(1,0.4)" });
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        xT((e.clientX - r.left - r.width / 2) * 0.35); yT((e.clientY - r.top - r.height / 2) * 0.35);
      });
      el.addEventListener("mouseleave", () => { xT(0); yT(0); });
    });

    /* 3D tilt */
    $$(".tilt").forEach((el) => {
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        gsap.to(el, { rotateY: px * 10, rotateX: -py * 10, transformPerspective: 900, duration: 0.5, ease: "power2.out" });
      });
      el.addEventListener("mouseleave", () => gsap.to(el, { rotateX: 0, rotateY: 0, duration: 0.8, ease: "elastic.out(1,0.5)" }));
    });
  }

  /* spotlight */
  $$(".spot").forEach((el) =>
    el.addEventListener("mousemove", (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
    })
  );

  /* ---------- nav hide on scroll ---------- */
  let lastY = 0;
  addEventListener("scroll", () => {
    const y = scrollY_();
    $(".nav").classList.toggle("is-scrolled", y > 40);
    $(".nav").classList.toggle("is-hidden", y > lastY && y > 400);
    lastY = y;
  });
  function scrollY_() { return window.scrollY || document.documentElement.scrollTop; }

  /* ---------- preloader → intro ---------- */
  const counter = { v: 0 };
  const intro = gsap.timeline({ paused: true });
  intro
    .from(".hero__title .ch", { yPercent: 115, rotate: 8, duration: 1.2, ease: "expo.out", stagger: 0.025 })
    .from(".reveal-up", { y: 30, opacity: 0, duration: 1, ease: "power3.out", stagger: 0.1 }, "-=0.8")
    .from(".nav", { y: -30, opacity: 0, duration: 0.8, ease: "power3.out" }, "-=0.9");

  gsap.timeline()
    .to(counter, {
      v: 100, duration: reduced ? 0.1 : 1.6, ease: "power2.inOut",
      onUpdate: () => { $("#loaderNum").textContent = Math.round(counter.v); $(".loader__bar i").style.width = counter.v + "%"; },
    })
    .to(".loader", { clipPath: "inset(0 0 100% 0)", duration: reduced ? 0.1 : 1, ease: "expo.inOut" })
    .add(() => { document.body.classList.remove("loading"); $(".loader").remove(); intro.play(); }, "-=0.35");

  if (reduced) return;

  /* ---------- scroll animations ---------- */
  gsap.to(".hero__title", { yPercent: -20, opacity: 0.2, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });

  gsap.to(".scrub-text .w", {
    opacity: 1, stagger: 0.1, ease: "none",
    scrollTrigger: { trigger: ".about__text", start: "top 80%", end: "bottom 45%", scrub: true },
  });

  $$(".stat__num").forEach((el) => {
    const o = { v: 0 };
    gsap.to(o, { v: +el.dataset.count, duration: 2, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 85%" }, onUpdate: () => (el.textContent = Math.round(o.v)) });
  });

  $$(".big-title, .section-label").forEach((el) =>
    gsap.from(el, { y: 60, opacity: 0, duration: 1.1, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 88%" } })
  );

  gsap.from(".bento__item", { y: 80, opacity: 0, duration: 1, ease: "expo.out", stagger: 0.08, scrollTrigger: { trigger: ".bento", start: "top 80%" } });

  gsap.from(".contact__title .ch", { yPercent: 100, opacity: 0, duration: 1, ease: "expo.out", stagger: 0.02, scrollTrigger: { trigger: ".contact__title", start: "top 80%" } });

  /* horizontal pinned work on desktop */
  ScrollTrigger.matchMedia({
    "(min-width: 761px)": () => {
      const track = $(".work__track");
      const dist = () => track.scrollWidth - innerWidth;
      gsap.to(track, {
        x: () => -dist(), ease: "none",
        scrollTrigger: { trigger: ".work", pin: ".work__pin", start: "top top", end: () => "+=" + dist(), scrub: 1, invalidateOnRefresh: true },
      });
    },
  });

  /* ---------- live GitHub feed ---------- */
  const LANG = { Python: "#3572A5", JavaScript: "#f1e05a", TypeScript: "#3178c6", Dart: "#00B4AB", HTML: "#e34c26", Go: "#00ADD8", Shell: "#89e051", "Jupyter Notebook": "#DA5B0B" };
  const ago = (d) => {
    const s = (Date.now() - new Date(d)) / 1000, u = [["y", 31536000], ["mo", 2592000], ["d", 86400], ["h", 3600], ["m", 60]];
    for (const [k, v] of u) if (s >= v) return `${Math.floor(s / v)}${k} ago`;
    return "just now";
  };
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  fetch("https://api.github.com/users/dhanuvagman006/repos?sort=pushed&per_page=30")
    .then((r) => (r.ok ? r.json() : Promise.reject()))
    .then((repos) => {
      const list = repos.filter((r) => !r.fork && r.name !== "dhanuvagman006" && r.name !== "dhanuvagman.io").slice(0, 6);
      $("#repos").innerHTML = list.map((r) => `
        <a class="repo spot" href="${r.html_url}" target="_blank" rel="noopener" data-cursor="View">
          <h5>${esc(r.name)} <span>↗</span></h5>
          <p>${esc(r.description || "Exploring ideas in code.")}</p>
          <div class="repo__meta">${r.language ? `<span><i class="repo__dot" style="background:${LANG[r.language] || "#888"}"></i>${r.language}</span>` : ""}<span>★ ${r.stargazers_count}</span><span>${ago(r.pushed_at)}</span></div>
        </a>`).join("");
      $$("#repos .spot").forEach((el) => el.addEventListener("mousemove", (e) => {
        const b = el.getBoundingClientRect(); el.style.setProperty("--mx", `${e.clientX - b.left}px`); el.style.setProperty("--my", `${e.clientY - b.top}px`);
      }));
      gsap.from("#repos .repo", { y: 50, opacity: 0, duration: 0.9, ease: "expo.out", stagger: 0.07, scrollTrigger: { trigger: "#repos", start: "top 85%" } });
      ScrollTrigger.refresh();
    })
    .catch(() => { $("#repos").innerHTML = `<a class="repo" href="https://github.com/dhanuvagman006?tab=repositories" target="_blank" rel="noopener"><h5>Browse all repositories <span>↗</span></h5><p>70+ projects across AI, web and mobile.</p></a>`; });

  addEventListener("load", () => ScrollTrigger.refresh());
})();
