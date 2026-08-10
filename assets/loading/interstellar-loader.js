(() => {
  const SVG_NS = "http://www.w3.org/2000/svg";
  const CYCLE = 7600;
  const BUILD_START = 300;
  const BUILD_END = 5000;
  const DOCK_TIME = 620;

  const slots = [
    [0, 0, 5.4],
    [-12, 0, 4.1], [12, 0, 4.1],
    [0, -12, 3.7], [0, 12, 3.7],
    [-25, 0, 3.8], [25, 0, 3.8],
    [-39, 0, 3.5], [39, 0, 3.5],
    [-39, -15, 3.1], [-39, 15, 3.1],
    [-25, -15, 3.1], [-25, 15, 3.1],
    [25, -15, 3.1], [25, 15, 3.1],
    [39, -15, 3.1], [39, 15, 3.1],
    [0, -25, 2.8],
  ];

  const connections = [
    [-39, 0, 39, 0], [0, -25, 0, 12],
    [-39, -15, -39, 15], [-25, -15, -25, 15],
    [25, -15, 25, 15], [39, -15, 39, 15],
    [-39, -15, -25, -15], [-39, 15, -25, 15],
    [25, -15, 39, -15], [25, 15, 39, 15],
  ];

  const clamp = (value) => Math.max(0, Math.min(1, value));
  const easeOut = (value) => 1 - Math.pow(1 - value, 3);
  const smoothstep = (value) => value * value * (3 - 2 * value);

  function makeSvg(tag, attributes = {}) {
    const node = document.createElementNS(SVG_NS, tag);
    Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));
    return node;
  }

  function mount(svg) {
    const guideLayer = svg.querySelector("[data-guide-layer]");
    const stationGroup = svg.querySelector("[data-station-group]");
    const connectorLayer = svg.querySelector("[data-connector-layer]");
    const beadLayer = svg.querySelector("[data-bead-layer]");
    const loadingLayer = svg.closest(".case-loading");
    if (!guideLayer || !stationGroup || !connectorLayer || !beadLayer || !loadingLayer) return;

    const guides = slots.slice(1).map(([x, y]) => {
      const line = makeSvg("path", {
        class: "station-loader__guide",
        d: `M80 80 L${80 + x} ${80 + y}`,
      });
      guideLayer.appendChild(line);
      return line;
    });

    const connectorNodes = connections.map(([x1, y1, x2, y2]) => {
      const line = makeSvg("path", {
        class: "station-loader__connector",
        d: `M${80 + x1} ${80 + y1} L${80 + x2} ${80 + y2}`,
      });
      connectorLayer.appendChild(line);
      return line;
    });

    const beads = slots.map(([, , radius], index) => {
      const bead = makeSvg("circle", {
        class: "station-loader__bead",
        cx: 80,
        cy: 80,
        r: radius,
        opacity: index === 0 ? 1 : 0,
      });
      beadLayer.appendChild(bead);
      return bead;
    });

    let startedAt = performance.now();
    let frame = 0;
    let active = false;

    function render(now) {
      if (!active) return;
      const elapsed = (now - startedAt) % CYCLE;
      const buildSpan = BUILD_END - BUILD_START;
      const step = buildSpan / slots.length;
      const assemble = clamp((elapsed - BUILD_START) / buildSpan);
      const finalRotation = Math.max(0, elapsed - BUILD_END) * .047;
      const rotation = assemble * 18 + finalRotation;
      const fadeOut = 1 - smoothstep(clamp((elapsed - 7050) / 430));

      stationGroup.setAttribute("transform", `rotate(${rotation.toFixed(2)} 80 80)`);
      stationGroup.setAttribute("opacity", fadeOut.toFixed(3));

      beads.forEach((bead, index) => {
        const [targetX, targetY] = slots[index];
        const local = clamp((elapsed - BUILD_START - index * step) / DOCK_TIME);
        const travel = easeOut(local);
        const distance = Math.hypot(targetX, targetY) || 1;
        const perpendicularX = -targetY / distance;
        const perpendicularY = targetX / distance;
        const bend = Math.sin(local * Math.PI) * Math.min(3.5, distance * .08) * (index % 2 ? 1 : -1);
        const x = 80 + targetX * travel + perpendicularX * bend;
        const y = 80 + targetY * travel + perpendicularY * bend;
        const appear = index === 0 ? clamp((elapsed - 100) / 260) : clamp(local * 3.5);
        const settle = 1 + Math.sin(local * Math.PI) * .16;
        bead.setAttribute("cx", x.toFixed(2));
        bead.setAttribute("cy", y.toFixed(2));
        bead.setAttribute("opacity", appear.toFixed(3));
        bead.setAttribute("transform", `translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${settle.toFixed(3)}) translate(${-x.toFixed(2)} ${-y.toFixed(2)})`);

        if (index > 0) {
          const guideLife = Math.sin(clamp(local) * Math.PI);
          guides[index - 1].setAttribute("opacity", (guideLife * .17).toFixed(3));
        }
      });

      const structure = smoothstep(clamp((elapsed - 4300) / 1000)) * fadeOut;
      connectorNodes.forEach((line, index) => {
        const stagger = smoothstep(clamp((structure * 1.35) - index * .035));
        line.setAttribute("opacity", (stagger * .5).toFixed(3));
      });

      frame = requestAnimationFrame(render);
    }

    function syncAnimation() {
      const shouldRun = !loadingLayer.classList.contains("is-hidden");
      if (shouldRun === active) return;
      active = shouldRun;
      cancelAnimationFrame(frame);
      if (active) {
        startedAt = performance.now();
        frame = requestAnimationFrame(render);
      }
    }

    new MutationObserver(syncAnimation).observe(loadingLayer, {
      attributes: true,
      attributeFilter: ["class"],
    });
    syncAnimation();
  }

  document.querySelectorAll("[data-station-loader]").forEach(mount);
})();
