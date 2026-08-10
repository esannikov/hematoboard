import { el, setActiveTargets } from "./dom.js";
import { createGapVisualModel } from "./model.js";
import { scalesView } from "./scales.js";

export const GAP_VISUALIZATIONS = Object.freeze([
  scalesView,
]);

function evidenceRefs(target, refs, evidenceNode, sourceChip) {
  const nodes = (refs || []).map((ref) => evidenceNode?.(ref) || sourceChip?.(ref, { compact: true })).filter(Boolean);
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
  const perimeterItems = model.projection.sourcePerimeter.filter((item) => item.origin !== "candidate_revision");
  const disclosure = el("details", { className: "gap-suite-registry" });
  disclosure.append(el("summary", {}, [
    el("span", { text: "Повний реєстр невизначеності" }),
    el("strong", { text: `${perimeterItems.length + model.projection.hypothesesWithoutTypedLinks.length} поза гіпотезами` }),
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
  perimeterItems.forEach((item) => {
    perimeter.append(el("article", {
      attrs: { "data-gap-origin": item.origin || "source" },
    }, [
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

function priorityLabel(value) {
  return ({
    critical: "критичний",
    high: "високий",
    medium: "середній",
    conditional: "за клінічною потребою",
  })[value] || "пріоритет не вказано";
}

function makeCandidateSourceTrace(ui) {
  const sources = Array.isArray(ui.candidateSources) ? ui.candidateSources : [];
  if (!sources.length) return null;
  const coverage = ui.traceCoverage || { tracedItems: 0, totalItems: 0 };
  const chips = sources.map((source) => ui.sourceChip?.(source.id, { compact: true })).filter(Boolean);
  const trace = el("aside", { className: "gap-source-trace" }, [
    el("div", { className: "gap-source-trace-head" }, [
      el("div", {}, [
        el("strong", { text: `Джерела кандидатної ревізії · ${sources.length}` }),
        el("p", {
          text: coverage.totalItems
            ? `Це не повний огляд літератури. Точний зв’язок записано для ${coverage.tracedItems} із ${coverage.totalItems} прогалин і кроків перевірки.`
            : "Це не повний огляд літератури. Точний зв’язок з окремим пунктом потребує явного source ref.",
        }),
      ]),
      el("span", { text: coverage.totalItems > 0 && coverage.tracedItems === coverage.totalItems ? "трейс заповнено" : "покриття неповне" }),
    ]),
    el("div", { className: "gap-source-chip-row", attrs: { "aria-label": "Зовнішні джерела кандидатного плану" } }, chips),
  ]);
  const useLimit = sources.find((source) => source.use_limit)?.use_limit;
  if (useLimit) trace.append(el("p", { className: "gap-source-use-limit", text: ui.clinicalText?.(useLimit) || useLimit }));
  return trace;
}

function makeDecisionLayer(model, selectBridge, ui) {
  const criticalGaps = model.projection.sourcePerimeter.filter((item) => item.origin === "candidate_revision");
  const workup = model.projection.bridges.filter((item) => item.origin === "workup");
  const sharedCount = workup.filter((item) => item.hypothesisIds.length > 1).length;
  const layer = el("section", { className: "gap-decision-layer", attrs: { "aria-labelledby": "gap-decision-title" } });
  layer.append(el("header", { className: "gap-decision-head" }, [
    el("div", {}, [
      el("span", { text: "Рівень рішення" }),
      el("h3", { text: "Від відкритого питання до перевірки", attrs: { id: "gap-decision-title" } }),
      el("p", { text: "Прогалина тут означає конкретне невирішене клінічне питання. Пріоритет і охоплення гіпотез беруться з кандидатної ревізії; це не оцінка ймовірності діагнозу." }),
    ]),
    el("dl", {}, [
      el("div", {}, [el("dt", { text: "Критичні питання" }), el("dd", { text: criticalGaps.length })]),
      el("div", {}, [el("dt", { text: "Кроки перевірки" }), el("dd", { text: workup.length })]),
      el("div", {}, [el("dt", { text: "Спільні кроки" }), el("dd", { text: sharedCount })]),
    ]),
  ]));
  const sourceTrace = makeCandidateSourceTrace(ui);
  if (sourceTrace) layer.append(sourceTrace);

  const questions = el("section", { className: "gap-critical-questions" }, [
    el("header", {}, [el("span", { text: "01" }), el("h4", { text: "Критичні прогалини" })]),
  ]);
  const questionList = el("ol", { className: "gap-critical-list" });
  criticalGaps.forEach((gap, index) => {
    questionList.append(el("li", {
      attrs: { "data-candidate-gap-index": gap.candidateIndex, "data-candidate-gap-id": gap.id },
    }, [
      el("span", { text: String(index + 1).padStart(2, "0") }),
      el("div", {}, [
        el("p", { text: gap.title }),
      ]),
    ]));
    if (gap.evidenceRefs?.length) evidenceRefs(questionList.lastElementChild.lastElementChild, gap.evidenceRefs, ui.evidenceNode, ui.sourceChip);
  });
  questions.append(questionList.childElementCount
    ? questionList
    : el("p", { className: "gap-decision-empty", text: "Окремих критичних питань у цій проєкції не записано." }));

  const plan = el("section", { className: "gap-verification-plan" }, [
    el("header", {}, [el("span", { text: "02" }), el("h4", { text: "План верифікації" })]),
  ]);
  const planList = el("div", { className: "gap-verification-list" });
  workup.forEach((bridge) => {
    const affected = bridge.hypothesisIds.map((id) => model.hypothesis(id)).filter(Boolean);
    const chips = el("div", { className: "gap-verification-hypotheses", attrs: { "aria-label": "Гіпотези, на які впливає перевірка" } });
    affected.forEach((hypothesis) => chips.append(el("span", {
      text: hypothesis.id,
      attrs: { title: hypothesis.displayLabel },
    })));
    const item = el("article", {
      className: "gap-verification-step",
      attrs: { "data-priority": bridge.priority || "unspecified" },
    });
    const button = el("button", {
      className: "gap-verification-select focus-ring",
      attrs: {
        type: "button",
        "data-gap-bridge-target": bridge.id,
        "aria-pressed": "false",
      },
    }, [
      el("span", { className: "gap-verification-code", text: bridge.id }),
      el("div", { className: "gap-verification-copy" }, [
        el("div", { className: "gap-verification-meta" }, [
          el("span", { text: priorityLabel(bridge.priority), attrs: { "data-priority": bridge.priority || "unspecified" } }),
          el("span", { text: bridge.hypothesisIds.length > 1 ? `спільний крок · ${bridge.hypothesisIds.length} гіпотези` : "цільова перевірка" }),
        ]),
        el("strong", { text: bridge.title }),
        el("p", { text: bridge.detail }),
        chips,
      ]),
    ]);
    button.addEventListener("click", () => selectBridge(bridge.id));
    item.append(button);
    if (bridge.evidenceRefs.length) evidenceRefs(item, bridge.evidenceRefs, ui.evidenceNode, ui.sourceChip);
    planList.append(item);
  });
  plan.append(planList.childElementCount
    ? planList
    : el("p", { className: "gap-decision-empty", text: "Кроків верифікації не записано." }));

  const hypothesisDetails = el("details", { className: "gap-hypothesis-gaps" });
  hypothesisDetails.append(el("summary", {}, [
    el("span", { text: "Невирішене за гіпотезами" }),
    el("strong", { text: `${model.hypotheses.length} робочі гіпотези` }),
  ]));
  const hypothesisGrid = el("div", { className: "gap-hypothesis-gap-grid" });
  model.hypotheses.forEach((hypothesis) => {
    const missing = Array.isArray(hypothesis.missing_evidence) ? hypothesis.missing_evidence.filter(Boolean) : [];
    hypothesisGrid.append(el("article", {}, [
      el("span", { text: `${hypothesis.id} · ранг №${hypothesis.rank}` }),
      el("h4", { text: hypothesis.displayLabel }),
      missing.length
        ? el("ul", {}, missing.map((item) => el("li", { text: item })))
        : el("p", { text: "Окремого переліку відсутніх доказів не записано." }),
    ]));
  });
  hypothesisDetails.append(hypothesisGrid);
  layer.append(el("div", { className: "gap-decision-grid" }, [questions, plan]), hypothesisDetails);
  return layer;
}

export function renderGapVisualizationSuite({ bundle, projection, ui, projectionSource = "accepted-ledger" }) {
  const model = createGapVisualModel(projection);
  const fragment = document.createDocumentFragment();
  fragment.append(ui.viewHeader(
    "Карта прогалин",
    "Горизонтальні шкали показують записане покриття кожного доказового домену на спільній температурній осі. Домени названі безпосередньо; довжина й колір не показують ймовірність діагнозу.",
    projectionSource === "candidate-revision"
      ? `${ui.caseCode(bundle)} · кандидатна ревізія · перевіряє лікар`
      : `${ui.caseCode(bundle)} · прийнятий пакет`,
  ));

  const metrics = el("dl", { className: "gap-suite-metrics", attrs: { "aria-label": "Стан доказового контуру" } }, [
    makeMetric("Записані прогалини", projection.metrics.explicitGaps || 0, "Окремі клінічні питання, записані у джерельному або кандидатному шарі"),
    makeMetric("Суперечності", projection.metrics.fracture, "Несумісні модальності або типізовані факти"),
    makeMetric("Спільні перевірки", projection.metrics.sharedBridges, "Один крок впливає більш ніж на одну гіпотезу"),
    makeMetric("Перевірено людиною", `${projection.sourceVerification.verified}/${projection.sourceVerification.total}`, "Окремі рішення лікаря щодо джерельних спостережень"),
  ]);
  fragment.append(metrics);

  const suite = el("section", {
    className: "content-section gap-suite",
    attrs: { "data-synthesis-source": projectionSource },
  });
  if (!model.hypotheses.length || !model.columns.length) {
    suite.append(el("h3", { text: "Структури для карти ще недостатньо" }), el("p", { text: "У пакеті мають бути робочі гіпотези й типізовані доказові домени." }));
    fragment.append(suite);
    return fragment;
  }

  const requestedMode = new URL(window.location.href).searchParams.get("gapviz");
  const urlMode = requestedMode === "atlas" ? "scales" : requestedMode;
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
        evidenceRefs(item, bridge.evidenceRefs, ui.evidenceNode, ui.sourceChip);
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
    evidenceRefs(impact, bridge.evidenceRefs, ui.evidenceNode, ui.sourceChip);
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
  suite.append(
    makeDecisionLayer(model, selectBridge, ui),
    el("header", { className: "gap-comparison-head" }, [
      el("span", { text: "Рівень порівняння" }),
      el("h3", { text: "Покриття гіпотез за доказовими доменами" }),
      el("p", { text: "П’ять режимів нижче показують той самий детермінований стан. У режимі шкал довжина показує заповнення доказового домену, а градієнт переходить від холодного до теплого кольору. Це не ймовірність діагнозу." }),
    ]),
    modeTabs,
    modeHeading,
    keys,
    workspace,
    makeAuditRegistry(model, selectCell),
  );
  fragment.append(suite);
  renderMode({ updateUrl: false });
  if (selectedCellId) selectCell(selectedCellId);
  return fragment;
}
