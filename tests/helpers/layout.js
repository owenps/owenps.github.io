import { expect } from '@playwright/test';

// Sample rendered bounds, including motion driven by JavaScript rather than CSS.
export async function expectStableBounds(locator, expectedBounds) {
  const frames = await locator.evaluate((element, duration) => new Promise(resolve => {
    const bounds = () => {
      const { x, y, width, height } = element.getBoundingClientRect();
      return { x, y, width, height };
    };
    const samples = [bounds()];
    const start = performance.now();
    function sample(time) {
      samples.push(bounds());
      if (time - start < duration) requestAnimationFrame(sample);
      else resolve(samples);
    }
    requestAnimationFrame(sample);
  }), 300);
  for (const frame of frames) expect(frame).toEqual(expectedBounds ?? frames[0]);
}
