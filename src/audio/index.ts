import { AudioEngine } from "./engine";

/** The one audio engine for the app. */
export const engine = new AudioEngine();
engine.useSamples(`${import.meta.env.BASE_URL}samples/`);
