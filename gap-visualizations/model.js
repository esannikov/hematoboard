export const GAP_STATE_META = Object.freeze({
  hot: { label: "щільно простежено", priority: 4 },
  warm: { label: "частково простежено", priority: 3 },
  cool: { label: "сигнал із прогалинами", priority: 1 },
  cold: { label: "відкрита прогалина", priority: 0 },
  fracture: { label: "суперечність", priority: -1 },
  unmapped: { label: "зв’язок не записано", priority: 5 },
});

function normalized(value) {
  return String(value || "").toLocaleLowerCase("uk-UA").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

function columnPresentation(column) {
  const label = normalized(column?.label);
  if (column?.kind === "verification") return { compactLabel: "Перевірка", role: "action", groupLabel: "Наступна дія" };
  if (/якість джерела/u.test(label)) return { compactLabel: "Джерело", role: "trust", groupLabel: "Довіра" };
  if (/візуал/u.test(label)) return { compactLabel: "Візуалізація", role: "clinical", groupLabel: "Клінічний сигнал" };
  if (/морф/u.test(label)) return { compactLabel: "Морфологія", role: "clinical", groupLabel: "Клінічний сигнал" };
  if (/ігх|tfh/u.test(label)) return { compactLabel: "ІГХ / TFH", role: "clinical", groupLabel: "Клінічний сигнал" };
  if (/лаборатор/u.test(label)) return { compactLabel: "Лабораторія", role: "clinical", groupLabel: "Клінічний сигнал" };
  if (/вірус|інфек/u.test(label)) return { compactLabel: "Інфекції", role: "clinical", groupLabel: "Клінічний сигнал" };
  return { compactLabel: column?.label || "Домен", role: "clinical", groupLabel: "Клінічний сигнал" };
}

function cellPriority(cell) {
  return GAP_STATE_META[cell?.thermal]?.priority ?? 99;
}

export function createGapVisualModel(projection) {
  const cellsById = new Map(projection.cells.map((cell) => [cell.id, cell]));
  const cellByPair = new Map(projection.cells.map((cell) => [`${cell.hypothesisId}::${cell.columnId}`, cell]));
  const columns = projection.columns.map((column, index) => ({
    ...column,
    ...columnPresentation(column),
    index,
  }));
  const hypotheses = projection.hypotheses.map((hypothesis, index) => ({
    ...hypothesis,
    index,
    displayLabel: hypothesis.short_label || hypothesis.label,
    cells: columns.map((column) => cellByPair.get(`${hypothesis.id}::${column.id}`)).filter(Boolean),
  }));
  columns.forEach((column) => {
    column.cells = hypotheses.map((hypothesis) => cellByPair.get(`${hypothesis.id}::${column.id}`)).filter(Boolean);
  });
  const orderedCells = projection.cells.slice().sort((left, right) => {
    const leftHypothesis = hypotheses.find((item) => item.id === left.hypothesisId);
    const rightHypothesis = hypotheses.find((item) => item.id === right.hypothesisId);
    return cellPriority(left) - cellPriority(right)
      || (leftHypothesis?.rank ?? 999) - (rightHypothesis?.rank ?? 999)
      || left.id.localeCompare(right.id);
  });
  const leadCells = hypotheses[0]?.cells?.slice().sort((left, right) => cellPriority(left) - cellPriority(right)) || [];

  return {
    projection,
    hypotheses,
    columns,
    cellsById,
    cellByPair,
    defaultCellId: leadCells[0]?.id || orderedCells[0]?.id || null,
    stateMeta: GAP_STATE_META,
    groups: ["clinical", "trust", "action"].map((role) => ({
      role,
      label: columns.find((column) => column.role === role)?.groupLabel || role,
      columns: columns.filter((column) => column.role === role),
    })).filter((group) => group.columns.length),
    cell(hypothesisId, columnId) {
      return cellByPair.get(`${hypothesisId}::${columnId}`) || null;
    },
    hypothesis(id) {
      return hypotheses.find((item) => item.id === id) || null;
    },
    column(id) {
      return columns.find((item) => item.id === id) || null;
    },
    columnsFor(role) {
      return columns.filter((column) => column.role === role);
    },
    mostOpenCell(cells) {
      return cells.filter(Boolean).slice().sort((left, right) => cellPriority(left) - cellPriority(right))[0] || null;
    },
  };
}
