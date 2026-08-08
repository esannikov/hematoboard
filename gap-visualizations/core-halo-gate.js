import { activateSvg, el, sectorPath, svg } from "./dom.js";
import { hypothesisCopy } from "./fingerprint-shared.js";

export const coreHaloGateView = Object.freeze({
  id: "core-halo-gate",
  label: "Ядро · ореол · брама",
  description: "П’ять клінічних модальностей утворюють ядро, якість джерела охоплює його ореолом, а діагностична перевірка стає окремою брамою до рішення.",
  render: renderCoreHaloGate,
});

function interactiveShape(node, cell, column, hypothesis, onCell) {
  node.setAttribute("data-thermal", cell.thermal);
  node.setAttribute("data-gap-target", cell.id);
  node.setAttribute("data-gap-column", cell.columnId);
  node.setAttribute("aria-pressed", "false");
  node.append(svg("title", { text: `${column.label}: ${cell.label}` }));
  activateSvg(node, `${hypothesis.displayLabel}; ${column.label}; ${cell.label}`, () => onCell(cell.id));
  return node;
}

function renderGlyph(model, hypothesis, onCell) {
  const chart = svg("svg", {
    className: "gap-core-glyph",
    attrs: { viewBox: "0 0 340 330", role: "group", "aria-label": `Ядро, ореол і брама: ${hypothesis.displayLabel}` },
  });
  const clinicalColumns = model.columnsFor("clinical");
  const clinicalCount = Math.max(1, clinicalColumns.length);
  clinicalColumns.forEach((column, index) => {
    const cell = model.cell(hypothesis.id, column.id);
    if (!cell) return;
    const centerAngle = index * (360 / clinicalCount);
    const start = centerAngle - (360 / clinicalCount) / 2 + 3;
    const end = centerAngle + (360 / clinicalCount) / 2 - 3;
    const sector = interactiveShape(svg("path", {
      className: "gap-core-petal",
      attrs: { d: sectorPath(170, 132, 38, 78, start, end) },
    }), cell, column, hypothesis, onCell);
    chart.append(sector);
    const radians = (centerAngle - 90) * Math.PI / 180;
    const x = 170 + 116 * Math.cos(radians);
    const y = 132 + 116 * Math.sin(radians);
    chart.append(svg("text", {
      className: "gap-core-domain-label",
      text: column.compactLabel,
      attrs: { x, y: y + 4, "text-anchor": x < 154 ? "end" : x > 186 ? "start" : "middle", "aria-hidden": "true" },
    }));
  });

  const trustColumn = model.columnsFor("trust")[0];
  const trustCell = trustColumn ? model.cell(hypothesis.id, trustColumn.id) : null;
  if (trustColumn && trustCell) {
    chart.append(interactiveShape(svg("path", {
      className: "gap-core-halo",
      attrs: { d: sectorPath(170, 132, 88, 101, .4, 359.6) },
    }), trustCell, trustColumn, hypothesis, onCell));
    chart.append(
      svg("path", { className: "gap-core-callout", attrs: { d: "M 170 233 L 170 246" } }),
      svg("text", { className: "gap-core-meta-label", text: "ОРЕОЛ · Якість джерела", attrs: { x: "170", y: "260", "text-anchor": "middle", "aria-hidden": "true" } }),
    );
  }

  const actionColumn = model.columnsFor("action")[0];
  const actionCell = actionColumn ? model.cell(hypothesis.id, actionColumn.id) : null;
  if (actionColumn && actionCell) {
    chart.append(interactiveShape(svg("rect", {
      className: "gap-core-gate",
      attrs: { x: "58", y: "276", width: "224", height: "42" },
    }), actionCell, actionColumn, hypothesis, onCell));
    chart.append(svg("text", {
      className: "gap-core-gate-label",
      text: "БРАМА · Діагностична перевірка",
      attrs: { x: "170", y: "302", "text-anchor": "middle", "aria-hidden": "true" },
    }));
  }

  chart.append(
    svg("circle", { className: "gap-core-center", attrs: { cx: "170", cy: "132", r: "28" } }),
    svg("text", { className: "gap-core-id", text: hypothesis.id, attrs: { x: "170", y: "137", "text-anchor": "middle" } }),
  );
  return chart;
}

function renderCoreHaloGate({ model, onCell }) {
  const grid = el("div", { className: "gap-core-grid", attrs: { "data-gap-visual": "core-halo-gate" } });
  model.hypotheses.forEach((hypothesis) => {
    grid.append(el("article", { className: "gap-core-card" }, [
      renderGlyph(model, hypothesis, onCell),
      hypothesisCopy(hypothesis),
    ]));
  });
  return grid;
}
