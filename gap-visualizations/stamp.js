import { el } from "./dom.js";
import { cellButton, hypothesisCopy } from "./fingerprint-shared.js";

export const stampView = Object.freeze({
  id: "stamp",
  label: "Доказова печатка",
  description: "Сім безпосередньо підписаних комірок утворюють компактну печатку. Порожнини, розриви й суперечності формують впізнаваний силует кожної гіпотези.",
  render: renderStamps,
});

function renderStamps({ model, onCell }) {
  const grid = el("div", { className: "gap-stamp-cards", attrs: { "data-gap-visual": "stamp" } });
  model.hypotheses.forEach((hypothesis) => {
    const imprint = el("div", { className: "gap-stamp-imprint" });
    hypothesis.cells.forEach((cell) => {
      const column = model.column(cell.columnId);
      if (!column) return;
      imprint.append(cellButton({
        cell,
        column,
        onCell,
        className: `gap-stamp-cell gap-stamp-cell-${column.role}`,
      }));
    });
    grid.append(el("article", { className: "gap-stamp-card" }, [imprint, hypothesisCopy(hypothesis)]));
  });
  return grid;
}
