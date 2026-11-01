/// <reference lib="webworker" />
import createVerovioModule from "verovio/wasm";
import { VerovioToolkit } from "verovio/esm";

/**
 * Engraves MusicXML with Verovio off the main thread. Verovio is several MB of WebAssembly,
 * so it is only loaded the first time someone opens the score view.
 */
export interface RenderRequest {
  id: string;
  xml: string;
}

export interface TimemapEntry {
  qstamp: number;
  on?: string[];
  off?: string[];
}

export type RenderResponse = { id: string; ok: true; svg: string; timemap: TimemapEntry[] } | { id: string; ok: false; error: string };

const ready = createVerovioModule().then((m) => new VerovioToolkit(m));

self.onmessage = async (e: MessageEvent<RenderRequest>) => {
  const { id, xml } = e.data;
  try {
    const tk = await ready;
    tk.setOptions({
      breaks: "none",
      scale: 45,
      adjustPageHeight: true,
      header: "none",
      footer: "none",
      svgViewBox: true,
      pageMarginLeft: 20,
      pageMarginRight: 20,
      pageMarginTop: 0,
      pageMarginBottom: 0,
    });
    if (!tk.loadData(xml)) throw new Error("Verovio could not read the score");
    const svg = tk.renderToSVG(1);
    const timemap = tk.renderToTimemap({ includeMeasures: false, includeRests: false }) as unknown as TimemapEntry[];
    (self as unknown as Worker).postMessage({ id, ok: true, svg, timemap } satisfies RenderResponse);
  } catch (err) {
    (self as unknown as Worker).postMessage({ id, ok: false, error: String(err) } satisfies RenderResponse);
  }
};
