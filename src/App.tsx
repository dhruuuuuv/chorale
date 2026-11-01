import { useEffect, useSyncExternalStore } from "react";
import { DEFAULT_CHORALE, useStore } from "./state/store";
import { Library } from "./ui/Library";
import { Workspace } from "./ui/Workspace";

type Route = { screen: "library" } | { screen: "chorale"; id: string };

function parseRoute(hash: string): Route {
  if (hash.startsWith("#/library")) return { screen: "library" };
  const m = /^#\/chorale\/([\w.-]+)/.exec(hash);
  return { screen: "chorale", id: m?.[1] ?? useStore.getState().chorale?.id ?? DEFAULT_CHORALE };
}

function useRoute(): Route {
  const hash = useSyncExternalStore(
    (cb) => {
      window.addEventListener("hashchange", cb);
      return () => window.removeEventListener("hashchange", cb);
    },
    () => window.location.hash,
  );
  return parseRoute(hash);
}

export function App() {
  const route = useRoute();
  const theme = useStore((s) => s.theme);
  const highContrast = useStore((s) => s.highContrast);
  const chorale = useStore((s) => s.chorale);
  const load = useStore((s) => s.load);
  const openChorale = useStore((s) => s.openChorale);
  const loadIndex = useStore((s) => s.loadIndex);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "system") root.removeAttribute("data-theme");
    else root.dataset.theme = theme;
    const contrast = highContrast || matchMedia("(prefers-contrast: more)").matches;
    if (contrast) root.dataset.contrast = "more";
    else root.removeAttribute("data-contrast");
  }, [theme, highContrast]);

  useEffect(() => {
    loadIndex().catch(() => undefined);
  }, [loadIndex]);

  const wantedId = route.screen === "chorale" ? route.id : null;
  useEffect(() => {
    if (wantedId) void openChorale(wantedId);
  }, [wantedId, openChorale]);

  useEffect(() => {
    document.title = route.screen === "library" ? "Chorale Workshop" : chorale ? `${chorale.title} · Chorale Workshop` : "Chorale Workshop";
  }, [route.screen, chorale]);

  if (route.screen === "library") return <Library />;

  if (load.status === "error" && load.id === wantedId) {
    return (
      <div className="fallback">
        <h1>{load.offline ? "This chorale is available when you’re back online" : "This chorale could not be opened"}</h1>
        <p>{load.offline ? "Chorales you have opened before still work offline." : "Check the link, or pick another from the list."}</p>
        <a className="text-button" href="#/library">
          All chorales
        </a>
      </div>
    );
  }

  if (!chorale) {
    return (
      <div className="fallback" aria-busy="true">
        <p>Opening the chorale…</p>
      </div>
    );
  }

  return <Workspace chorale={chorale} />;
}
