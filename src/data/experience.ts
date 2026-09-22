export interface Experience {
 role: string; company: string; period: string; location: string; description: string; technologies: string[];
}
// Public profile data confirms the engineering focus, but not employers or dates.
export const experience: Experience[] = [];
export const practice = [
  { number: '01', name: 'Behind the interface.', discipline: 'SYSTEMS / BACKEND', description: 'C#, .NET, ASP.NET Core and Java/Spring Boot. REST APIs, authentication, backend integration and relational data.', technologies: ['C#', '.NET', 'ASP.NET Core', 'Java', 'Spring Boot'] },
  { number: '02', name: 'Where people meet code.', discipline: 'INTERFACES / FRONTEND', description: 'Blazor, Angular and JavaScript-based interfaces. Reusable components, routes, guards and enterprise workflows.', technologies: ['Blazor', 'Angular', 'TypeScript', 'JavaScript'] },
  { number: '03', name: 'Built to keep working.', discipline: 'DELIVERY / CLOUD', description: 'Docker, Linux, Nginx and Azure DevOps. I am extending this practice toward cloud-native and distributed systems.', technologies: ['Docker', 'Linux', 'Nginx', 'Azure DevOps', 'CI/CD'] },
];
