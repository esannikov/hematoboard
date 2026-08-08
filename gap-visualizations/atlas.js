import { el } from "./dom.js";
import { cellButton, hypothesisCopy, radialFingerprint } from "./fingerprint-shared.js";

export const atlasView = Object.freeze({
  id: "atlas",
  label: "Атлас відбитків",
  description: "Один повністю підписаний відбиток показано у фокусі, а решта лишаються поруч як контекст. Вибір домену підсвічує його положення в усьому атласі.",
  render: renderAtlas,
});

function renderAtlas({ model, onCell, selectedCellId }) {
  const selectedCell = model.cellsById.get(selectedCellId);
  let selectedHypothesisId = selectedCell?.hypothesisId || model.hypotheses[0]?.id;
  const root = el("div", { className: "gap-atlas", attrs: { "data-gap-visual": "atlas" } });
  const index = el("nav", { className: "gap-atlas-index", attrs: { "aria-label": "Вибір гіпотези для атласу" } });
  const detail = el("section", { className: "gap-atlas-detail" });

  function highlightColumn(columnId, active) {
    root.querySelectorAll(`[data-gap-column="${CSS.escape(columnId)}"]`).forEach((node) => node.classList.toggle("is-domain-peek", active));
  }

  function renderDetail() {
    const hypothesis = model.hypothesis(selectedHypothesisId) || model.hypotheses[0];
    const domains = el("div", { className: "gap-atlas-domains", attrs: { "aria-label": "Доказові домени вибраної гіпотези" } });
    hypothesis.cells.forEach((cell) => {
      const column = model.column(cell.columnId);
      if (!column) return;
      const button = cellButton({ cell, column, onCell, className: "gap-atlas-domain", fullLabel: true });
      button.append(el("span", { className: "gap-atlas-state", text: model.stateMeta[cell.thermal]?.label || cell.label }));
      button.addEventListener("pointerenter", () => highlightColumn(column.id, true));
      button.addEventListener("pointerleave", () => highlightColumn(column.id, false));
      button.addEventListener("focus", () => highlightColumn(column.id, true));
      button.addEventListener("blur", () => highlightColumn(column.id, false));
      domains.append(button);
    });
    detail.replaceChildren(
      hypothesisCopy(hypothesis),
      el("div", { className: "gap-atlas-focus" }, [
        radialFingerprint({ model, hypothesis, onCell, className: "gap-atlas-radial" }),
        domains,
      ]),
    );
    index.querySelectorAll("button").forEach((button) => button.setAttribute("aria-pressed", button.dataset.hypothesis === hypothesis.id ? "true" : "false"));
  }

  model.hypotheses.forEach((hypothesis) => {
    const button = el("button", {
      className: "gap-atlas-thumb focus-ring",
      attrs: { type: "button", "data-hypothesis": hypothesis.id, "aria-pressed": "false" },
    }, [
      radialFingerprint({ model, hypothesis, interactive: false, labels: false, className: "gap-atlas-mini", viewBox: "0 0 120 120", cx: 60, cy: 60, innerRadius: 17, outerRadius: 42 }),
      el("span", {}, [el("strong", { text: hypothesis.id }), el("small", { text: hypothesis.displayLabel })]),
    ]);
    button.addEventListener("click", () => {
      selectedHypothesisId = hypothesis.id;
      renderDetail();
      const focusCell = model.mostOpenCell(hypothesis.cells);
      if (focusCell) onCell(focusCell.id);
    });
    index.append(button);
  });
  root.append(index, detail);
  renderDetail();
  return root;
}
