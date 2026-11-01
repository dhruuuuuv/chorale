/**
 * A small, warm room for the voices, built from decaying noise so it needs no download.
 * High frequencies die away faster than low ones, as they do in a real hall.
 */
export function createRoom(ctx: BaseAudioContext, seconds = 1.9): ConvolverNode {
  const rate = ctx.sampleRate;
  const length = Math.round(rate * seconds);
  const ir = ctx.createBuffer(2, length, rate);
  const predelay = Math.round(rate * 0.018);
  for (let ch = 0; ch < 2; ch++) {
    const data = ir.getChannelData(ch);
    let seed = ch === 0 ? 0x9e3779b9 : 0x7f4a7c15;
    let low = 0;
    for (let i = predelay; i < length; i++) {
      // xorshift noise, so the room is the same on every device.
      seed ^= seed << 13;
      seed ^= seed >>> 17;
      seed ^= seed << 5;
      const white = ((seed >>> 0) / 0xffffffff) * 2 - 1;
      const t = (i - predelay) / rate;
      // A one-pole low-pass whose cut-off falls over time darkens the tail.
      const k = 0.55 + 0.4 * Math.min(1, t / seconds);
      low = low * k + white * (1 - k);
      data[i] = low * Math.exp((-6.9 * t) / seconds) * 1.6;
    }
  }
  const conv = ctx.createConvolver();
  conv.buffer = ir;
  return conv;
}
