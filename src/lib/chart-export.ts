/** Client-side helpers to export chart data as CSV and chart visuals as PNG. */

function triggerDownload(href: string, filename: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function escapeCell(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows: Array<Record<string, unknown>>, columns?: string[]): string {
  if (!rows.length) return "";
  const cols = columns ?? Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
  const head = cols.map(escapeCell).join(",");
  const body = rows.map((r) => cols.map((c) => escapeCell(r[c])).join(","));
  return [head, ...body].join("\n");
}

export function downloadCsv(
  rows: Array<Record<string, unknown>>,
  filename: string,
  columns?: string[],
) {
  const csv = toCsv(rows, columns);
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, filename.endsWith(".csv") ? filename : `${filename}.csv`);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Resolve CSS custom properties so the detached SVG keeps its colours. */
function inlineComputedStyles(source: SVGSVGElement, clone: SVGSVGElement) {
  const srcNodes = [source, ...Array.from(source.querySelectorAll("*"))];
  const dstNodes = [clone, ...Array.from(clone.querySelectorAll("*"))];
  const props = [
    "fill",
    "fill-opacity",
    "stroke",
    "stroke-width",
    "stroke-opacity",
    "stroke-dasharray",
    "opacity",
    "font-family",
    "font-size",
    "font-weight",
    "text-anchor",
  ];

  srcNodes.forEach((node, i) => {
    const dst = dstNodes[i] as HTMLElement | undefined;
    if (!dst || !(node instanceof Element)) return;
    const computed = window.getComputedStyle(node);
    const decls = props
      .map((p) => {
        const v = computed.getPropertyValue(p);
        return v && v !== "none" && v !== "normal" ? `${p}:${v}` : "";
      })
      .filter(Boolean)
      .join(";");
    if (decls) dst.setAttribute("style", decls);
  });
}

export async function exportChartPng(container: HTMLElement | null, filename: string) {
  if (!container) throw new Error("Chart container not available");
  const svg = container.querySelector("svg");
  if (!svg) throw new Error("Chart not rendered yet");

  const rect = svg.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width));
  const height = Math.max(1, Math.round(rect.height));
  const scale = 2;

  const clone = svg.cloneNode(true) as SVGSVGElement;
  inlineComputedStyles(svg as SVGSVGElement, clone);
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", String(width));
  clone.setAttribute("height", String(height));

  const background = window.getComputedStyle(container).backgroundColor;
  const source = new XMLSerializer().serializeToString(clone);
  const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`;

  const img = new Image();
  img.crossOrigin = "anonymous";
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Unable to rasterise the chart"));
    img.src = svgUrl;
  });

  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.scale(scale, scale);
  ctx.fillStyle =
    background && background !== "rgba(0, 0, 0, 0)" && background !== "transparent"
      ? background
      : "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  const dataUrl = canvas.toDataURL("image/png");
  triggerDownload(dataUrl, filename.endsWith(".png") ? filename : `${filename}.png`);
}

/** Download a dashboard section as a paginated A4 landscape PDF. */
export async function exportDashboardPdf(
  container: HTMLElement | null,
  filename: string,
  excludeSelector = "[data-pdf-exclude]",
) {
  if (!container) throw new Error("Dashboard is not available yet");

  const [{ toCanvas }, { jsPDF }] = await Promise.all([import("html-to-image"), import("jspdf")]);
  const backgroundColor = window.getComputedStyle(container).backgroundColor;
  const canvas = await toCanvas(container, {
    backgroundColor:
      backgroundColor && backgroundColor !== "rgba(0, 0, 0, 0)" && backgroundColor !== "transparent"
        ? backgroundColor
        : "#ffffff",
    cacheBust: true,
    pixelRatio: 1.5,
    filter: (node) => !(node instanceof HTMLElement && node.matches(excludeSelector)),
  });

  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4", compress: true });
  const margin = 8;
  const printableWidth = pdf.internal.pageSize.getWidth() - margin * 2;
  const printableHeight = pdf.internal.pageSize.getHeight() - margin * 2;
  const pixelsPerMm = canvas.width / printableWidth;
  const maxSliceHeight = Math.floor(printableHeight * pixelsPerMm);
  const rootRect = container.getBoundingClientRect();
  const pixelScale = canvas.width / Math.max(rootRect.width, 1);
  const sectionBreaks = Array.from(container.children)
    .filter((child) => !(child instanceof HTMLElement && child.matches(excludeSelector)))
    .map((child) => Math.round((child.getBoundingClientRect().bottom - rootRect.top) * pixelScale))
    .filter((point) => point > 0 && point < canvas.height)
    .sort((a, b) => a - b);

  let sourceY = 0;
  let pageIndex = 0;
  while (sourceY < canvas.height) {
    const idealEnd = Math.min(canvas.height, sourceY + maxSliceHeight);
    const minimumEnd = sourceY + Math.floor(maxSliceHeight * 0.45);
    const safeEnd = [...sectionBreaks]
      .reverse()
      .find((point) => point <= idealEnd && point >= minimumEnd);
    const sourceEnd = idealEnd === canvas.height ? canvas.height : (safeEnd ?? idealEnd);
    const sourceHeight = Math.max(1, sourceEnd - sourceY);
    const pageCanvas = document.createElement("canvas");
    pageCanvas.width = canvas.width;
    pageCanvas.height = sourceHeight;
    const context = pageCanvas.getContext("2d");
    if (!context) throw new Error("PDF canvas is not supported");
    context.drawImage(canvas, 0, sourceY, canvas.width, sourceHeight, 0, 0, canvas.width, sourceHeight);

    if (pageIndex > 0) pdf.addPage("a4", "landscape");
    const imageHeight = sourceHeight / pixelsPerMm;
    pdf.addImage(pageCanvas.toDataURL("image/jpeg", 0.92), "JPEG", margin, margin, printableWidth, imageHeight);
    sourceY = sourceEnd;
    pageIndex += 1;
  }

  pdf.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
}
