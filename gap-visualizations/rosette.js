import { el } from "./dom.js";
import { hypothesisCopy, radialFingerprint } from "./fingerprint-shared.js";

export const rosetteView = Object.freeze({
  id: "rosette",
  label: "Підписана розетка",
  description: "Сім доменів підписані безпосередньо біля секторів. Стала орієнтація дає змогу порівнювати силуети гіпотез без цифрової легенди.",
  render: renderRosettes,
});

function renderRosettes({ model, onCell }) {
  const grid = el("div", { className: "gap-rosette-grid", attrs: { "data-gap-visual": "rosette" } });
  model.hypotheses.forEach((hypothesis) => {
    const weights = { hot: 4, warm: 3, cool: 2, cold: 1, fracture: 0, unmapped: 0 };
    const score = hypothesis.cells.length
      ? hypothesis.cells.reduce((total, cell) => total + (weights[cell.thermal] ?? 0), 0) / hypothesis.cells.length
      : 0;
    const coverage = score >= 3.2 ? "hot" : score >= 2.35 ? "warm" : score >= 1.25 ? "cool" : "cold";
    const coverageLabel = {
      hot: "Щільне записане покриття",
      warm: "Часткове записане покриття",
      cool: "Сигнал із відкритими прогалинами",
      cold: "Переважають відкриті прогалини",
    }[coverage];
    const heading = hypothesisCopy(hypothesis);
    heading.append(el("small", { className: "gap-rosette-coverage-label", text: coverageLabel }));
    grid.append(el("article", {
      className: "gap-rosette-card",
      attrs: { "data-coverage": coverage },
    }, [
      heading,
      radialFingerprint({ model, hypothesis, onCell }),
    ]));
  });
  return grid;
}
