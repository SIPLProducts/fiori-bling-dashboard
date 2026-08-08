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
straight  ];
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
