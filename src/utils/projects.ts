import { getCollection, render } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import { cleanSlug } from './permalinks';
import { fetchPosts } from './blog';
import type { Post } from '~/types';

export interface Project {
  id: string;
  slug: string;
  title: string;
  description?: string;
  image?: string;
  technologies?: string[];
  relatedPosts?: string[];
  resolvedPosts?: Post[];
  status?: 'active' | 'complete' | 'archived';
  publishDate?: Date;
  Content?: unknown;
}

const getNormalizedProject = async (entry: CollectionEntry<'project'>): Promise<Project> => {
  const { id, data } = entry;
  const { Content } = await render(entry);

  return {
    id,
    slug: cleanSlug(id),
    title: data.title,
    description: data.description,
    image: data.image,
    technologies: data.technologies ?? [],
    relatedPosts: data.relatedPosts ?? [],
    status: data.status,
    publishDate: data.publishDate,
    Content,
  };
};

let _projects: Project[];

const fetchProjects = async (): Promise<Project[]> => {
  if (_projects) return _projects;

  const entries = await getCollection('project', ({ data }) => !data.draft);
  const normalized = await Promise.all(entries.map(getNormalizedProject));

  _projects = normalized.sort((a, b) => {
    const da = a.publishDate?.valueOf() ?? 0;
    const db = b.publishDate?.valueOf() ?? 0;
    return db - da;
  });

  return _projects;
};

export const getProjects = async (): Promise<Project[]> => {
  const projects = await fetchProjects();
  const allPosts = await fetchPosts();

  return projects.map((project) => ({
    ...project,
    resolvedPosts: (project.relatedPosts ?? [])
      .map((slug) => allPosts.find((p) => p.slug === slug))
      .filter((p): p is Post => !!p),
  }));
};

export const getProjectBySlug = async (slug: string): Promise<Project | undefined> => {
  const projects = await getProjects();
  return projects.find((p) => p.slug === slug);
};
