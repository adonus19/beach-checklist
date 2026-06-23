import { buildPlan } from './data';

describe('packing plan', () => {
  it('builds days with groups and items', () => {
    const days = buildPlan();
    expect(days.length).toBeGreaterThan(0);
    const totalItems = days.reduce(
      (s, d) => s + d.groups.reduce((a, g) => a + g.items.length, 0),
      0,
    );
    expect(totalItems).toBeGreaterThan(0);
  });

  it('gives every item a unique id', () => {
    const ids = buildPlan().flatMap((d) => d.groups.flatMap((g) => g.items.map((i) => i.id)));
    expect(new Set(ids).size).toBe(ids.length);
  });
});
