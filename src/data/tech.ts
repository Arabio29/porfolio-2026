import csharp from '../icons/csharp.svg?raw';
import dotnet from '../icons/dotnet.svg?raw';
import typescript from '../icons/typescript.svg?raw';
import javascript from '../icons/javascript.svg?raw';
import python from '../icons/python.svg?raw';
import angular from '../icons/angular.svg?raw';
import blazor from '../icons/blazor.svg?raw';
import react from '../icons/react.svg?raw';
import springboot from '../icons/springboot.svg?raw';
import nodedotjs from '../icons/nodedotjs.svg?raw';
import microsoftsqlserver from '../icons/microsoftsqlserver.svg?raw';
import swagger from '../icons/swagger.svg?raw';
import postman from '../icons/postman.svg?raw';
import azuredevops from '../icons/azuredevops.svg?raw';
import docker from '../icons/docker.svg?raw';
import linux from '../icons/linux.svg?raw';
import nginx from '../icons/nginx.svg?raw';
import git from '../icons/git.svg?raw';
import github from '../icons/github.svg?raw';
import githubactions from '../icons/githubactions.svg?raw';
import visualstudiocode from '../icons/visualstudiocode.svg?raw';
import visualstudio from '../icons/visualstudio.svg?raw';
import openai from '../icons/openai.svg?raw';
import anthropic from '../icons/anthropic.svg?raw';
import ollama from '../icons/ollama.svg?raw';

// Brand glyphs: Simple Icons (CC0), stored locally in src/icons and inlined
// at build time so the wall works offline and inherits the cobalt system.
// Entries without a brand glyph use a mono fallback chip instead.
export interface TechItem { name: string; icon?: string; glyph?: string }
export interface TechGroup { id: string; label: string; note: string; items: TechItem[] }
export const techGroups: TechGroup[] = [
  {
    id: 'languages', label: 'LANGUAGES & FRAMEWORKS', note: 'WHAT I WRITE',
    items: [
      { name: 'C#', icon: csharp },
      { name: '.NET', icon: dotnet },
      { name: 'TypeScript', icon: typescript },
      { name: 'JavaScript', icon: javascript },
      { name: 'Python', icon: python },
      { name: 'Java', glyph: 'Jv' },
      { name: 'Angular', icon: angular },
      { name: 'Blazor', icon: blazor },
      { name: 'React', icon: react },
    ],
  },
  {
    id: 'backend', label: 'BACKEND & DATA', note: 'WHAT HOLDS',
    items: [
      { name: 'ASP.NET Core', glyph: 'ASP' },
      { name: 'SQL Server', icon: microsoftsqlserver },
      { name: 'REST APIs', glyph: 'RST' },
      { name: 'Entity Framework', glyph: 'EF' },
      { name: 'Swagger / OpenAPI', icon: swagger },
      { name: 'Spring Boot', icon: springboot },
      { name: 'Node.js', icon: nodedotjs },
    ],
  },
  {
    id: 'devops', label: 'CLOUD & DEVOPS', note: 'WHAT SHIPS',
    items: [
      { name: 'Azure DevOps', icon: azuredevops },
      { name: 'Docker', icon: docker },
      { name: 'Linux', icon: linux },
      { name: 'Nginx', icon: nginx },
      { name: 'Git', icon: git },
      { name: 'GitHub', icon: github },
      { name: 'CI/CD', icon: githubactions },
    ],
  },
  {
    id: 'drivers', label: 'DAILY DRIVERS', note: 'WHAT OPENS',
    items: [
      { name: 'VS Code', icon: visualstudiocode },
      { name: 'Visual Studio', icon: visualstudio },
      { name: 'Postman', icon: postman },
    ],
  },
  {
    id: 'ai', label: 'AI-ASSISTED BUILDING', note: 'WHAT ACCELERATES',
    items: [
      { name: 'ChatGPT', icon: openai },
      { name: 'Claude', icon: anthropic },
      { name: 'Local LLMs', icon: ollama },
    ],
  },
];
