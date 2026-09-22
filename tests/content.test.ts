import { describe, it, expect } from 'vitest';
import { projects } from '../src/data/projects';
import { profile } from '../src/data/profile';
describe('publishable portfolio content', () => {
 it('has an honest identity and routable, complete case studies', () => {
  expect(profile.name).toBe('Eliasib Cantor');
  expect(profile.role).toBe('Full-Stack Software Engineer');
  expect(profile.email).toBe('ecantor.2906@gmail.com');
  expect(projects.length).toBeGreaterThanOrEqual(4);
 expect(new Set(projects.map(p => p.slug)).size).toBe(projects.length);
  for(const p of projects) { expect(p.slug).toMatch(/^[a-z0-9-]+$/); expect(p.overview.length).toBeGreaterThan(40); expect(p.architecture.length).toBeGreaterThan(0); expect(p.image).toMatch(/^\/images\//); }
 });
});
