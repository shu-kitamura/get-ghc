import type { Commit, RepositoryCommits } from "./types.js";

export function groupCommitsByRepository(
  commits: Commit[]
): RepositoryCommits[] {
  const map = new Map<string, RepositoryCommits>();

  for (const commit of commits) {
    let entry = map.get(commit.repository);
    if (!entry) {
      entry = { repository: commit.repository, commits: [] };
      map.set(commit.repository, entry);
    }

    entry.commits.push({
      date: commit.date,
      message: commit.message,
    });
  }

  return Array.from(map.values());
}
