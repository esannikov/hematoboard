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
    grid.append(el("article", { className: "gap-rosette-card" }, [
      radialFingerprint({ model, hypothesis, onCell }),
      hypothesisCopy(hypothesis),
    ]));
  });
  return grid;
}
