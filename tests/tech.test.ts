import { expect, it } from 'vitest';
import { techGroups } from '../src/data/tech';

it('documents a grouped, verifiable tool wall with local glyphs', () => {
  expect(techGroups.map(g => g.id)).toEqual(['languages', 'backend', 'devops', 'drivers', 'ai']);
  const names: string[] = [];
  for (const group of techGroups) {
    expect(group.label.length).toBeGreaterThan(0);
    expect(group.items.length).toBeGreaterThanOrEqual(3);
    for (const item of group.items) {
      expect(item.name.length).toBeGreaterThan(0);
      names.push(item.name);
      if (item.icon) expect(item.icon.startsWith('<svg')).toBe(true);
      else expect(item.glyph && item.glyph.length).toBeGreaterThan(0);
    }
  }
  expect(new Set(names).size).toBe(names.length);
  expect(names).toContain('C#');
  expect(names).toContain('SQL Server');
  expect(names).toContain('Docker');
});
