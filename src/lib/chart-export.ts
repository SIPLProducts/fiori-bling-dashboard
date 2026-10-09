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

export type CsvColumn<T> = {
  label: string;
  value: (row: T) => unknown;
};

/** Build export rows from the currently selected table columns, preserving their order. */
export function selectCsvColumns<T>(rows: T[], columns: CsvColumn<T>[]): Array<Record<string, unknown>> {
  return rows.map((row) =>
    Object.fromEntries(columns.map((column) => [column.label, column.value(row)])),
  );
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
  options?: {
    headerSelector?: string;
    blockSelector?: string;
    sectionBreakSelector?: string;
    footerText?: string;
    preserveComputedChartColors?: boolean;
  },
) {
  if (!container) throw new Error("Dashboard is not available yet");

  const [{ toCanvas }, { jsPDF }] = await Promise.all([import("html-to-image"), import("jspdf")]);
  const headerElement = options?.headerSelector
    ? container.querySelector<HTMLElement>(options.headerSelector)
    : null;
  const blocks = options?.blockSelector
    ? Array.from(container.querySelectorAll<HTMLElement>(options.blockSelector)).filter(
        (block) => !block.matches(excludeSelector) && block !== headerElement,
      )
    : Array.from(container.children).filter(
        (child): child is HTMLElement =>
          child instanceof HTMLElement && !child.matches(excludeSelector) && child !== headerElement,
      );
  if (!blocks.length) throw new Error("No dashboard sections are available for export");

  const capture = async (element: HTMLElement) => {
    const restorations: Array<() => void> = [];
    if (options?.preserveComputedChartColors) {
      for (const node of element.querySelectorAll<SVGElement>("svg, svg *")) {
        const previous = node.getAttribute("style");
        const computed = window.getComputedStyle(node);
        const colors = ["fill", "stroke", "stop-color", "stop-opacity", "fill-opacity", "stroke-opacity"]
          .map((property) => [property, computed.getPropertyValue(property)] as const);
        for (const [property, value] of colors) {
          if (value) node.style.setProperty(property, value, "important");
        }
        restorations.push(() => {
          if (previous === null) node.removeAttribute("style");
          else node.setAttribute("style", previous);
        });
      }
    }
    const background = window.getComputedStyle(element).backgroundColor;
    try {
      return await toCanvas(element, {
      backgroundColor:
        background && background !== "rgba(0, 0, 0, 0)" && background !== "transparent"
          ? background
          : "#ffffff",
      cacheBust: true,
      pixelRatio: 2,
      skipFonts: true,
      filter: (node) => !(node instanceof HTMLElement && node.matches(excludeSelector)),
      });
    } finally {
      restorations.forEach((restore) => restore());
    }
  };

  const headerCanvas = headerElement
    ? await capture(headerElement)
    : null;
  const blockCanvases = await Promise.all(
    blocks.map(async (element) => ({
      canvas: await capture(element),
      startsSection: options?.sectionBreakSelector
        ? element.matches(options.sectionBreakSelector)
        : false,
    })),
  );

  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4", compress: true });
  const marginX = 12;
  const marginY = 15;
  const printableWidth = pdf.internal.pageSize.getWidth() - marginX * 2;
  const printableHeight = pdf.internal.pageSize.getHeight() - marginY * 2;
  const headerHeight = headerCanvas ? (headerCanvas.height / headerCanvas.width) * printableWidth : 0;
  const headerGap = headerCanvas ? 4 : 0;
  const footerHeight = 7;
  const contentTop = marginY + headerHeight + headerGap;
  const contentBottom = pdf.internal.pageSize.getHeight() - marginY - footerHeight;
  const contentHeight = contentBottom - contentTop;
  const blockGap = 3;
  const pages: Array<Array<{ canvas: HTMLCanvasElement; width: number; height: number }>> = [[]];
  let usedHeight = 0;

  for (const item of blockCanvases) {
    let width = printableWidth;
    let height = (item.canvas.height / item.canvas.width) * width;
    if (height > contentHeight) {
      const scale = contentHeight / height;
      width *= scale;
      height = contentHeight;
    }
    const current = pages.at(-1);
    if (!current) throw new Error("Unable to create the first PDF page");
    const requiresBreak = item.startsSection && current.length > 0;
    const requiredHeight = (current.length ? blockGap : 0) + height;
    if (requiresBreak || usedHeight + requiredHeight > contentHeight) {
      pages.push([]);
      usedHeight = 0;
    }
    const target = pages.at(-1);
    if (!target) throw new Error("Unable to compose the PDF page");
    target.push({ canvas: item.canvas, width, height });
    usedHeight += (target.length > 1 ? blockGap : 0) + height;
  }

  pages.forEach((page, pageIndex) => {
    if (pageIndex > 0) pdf.addPage("a4", "landscape");
    if (headerCanvas) {
      pdf.addImage(headerCanvas.toDataURL("image/png"), "PNG", marginX, marginY, printableWidth, headerHeight);
    }
    let y = contentTop;
    page.forEach((item, blockIndex) => {
      if (blockIndex > 0) y += blockGap;
      const x = marginX + (printableWidth - item.width) / 2;
      pdf.addImage(item.canvas.toDataURL("image/png"), "PNG", x, y, item.width, item.height);
      y += item.height;
    });

    const footerY = pdf.internal.pageSize.getHeight() - marginY + 1;
    pdf.setDrawColor(211, 218, 226);
    pdf.setLineWidth(0.2);
    pdf.line(marginX, footerY - 4, pdf.internal.pageSize.getWidth() - marginX, footerY - 4);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.5);
    pdf.setTextColor(100, 116, 139);
    pdf.text(options?.footerText ?? "HBL Confidential — Internal Use Only", pdf.internal.pageSize.getWidth() / 2, footerY, { align: "center" });
    pdf.text(`Page ${pageIndex + 1} of ${pages.length}`, pdf.internal.pageSize.getWidth() - marginX, footerY, { align: "right" });
  });

  if (!pages[0]?.length) {
    throw new Error("No dashboard pages could be composed");
  }

  pdf.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
}
