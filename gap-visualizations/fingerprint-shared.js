import { activateSvg, el, sectorPath, svg } from "./dom.js";

export function stateMark() {
  return el("i", { className: "gap-fp-state-mark", attrs: { "aria-hidden": "true" } });
}

export function cellButton({ cell, column, onCell, className = "gap-fp-cell", fullLabel = false }) {
  const button = el("button", {
    className: `${className} focus-ring`,
    attrs: {
      type: "button",
      "data-gap-target": cell.id,
      "data-gap-column": column.id,
      "data-thermal": cell.thermal,
      "aria-pressed": "false",
      "aria-label": `${column.label}: ${cell.label}`,
    },
  }, [
    stateMark(),
    el("span", { className: "gap-fp-cell-label", text: fullLabel ? column.label : column.compactLabel }),
    cell.gaps.length ? el("small", { text: `${cell.gaps.length} відкр.` }) : null,
  ]);
  button.addEventListener("click", () => onCell(cell.id));
  return button;
}

export function hypothesisCopy(hypothesis) {
  return el("header", { className: "gap-fp-hypothesis-copy" }, [
    el("span", { text: `№${hypothesis.rank ?? "—"} · ${hypothesis.id}` }),
    el("h4", { text: hypothesis.displayLabel }),
  ]);
}

export function radialFingerprint({
  model,
  hypothesis,
  onCell,
  className = "gap-fp-radial-svg",
  interactive = true,
  labels = true,
  viewBox = "0 0 320 270",
  cx = 160,
  cy = 128,
  innerRadius = 35,
  outerRadius = 78,
  labelRadius = 112,
}) {
  const chart = svg("svg", {
    className,
    attrs: { viewBox, role: interactive ? "group" : "img", "aria-label": `Доказовий відбиток: ${hypothesis.displayLabel}` },
  });
  const count = Math.max(1, model.columns.length);
  hypothesis.cells.forEach((cell, index) => {
    const column = model.column(cell.columnId);
    const centerAngle = index * (360 / count);
    const start = centerAngle - (360 / count) / 2 + 2.5;
    const end = centerAngle + (360 / count) / 2 - 2.5;
    const path = svg("path", {
      className: "gap-fp-radial-sector",
      attrs: {
        d: sectorPath(cx, cy, innerRadius, outerRadius, start, end),
        "data-thermal": cell.thermal,
        "data-gap-column": cell.columnId,
        ...(interactive ? { "data-gap-target": cell.id, "aria-pressed": "false" } : {}),
      },
    });
    path.append(svg("title", { text: `${column?.label || "Доказовий домен"}: ${cell.label}` }));
    if (interactive) activateSvg(path, `${hypothesis.displayLabel}; ${column?.label || "доказовий домен"}; ${cell.label}`, () => onCell(cell.id));
    chart.append(path);
    if (labels) {
      const radians = (centerAngle - 90) * Math.PI / 180;
      const x = cx + labelRadius * Math.cos(radians);
      const y = cy + labelRadius * Math.sin(radians);
      const anchor = x < cx - 16 ? "end" : x > cx + 16 ? "start" : "middle";
      chart.append(svg("text", {
        className: "gap-fp-radial-label",
        text: column?.compactLabel || column?.label || "Домен",
        attrs: { x, y: y + 4, "text-anchor": anchor, "aria-hidden": "true" },
      }));
    }
  });
  chart.append(
    svg("circle", { className: "gap-fp-radial-core", attrs: { cx, cy, r: innerRadius - 7 } }),
    svg("text", { className: "gap-fp-radial-id", text: hypothesis.id, attrs: { x: cx, y: cy + 5, "text-anchor": "middle" } }),
  );
  return chart;
}
