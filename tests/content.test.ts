import { describe, it, expect } from 'vitest';
import { projects } from '../src/data/projects';
import { profile } from '../src/data/profile';
import { experience, practice } from '../src/data/experience';
import { skills, additionalSkills, physicsWords } from '../src/data/skills';
describe('publishable portfolio content', () => {
 it('has an honest identity and routable, complete case studies', () => {
  expect(profile.name).toBe('Eliasib Cantor');
  expect(profile.role).toBe('Full-Stack Software Engineer');
  expect(profile.email).toBe('ecantor.2906@gmail.com');
  expect(profile.primaryStack.slice(0, 5)).toEqual(['C#', '.NET', 'ASP.NET Core', 'Blazor', 'Angular']);
  expect(projects.length).toBeGreaterThanOrEqual(4);
 expect(new Set(projects.map(p => p.slug)).size).toBe(projects.length);
  for(const p of projects) { expect(p.slug).toMatch(/^[a-z0-9-]+$/); expect(p.overview.length).toBeGreaterThan(40); expect(p.architecture.length).toBeGreaterThan(0); expect(p.image).toMatch(/^\/images\//); }
 });
 it('records real employment with complete, technology-tagged entries', () => {
  expect(experience.length).toBeGreaterThanOrEqual(4);
  expect(experience[0].role).toBe('Semi-senior Software Engineer');
  expect(experience[0].company).toBe('Remote Dev-Team');
  for(const job of experience) {
   expect(job.role.length).toBeGreaterThan(0);
   expect(job.company.length).toBeGreaterThan(0);
   expect(job.period.length).toBeGreaterThan(0);
   expect(job.location.length).toBeGreaterThan(0);
   expect(job.description.length).toBeGreaterThan(40);
   expect(job.brief.length).toBeGreaterThan(20);
   expect(job.technologies.length).toBeGreaterThanOrEqual(3);
  }
  expect(practice).toHaveLength(5);
  expect(practice.map(b => b.number)).toEqual(['01', '02', '03', '04', '05']);
  expect(practice[4].name).toBe('Semi-senior Software Engineer');
  for(const base of practice) {
   expect(base.discipline.length).toBeGreaterThan(0);
   expect(base.description.length).toBeGreaterThan(20);
   expect(base.technologies.length).toBeGreaterThanOrEqual(3);
   expect(Number.isFinite(base.base.x)).toBe(true);
   expect(Number.isFinite(base.base.z)).toBe(true);
  }
 });
 it('keeps the ecosystem vocabulary aligned with the real stack', () => {
  expect(skills.map(s => s.id)).toEqual(['backend', 'frontend', 'database', 'devops', 'tools']);
  expect(additionalSkills).toContain('Python');
  expect(physicsWords).toContain('C#');
 });
});
