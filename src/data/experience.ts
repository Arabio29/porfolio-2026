export interface Experience {
 role: string; company: string; period: string; location: string; description: string; technologies: string[];
}
// No employment history was supplied. Never replace this with invented dates or employers.
export const experience: Experience[] = [];
export const practice = [
 { number: '01', name: 'Behind the interface.', discipline: 'SYSTEMS / BACKEND', description: 'C#, .NET and ASP.NET Core. REST APIs, backend integration and relational databases.', technologies: ['C#', '.NET', 'ASP.NET Core', 'REST APIs'] },
 { number: '02', name: 'Where people meet code.', discipline: 'INTERFACES / FRONTEND', description: 'Blazor, Angular and TypeScript. Frontend architecture, reusable UI libraries and enterprise web applications.', technologies: ['Blazor', 'Angular', 'TypeScript', 'JavaScript'] },
 { number: '03', name: 'Built to keep working.', discipline: 'DELIVERY / MAINTENANCE', description: 'Code review, performance and application maintenance. Git, Docker and Nginx support the delivery workflow.', technologies: ['Git', 'Docker', 'Nginx', 'Code review'] },
];
