import { el } from "./dom.js";
import { hypothesisCopy } from "./fingerprint-shared.js";

const LEVEL_BY_STATE = Object.freeze({
  hot: 100,
  warm: 72,
  cool: 46,
  cold: 18,
  fracture: 50,
  unmapped: 0,
});

export const scalesView = Object.freeze({
  id: "scales",
  label: "Шкали покриття",
  description: "Горизонтальні шкали дають змогу порівняти всі доказові домени без кругової геометрії. Колір читається за єдиною віссю: коротке заповнення залишається холодним, а теплі й гарячі ділянки з’являються лише ближче до повного покриття. Суперечність позначається окремим червоним станом.",
  render: renderScales,
});

function renderScales({ model, onCell }) {
  const root = el("div", {
    className: "gap-scales",
    attrs: { "data-gap-visual": "scales" },
  });
  root.append(el("div", { className: "gap-scales-axis", attrs: { "aria-hidden": "true" } }, [
    el("span", { text: "відкрита прогалина" }),
    el("i"),
    el("span", { text: "щільно простежено" }),
  ]));

  model.hypotheses.forEach((hypothesis) => {
    const mapped = hypothesis.cells.filter((cell) => !["cold", "unmapped"].includes(cell.thermal)).length;
    const card = el("section", {
      className: "gap-scales-hypothesis",
      attrs: { "aria-labelledby": `gap-scales-${hypothesis.id}` },
    });
    const heading = hypothesisCopy(hypothesis);
    heading.querySelector("h4")?.setAttribute("id", `gap-scales-${hypothesis.id}`);
    heading.append(el("small", { text: `${mapped} із ${hypothesis.cells.length} доменів мають записане покриття` }));
    card.append(heading);

    const rows = el("div", { className: "gap-scales-rows" });
    hypothesis.cells.forEach((cell) => {
      const column = model.column(cell.columnId);
      if (!column) return;
      const stateLabel = model.stateMeta[cell.thermal]?.label || cell.label;
      const level = LEVEL_BY_STATE[cell.thermal] ?? 0;
      const button = el("button", {
        className: "gap-scale-row focus-ring",
        attrs: {
          type: "button",
          "data-gap-target": cell.id,
          "data-gap-column": column.id,
          "data-thermal": cell.thermal,
          "data-gap-level": String(level),
          "aria-pressed": "false",
          "aria-label": `${hypothesis.displayLabel}; ${column.label}; ${stateLabel}. Відкрити доказовий контекст`,
        },
      }, [
        el("span", { className: "gap-scale-domain", text: column.label }),
        el("span", { className: "gap-scale-track", attrs: { "aria-hidden": "true" } }, [
          el("i", { className: "gap-scale-fill" }),
        ]),
        el("span", { className: "gap-scale-state", text: stateLabel }),
      ]);
      button.addEventListener("click", () => onCell(cell.id));
      rows.append(button);
    });
    card.append(rows);
    root.append(card);
  });
  return root;
}
