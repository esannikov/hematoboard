const SVG_NS = "http://www.w3.org/2000/svg";

export function el(tag, options = {}, children = []) {
  const node = document.createElement(tag);
  if (options.className) node.className = options.className;
  if (options.text !== undefined) node.textContent = String(options.text);
  Object.entries(options.attrs || {}).forEach(([name, value]) => {
    if (value === false || value === null || value === undefined) return;
    node.setAttribute(name, value === true ? "" : String(value));
  });
  const list = Array.isArray(children) ? children : [children];
  list.filter(Boolean).forEach((child) => node.append(child));
  return node;
}

export function svg(tag, options = {}, children = []) {
  const node = document.createElementNS(SVG_NS, tag);
  if (options.className) node.setAttribute("class", options.className);
  if (options.text !== undefined) node.textContent = String(options.text);
  Object.entries(options.attrs || {}).forEach(([name, value]) => {
    if (value === false || value === null || value === undefined) return;
    node.setAttribute(name, value === true ? "" : String(value));
  });
  const list = Array.isArray(children) ? children : [children];
  list.filter(Boolean).forEach((child) => node.append(child));
  return node;
}

export function activateSvg(node, label, activate) {
  node.setAttribute("role", "button");
  node.setAttribute("tabindex", "0");
  node.setAttribute("aria-label", label);
  node.addEventListener("click", activate);
  node.addEventListener("keydown", (event) => {
    if (!['Enter', ' '].includes(event.key)) return;
    event.preventDefault();
    activate();
  });
  return node;
}

export function sectorPath(cx, cy, innerRadius, outerRadius, startAngle, endAngle) {
  const point = (radius, angle) => {
    const radians = (angle - 90) * Math.PI / 180;
    return [cx + radius * Math.cos(radians), cy + radius * Math.sin(radians)];
  };
  const [outerStartX, outerStartY] = point(outerRadius, startAngle);
  const [outerEndX, outerEndY] = point(outerRadius, endAngle);
  const [innerEndX, innerEndY] = point(innerRadius, endAngle);
  const [innerStartX, innerStartY] = point(innerRadius, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return [
    `M ${outerStartX.toFixed(2)} ${outerStartY.toFixed(2)}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerEndX.toFixed(2)} ${outerEndY.toFixed(2)}`,
    `L ${innerEndX.toFixed(2)} ${innerEndY.toFixed(2)}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerStartX.toFixed(2)} ${innerStartY.toFixed(2)}`,
    "Z",
  ].join(" ");
}

export function setActiveTargets(root, cellId) {
  root.querySelectorAll("[data-gap-target]").forEach((node) => {
    const active = node.getAttribute("data-gap-target") === cellId;
    node.classList.toggle("is-active", active);
    if (node.hasAttribute("aria-pressed")) node.setAttribute("aria-pressed", active ? "true" : "false");
  });
}
