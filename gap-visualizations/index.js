import { el, setActiveTargets } from "./dom.js";
import { createGapVisualModel } from "./model.js";
import { rosetteView } from "./rosette.js";
import { coreHaloGateView } from "./core-halo-gate.js";
import { genomeView } from "./genome.js";
import { stampView } from "./stamp.js";
import { atlasView } from "./atlas.js";

export const GAP_VISUALIZATIONS = Object.freeze([
  rosetteView,
  coreHaloGateView,
  genomeView,
  stampView,
  atlasView,
]);

function countLabel(count, singular, plural) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function evidenceRefs(target, refs, evidenceNode) {
  const nodes = (refs || []).map((ref) => evidenceNode?.(ref)).filter(Boolean);
  if (!nodes.length) return;
  target.append(el("div", { className: "gap-suite-source-refs" }, [el("span", { text: "Підстава" }), ...nodes]));
}

function makeMetric(label, value, detail) {
  return el("div", {}, [el("dt", { text: label }), el("dd", { text: value }), el("p", { text: detail })]);
}

function makeStateLegend(model) {
  const legend = el("div", { className: "gap-suite-state-key", attrs: { "aria-label": "Стани доказового контуру" } });
  ["hot", "warm", "cool", "cold", "fracture", "unmapped"].forEach((state) => {
    legend.append(el("span", {}, [
      el("i", { attrs: { "data-thermal": state, "aria-hidden": "true" } }),
      el("span", { text: model.stateMeta[state].label }),
    ]));
  });
  return legend;
}

function makeDomainLegend(model) {
  const legend = el("div", { className: "gap-suite-domain-key", attrs: { "aria-label": "Структура доказового відбитка" } });
  model.groups.forEach((group) => {
    legend.append(el("section", { attrs: { "data-domain-role": group.role } }, [
      el("strong", { text: group.label }),
      el("span", { text: group.columns.map((column) => column.compactLabel).join(" · ") }),
    ]));
  });
  return legend;
}

function makeAuditRegistry(model, selectCell) {
  const disclosure = el("details", { className: "gap-suite-registry" });
  disclosure.append(el("summary", {}, [
    el("span", { text: "Повний реєстр невизначеності" }),
    el("strong", { text: `${model.projection.sourcePerimeter.length + model.projection.hypothesesWithoutTypedLinks.length} поза гіпотезами` }),
  ]));
  const content = el("div", { className: "gap-suite-registry-body" });
  const fractures = model.projection.cells.filter((cell) => cell.thermal === "fracture");
  const fractureSection = el("section", {}, [el("h4", { text: "Суперечності" })]);
  if (fractures.length) {
    const list = el("div", { className: "gap-suite-registry-list" });
    fractures.forEach((cell) => {
      const hypothesis = model.hypothesis(cell.hypothesisId);
      const column = model.column(cell.columnId);
      const button = el("button", { className: "focus-ring", attrs: { type: "button" } }, [
        el("span", { text: column?.label || "Домен" }),
        el("strong", { text: hypothesis?.displayLabel || cell.hypothesisId }),
        el("small", { text: cell.signal }),
      ]);
      button.addEventListener("click", () => selectCell(cell.id));
      list.append(button);
    });
    fractureSection.append(list);
  } else {
    fractureSection.append(el("p", { text: "Типізованих суперечностей у цій проєкції не записано." }));
  }
  const perimeterSection = el("section", {}, [el("h4", { text: "Джерельний периметр" })]);
  const perimeter = el("div", { className: "gap-suite-perimeter-list" });
  model.projection.sourcePerimeter.forEach((item) => {
    perimeter.append(el("article", {}, [
      el("strong", { text: item.title }),
      el("p", { text: item.detail }),
      el("span", { text: item.page ? `Сторінка ${item.page}` : "Гіпотезу ще не визначено" }),
    ]));
  });
  model.projection.hypothesesWithoutTypedLinks.forEach((hypothesis) => {
    perimeter.append(el("article", {}, [
      el("strong", { text: hypothesis.short_label || hypothesis.label }),
      el("p", { text: "Типізованого зв’язку з фактами, модальностями або кроком верифікації не записано." }),
      el("span", { text: "Поза гіпотезним контуром" }),
    ]));
  });
  perimeterSection.append(perimeter.childElementCount ? perimeter : el("p", { text: "Неприв’язаних джерельних або структурних прогалин не записано." }));
  content.append(fractureSection, perimeterSection);
  disclosure.append(content);
  return disclosure;
}

export function renderGapVisualizationSuite({ bundle, projection, ui }) {
  const model = createGapVisualModel(projection);
  const fragment = document.createDocumentFragment();
  fragment.append(ui.viewHeader(
    "Карта прогалин",
    "П’ять варіантів доказового відбитка показують один детермінований стан різними способами: від підписаної розетки до щільного геному й атласу. Домени названі безпосередньо; жоден режим не показує ймовірність діагнозу.",
    `${ui.caseCode(bundle)} · прийнятий пакет`,
  ));

  const metrics = el("dl", { className: "gap-suite-metrics", attrs: { "aria-label": "Стан доказового контуру" } }, [
    makeMetric("Відкриті прогалини", projection.metrics.cool + projection.metrics.cold, "Записаний сигнал не закриває клінічне питання"),
    makeMetric("Суперечності", projection.metrics.fracture, "Несумісні модальності або типізовані факти"),
    makeMetric("Спільні перевірки", projection.metrics.sharedBridges, "Один крок впливає більш ніж на одну гіпотезу"),
    makeMetric("Перевірено людиною", `${projection.sourceVerification.verified}/${projection.sourceVerification.total}`, "Окремі рішення лікаря щодо джерельних спостережень"),
  ]);
  fragment.append(metrics);

  const suite = el("section", { className: "content-section gap-suite" });
  if (!model.hypotheses.length || !model.columns.length) {
    suite.append(el("h3", { text: "Структури для карти ще недостатньо" }), el("p", { text: "У пакеті мають бути робочі гіпотези й типізовані доказові домени." }));
    fragment.append(suite);
    return fragment;
  }

  const urlMode = new URL(window.location.href).searchParams.get("gapviz");
  let activeMode = GAP_VISUALIZATIONS.some((view) => view.id === urlMode) ? urlMode : GAP_VISUALIZATIONS[0].id;
  let selectedCellId = model.defaultCellId;
  const modeTabs = el("div", { className: "gap-suite-tabs", attrs: { role: "tablist", "aria-label": "Спосіб візуалізації прогалин" } });
  const modeHeading = el("div", { className: "gap-suite-mode-heading" });
  const scene = el("div", { className: "gap-suite-scene", attrs: { id: "gap-visual-panel", role: "tabpanel", tabindex: "0" } });
  const inspector = el("aside", { className: "gap-suite-inspector", attrs: { "aria-live": "polite", "aria-label": "Доказовий контекст вибраного сигналу" } });
  const workspace = el("div", { className: "gap-suite-workspace" }, [scene, inspector]);

  function clearBridgeFocus() {
    suite.querySelectorAll("[data-gap-bridge-target]").forEach((button) => button.setAttribute("aria-pressed", "false"));
  }

  function selectCell(cellId) {
    const cell = model.cellsById.get(cellId);
    if (!cell) return;
    selectedCellId = cell.id;
    clearBridgeFocus();
    setActiveTargets(suite, selectedCellId);
    const hypothesis = model.hypothesis(cell.hypothesisId);
    const column = model.column(cell.columnId);
    const linkedBridges = projection.bridges.filter((bridge) => bridge.origin === "workup" && bridge.hypothesisIds.includes(cell.hypothesisId));
    inspector.replaceChildren(
      el("div", { className: "gap-suite-inspector-head" }, [
        el("span", { className: "gap-suite-state-label", text: model.stateMeta[cell.thermal]?.label || cell.label, attrs: { "data-thermal": cell.thermal } }),
        el("h3", { text: hypothesis?.displayLabel || "Робоча гіпотеза" }),
        el("p", { text: column?.label || "Доказовий домен" }),
      ]),
      el("section", {}, [el("h4", { text: "Що зафіксовано" }), el("p", { text: cell.signal })]),
    );
    const open = el("section", {}, [el("h4", { text: "Що залишається відкритим" })]);
    open.append(cell.gaps.length
      ? el("ul", {}, cell.gaps.map((gap) => el("li", { text: gap })))
      : el("p", { text: cell.thermal === "unmapped" ? "Типізований зв’язок із цим доменом не записано." : "Окремої прогалини в цьому домені не записано." }));
    inspector.append(open);
    if (linkedBridges.length) {
      const next = el("section", {}, [el("h4", { text: "Пов’язані кроки верифікації" })]);
      linkedBridges.forEach((bridge) => {
        const item = el("article", { className: "gap-suite-inspector-action" }, [el("strong", { text: `${bridge.id} · ${bridge.title}` }), el("p", { text: bridge.action })]);
        evidenceRefs(item, bridge.evidenceRefs, ui.evidenceNode);
        next.append(item);
      });
      inspector.append(next);
    }
    inspector.append(el("a", { className: "overview-text-link focus-ring", text: "Простежити факти на графі →", attrs: { href: ui.graphUrl } }));
  }

  function selectBridge(bridgeId) {
    const bridge = projection.bridges.find((item) => item.id === bridgeId);
    if (!bridge) return;
    selectedCellId = null;
    setActiveTargets(suite, null);
    clearBridgeFocus();
    suite.querySelectorAll(`[data-gap-bridge-target="${CSS.escape(bridgeId)}"]`).forEach((button) => button.setAttribute("aria-pressed", "true"));
    const affected = bridge.hypothesisIds.map((id) => model.hypothesis(id)).filter(Boolean);
    inspector.replaceChildren(
      el("div", { className: "gap-suite-inspector-head" }, [
        el("span", { className: "gap-suite-state-label", text: "спільна перевірка", attrs: { "data-thermal": "cold" } }),
        el("h3", { text: bridge.title }),
        el("p", { text: bridge.phase }),
      ]),
      el("section", {}, [el("h4", { text: "Чому це важливо" }), el("p", { text: bridge.detail })]),
      el("section", {}, [el("h4", { text: "Крок верифікації" }), el("p", { text: bridge.action })]),
    );
    const impact = el("section", {}, [el("h4", { text: "На що впливає" })]);
    impact.append(affected.length ? el("ul", {}, affected.map((item) => el("li", { text: item.displayLabel }))) : el("p", { text: "Наступний етап без прив’язки до однієї гіпотези." }));
    evidenceRefs(impact, bridge.evidenceRefs, ui.evidenceNode);
    inspector.append(impact);
  }

  function renderMode({ updateUrl = true } = {}) {
    const view = GAP_VISUALIZATIONS.find((item) => item.id === activeMode) || GAP_VISUALIZATIONS[0];
    modeTabs.querySelectorAll("button").forEach((button) => {
      const active = button.dataset.gapView === view.id;
      button.setAttribute("aria-selected", active ? "true" : "false");
      button.setAttribute("tabindex", active ? "0" : "-1");
    });
    modeHeading.replaceChildren(el("h3", { text: view.label }), el("p", { text: view.description }));
    scene.replaceChildren(view.render({ model, onCell: selectCell, selectedCellId }));
    scene.dataset.mode = view.id;
    if (selectedCellId) setActiveTargets(scene, selectedCellId);
    if (updateUrl) {
      const url = new URL(window.location.href);
      url.searchParams.set("gapviz", view.id);
      history.replaceState(history.state, "", url);
    }
  }

  GAP_VISUALIZATIONS.forEach((view) => {
    const button = el("button", {
      className: "gap-suite-tab focus-ring",
      attrs: { type: "button", role: "tab", "data-gap-view": view.id, "aria-controls": "gap-visual-panel", "aria-selected": "false", tabindex: "-1" },
    }, [el("strong", { text: view.label })]);
    button.addEventListener("click", () => {
      activeMode = view.id;
      renderMode();
      scene.focus({ preventScroll: true });
    });
    button.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const current = GAP_VISUALIZATIONS.findIndex((item) => item.id === activeMode);
      const next = event.key === "Home" ? 0 : event.key === "End" ? GAP_VISUALIZATIONS.length - 1 : (current + (event.key === "ArrowRight" ? 1 : -1) + GAP_VISUALIZATIONS.length) % GAP_VISUALIZATIONS.length;
      activeMode = GAP_VISUALIZATIONS[next].id;
      renderMode();
      modeTabs.querySelector(`[data-gap-view="${activeMode}"]`)?.focus();
    });
    modeTabs.append(button);
  });

  const keys = el("div", { className: "gap-suite-keys" }, [makeStateLegend(model), makeDomainLegend(model)]);
  suite.append(modeTabs, modeHeading, keys, workspace);

  const bridgeSection = el("section", { className: "gap-suite-bridges" }, [
    el("header", {}, [
      el("span", { text: "Мости прогалин" }),
      el("h3", { text: "Наступні перевірки з найбільшим охопленням" }),
      el("p", { text: "Вибір показує зону впливу без переранжування диференціалу." }),
    ]),
  ]);
  const bridgeList = el("div", { className: "gap-suite-bridge-list" });
  projection.bridges.filter((bridge) => bridge.origin === "workup").forEach((bridge) => {
    const button = el("button", { className: "gap-suite-bridge focus-ring", attrs: { type: "button", "data-gap-bridge-target": bridge.id, "aria-pressed": "false" } }, [
      el("span", { text: bridge.id }),
      el("strong", { text: bridge.title }),
      el("small", { text: bridge.hypothesisIds.length ? countLabel(bridge.hypothesisIds.length, "гіпотеза", "гіпотези") : "наступний етап" }),
    ]);
    button.addEventListener("click", () => selectBridge(bridge.id));
    bridgeList.append(button);
  });
  bridgeSection.append(bridgeList.childElementCount ? bridgeList : el("p", { text: "Окремих кроків верифікації не записано." }));
  suite.append(bridgeSection, makeAuditRegistry(model, selectCell));
  fragment.append(suite);
  renderMode({ updateUrl: false });
  if (selectedCellId) selectCell(selectedCellId);
  return fragment;
}
