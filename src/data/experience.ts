export interface Experience {
  role: string; company: string; period: string; location: string; description: string; brief: string; technologies: string[];
}
interface Role extends Experience { base: { x: number; z: number } }
// Employment record supplied directly from the author's LinkedIn profile.
// Chronological: the desert drive visits them oldest → newest.
const roles: Role[] = [
  {
    role: 'Desarrollador full stack — Sistema de Préstamos',
    company: 'Prestaya',
    period: 'Mar 2022 — Jan 2023',
    location: 'Costa Rica · Remote',
    description: 'Designed and developed a loan-management web application with Blazor WebAssembly and .NET: user registration, loans, payments, full CRUD workflows and interest calculation.',
    brief: 'Loan-management web app in Blazor WebAssembly and .NET — users, loans, payments, CRUD and interest calculation.',
    technologies: ['Blazor WebAssembly', '.NET', 'C#', 'REST APIs'],
    base: { x: 6, z: 6 },
  },
  {
    role: 'Desarrollador Java',
    company: 'MAKAIA',
    period: 'Sep 2023 — Jul 2024',
    location: 'Medellín, Colombia · Remote',
    description: 'Led development of an automated system for end-to-end supplier and device management — coordinating the team and making key technical decisions to ship a scalable backend solution.',
    brief: 'Automated supplier and device management in Java and Spring Boot — team coordination and backend technical decisions.',
    technologies: ['Java', 'Spring Boot', 'REST APIs', 'Backend development'],
    base: { x: -10, z: -4 },
  },
  {
    role: 'Ingeniero de software',
    company: 'DIGITALWARE',
    period: 'Jan 2024 — Jul 2024',
    location: 'Bogotá, Colombia',
    description: 'Led the design, development and deployment of business solutions, including REST APIs and micro-applications built with .NET and Angular, working with Entity Framework for database management under agile methodologies.',
    brief: 'Business solutions with .NET and Angular — REST APIs, micro-applications and Entity Framework data management.',
    technologies: ['.NET', 'Angular', 'REST APIs', 'Entity Framework', 'Java', 'Agile'],
    base: { x: 16, z: -10 },
  },
  {
    role: 'Software Engineer',
    company: 'Remote Dev-Team',
    period: 'Aug 2024 — Present',
    location: 'New York, US · Remote',
    description: 'Development and maintenance of internal enterprise applications for Beach Camera / Beach Trading Company. I build web applications and reusable components with C#, .NET, ASP.NET Core and Blazor WebAssembly, integrate REST APIs with Swagger/OpenAPI and SQL Server, and contribute to systems for orders, inventory, purchasing, shipping, users, permissions and security.',
    brief: 'Internal enterprise apps for Beach Camera / Beach Trading — orders, inventory, purchasing, shipping, users and security.',
    technologies: ['C#', '.NET', 'ASP.NET Core', 'Blazor WebAssembly', 'REST APIs', 'SQL Server', 'Azure DevOps', 'Git', 'CI/CD'],
    base: { x: -8, z: 16 },
  },
  {
    role: 'Semi-senior Software Engineer',
    company: 'Remote Dev-Team',
    period: 'Apr 2026 — Present',
    location: 'New York, US · Remote',
    description: 'Promoted to take greater technical ownership across internal enterprise applications. I lead frontend development, code quality, reusable components and UI standards; review API endpoints, Swagger/OpenAPI contracts and backend integrations; troubleshoot complex issues across applications, SQL Server and Linux/Nginx environments; and support deployments, CI/CD workflows and shared UI/service libraries.',
    brief: 'Technical ownership across internal systems — frontend leadership, API contracts, SQL Server, Linux/Nginx, CI/CD.',
    technologies: ['.NET APIs', 'SQL Server', 'Nginx', 'Linux', 'Azure DevOps', 'Git', 'CI/CD'],
    base: { x: -2, z: -30 },
  },
];
const strip = ({ base: _base, ...job }: Role): Experience => job;
/** Newest first: the readable record. */
export const experience: Experience[] = roles.map(strip).reverse();
/** Oldest first: the five desert bases. */
export const practice = roles.map((job, index) => ({
  number: String(index + 1).padStart(2, '0'),
  name: job.role,
  discipline: `${job.company} · ${job.period}`,
  description: job.brief,
  technologies: job.technologies,
  base: job.base,
}));
