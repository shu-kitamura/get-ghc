export type SearchCommitsResponse = {
  total_count: number;
  incomplete_results: boolean;
  items: Array<{
    sha: string;
    html_url: string;
    repository: { full_name: string; private: boolean };
    commit: {
      message: string;
      author?: { name: string; email: string; date: string };
      committer?: { name: string; email: string; date: string };
    };
  }>;
};

export type Commit = {
  date: string; // 例: 2026-01-30T00:01:17.000+09:00
  repository: string; // owner/repo
  sha: string; // sha
  message: string; // 1行目だけ（必要なら全文に変更OK）
  url: string; // commit URL
};

export type CommitItem = {
  date: string;
  message: string;
};

export type RepositoryCommits = {
  repository: string; // owner/repo
  commits: CommitItem[];
};
