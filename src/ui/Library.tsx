import { useEffect, useId, useMemo, useState } from "react";
import { engine } from "../audio";
import { sameText, searchChorales } from "../lib/search";
import { useStore } from "../state/store";
import type { IndexEntry } from "../types";
import { Icon } from "./Icon";
import { Mark } from "./Mark";

const PREVIEW_SECONDS = 20;
/** One timer for every preview: starting a new one cancels the last one's stop. */
let previewTimer = 0;

export function Library() {
  const index = useStore((s) => s.index);
  const [query, setQuery] = useState("");
  const searchId = useId();
  const offline = useOffline();
  const available = useAvailableOffline(index, offline);
  const results = useMemo(() => (index ? searchChorales(index, query) : []), [index, query]);
  const shelf = useMemo(() => (index ? index.filter((c) => c.startHere).sort((a, b) => a.startHere! - b.startHere!) : []), [index]);

  // Previews stop when you leave the library.
  useEffect(() => () => engine.pause(), []);

  return (
    <div className="library">
      <header className="library-head">
        <a className="home" href="#/" aria-label="Back to the open chorale">
          <Mark size={34} />
        </a>
        <div>
          <h1>Chorale Workshop</h1>
          <p className="library-lede">Thirty of Bach’s four-part chorales, checked by hand. Hear each voice, loop a phrase, sing your part.</p>
        </div>
      </header>

      <main id="main">
        <section className="shelf" aria-labelledby="start-here">
          <h2 id="start-here">Start here</h2>
          <ol className="shelf-list">
            {shelf.map((c) => (
              <li key={c.id}>
                <ShelfItem c={c} unavailable={offline && !available.has(c.id)} />
              </li>
            ))}
          </ol>
        </section>

        <section className="collection" aria-labelledby="all-chorales">
          <div className="collection-head">
            <h2 id="all-chorales">All chorales</h2>
            <div className="search">
              <Icon name="search" />
              <label htmlFor={searchId} className="visually-hidden">
                Search by title, first line, BWV or Riemenschneider number
              </label>
              <input id={searchId} type="search" placeholder="Title, first line, BWV or Riemenschneider no." value={query} onChange={(e) => setQuery(e.target.value)} autoComplete="off" spellCheck={false} />
            </div>
          </div>
          {offline && <p className="offline-note">You’re offline. Chorales you have opened before still play.</p>}
          {index && results.length === 0 && (
            <p className="empty">
              Nothing matches “{query}”. Try a title, a word from the first line, or a number such as BWV 244 or R 74.
            </p>
          )}
          {results.length > 0 && (
            <table className="chorale-table">
              <caption className="visually-hidden">All chorales, {results.length} shown</caption>
              <thead>
                <tr>
                  <th scope="col">Title</th>
                  <th scope="col" className="num-head">
                    BWV
                  </th>
                  <th scope="col" className="num-head">
                    <abbr title="Riemenschneider">Riem.</abbr>
                  </th>
                  <th scope="col">Key</th>
                </tr>
              </thead>
              <tbody>
                {results.map((c) => {
                  const unavailable = offline && !available.has(c.id);
                  return (
                    <tr key={c.id} className={unavailable ? "is-unavailable" : undefined}>
                      <th scope="row">
                        {unavailable ? (
                          <span className="row-title">
                            {c.title}
                            <span className="row-note">Available when you’re back online</span>
                          </span>
                        ) : (
                          <a className="row-title" href={`#/chorale/${c.id}`}>
                            {c.title}
                            {!sameText(c.firstLine, c.title) && (
                              <span className="row-first" lang="de">
                                {c.firstLine}
                              </span>
                            )}
                          </a>
                        )}
                      </th>
                      <td className="num">{c.bwv}</td>
                      <td className="num">{c.riemenschneider}</td>
                      <td>{c.key}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>
      </main>
      <footer className="library-foot">
        <p>Scores from the music21 corpus, repeats written out. Translations are literal, line for line.</p>
        <p>
          Quartet voices from the{" "}
          <a href="https://doi.org/10.5281/zenodo.1286570" rel="noreferrer" target="_blank">
            Choral Singing Dataset
          </a>{" "}
          (Cuesta, Gómez, Martorell, Loáiciga 2018), sung by the Anton Bruckner Choir, Barcelona, used under{" "}
          <a href="https://creativecommons.org/licenses/by/4.0/" rel="noreferrer" target="_blank">
            CC BY 4.0
          </a>
          .
        </p>
        <p>
          Choir samples derived from{" "}
          <a href="https://doi.org/10.5281/zenodo.1442513" rel="noreferrer" target="_blank">
            VocalSet
          </a>{" "}
          (Wilkins, Seetharaman, Wahl, Pardo 2018) via{" "}
          <a href="https://github.com/thepok/epic-choir" rel="noreferrer" target="_blank">
            epic-choir
          </a>
          , used under{" "}
          <a href="https://creativecommons.org/licenses/by/4.0/" rel="noreferrer" target="_blank">
            CC BY 4.0
          </a>
          .
        </p>
      </footer>
    </div>
  );
}

function ShelfItem({ c, unavailable }: { c: IndexEntry; unavailable: boolean }) {
  const openChorale = useStore((s) => s.openChorale);
  const playingId = useStore((s) => (s.playing ? s.chorale?.id : null));
  const previewing = playingId === c.id;

  const preview = async () => {
    clearTimeout(previewTimer);
    if (previewing) {
      engine.pause();
      return;
    }
    await openChorale(c.id);
    if (useStore.getState().chorale?.id !== c.id) return;
    engine.seek(0);
    await engine.play();
    previewTimer = window.setTimeout(() => engine.pause(), PREVIEW_SECONDS * 1000);
  };

  return (
    <article className={`shelf-item${unavailable ? " is-unavailable" : ""}`}>
      <h3>
        {unavailable ? (
          c.title
        ) : (
          <a href={`#/chorale/${c.id}`} className="stretched">
            {c.title}
          </a>
        )}
      </h3>
      <p className="shelf-translation">{c.translation}</p>
      <p className="shelf-meta">
        {c.key} · {c.phrases} phrases
      </p>
      <p className="shelf-source">{c.source}</p>
      {unavailable ? (
        <p className="row-note">Available when you’re back online</p>
      ) : (
        <button type="button" className="preview" aria-pressed={previewing} onClick={() => void preview()}>
          <Icon name={previewing ? "pause" : "play"} size={16} />
          <span>{previewing ? "Stop" : "Preview"}</span>
          <span className="visually-hidden">{c.title}</span>
        </button>
      )}
    </article>
  );
}

function useOffline(): boolean {
  const [offline, setOffline] = useState(() => typeof navigator !== "undefined" && !navigator.onLine);
  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  return offline;
}

/** Which chorales the service worker has cached, checked only when offline. */
function useAvailableOffline(index: IndexEntry[] | null, offline: boolean): Set<string> {
  const [ids, setIds] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!offline || !index || !("caches" in window)) return;
    let cancelled = false;
    (async () => {
      const found = new Set<string>();
      for (const c of index) {
        const hit = await caches.match(`${import.meta.env.BASE_URL}data/${c.id}.json`, { ignoreSearch: true });
        if (hit) found.add(c.id);
      }
      if (!cancelled) setIds(found);
    })();
    return () => {
      cancelled = true;
    };
  }, [index, offline]);
  return ids;
}
