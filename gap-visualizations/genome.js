import { el } from "./dom.js";
import { cellButton, hypothesisCopy } from "./fingerprint-shared.js";

export const genomeView = Object.freeze({
  id: "genome",
  label: "Доказовий геном",
  description: "Кожна гіпотеза перетворена на щільну смугу з прямими назвами доменів. Вертикальні збіги й розриви видно одразу в усіх восьми профілях.",
  render: renderGenome,
});

function renderGenome({ model, onCell }) {
  const root = el("div", { className: "gap-genome", attrs: { "data-gap-visual": "genome" } });
  model.hypotheses.forEach((hypothesis) => {
    const strand = el("div", { className: "gap-genome-strand" });
    model.groups.forEach((group) => {
      const cells = el("div", { className: `gap-genome-group gap-genome-group-${group.role}`, attrs: { "data-group-label": group.label } });
      group.columns.forEach((column) => {
        const cell = model.cell(hypothesis.id, column.id);
        if (cell) cells.append(cellButton({ cell, column, onCell, className: "gap-genome-cell" }));
      });
      strand.append(cells);
    });
    root.append(el("article", { className: "gap-genome-row" }, [hypothesisCopy(hypothesis), strand]));
  });
  return root;
}
