import type { Commit, SearchCommitsResponse } from "./types.js";
import { isoDateOnlyUTC, toJstIso } from "./date.js";

async function gh<T>(url: string, token: string): Promise<T> {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      // Search commits は環境によって preview media type が必要な場合があるため併記
      Accept: "application/vnd.github.cloak-preview+json, application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`GitHub API error ${res.status} ${res.statusText}\n${text}`);
  }
  return (await res.json()) as T;
}

export async function getMyLogin(token: string): Promise<string> {
  const me = await gh<{ login: string }>("https://api.github.com/user", token);
  return me.login;
}

export async function fetchCommits(
  token: string,
  login: string,
  since: Date,
  until: Date,
): Promise<Commit[]> {
  // Search query: 自分(author) + committer-date 範囲
  const q = `author:${login} committer-date:${isoDateOnlyUTC(since)}..${isoDateOnlyUTC(until)}`;

  const perPage = 100;
  let page = 1;

  const out: Commit[] = [];

  while (true) {
    const url =
      "https://api.github.com/search/commits" +
      `?q=${encodeURIComponent(q)}` +
      `&sort=committer-date&order=desc` +
      `&per_page=${perPage}&page=${page}`;

    const data = await gh<SearchCommitsResponse>(url, token);

    for (const item of data.items) {
      const utcDate = item.commit.committer?.date ?? item.commit.author?.date ?? "";

      out.push({
        date: utcDate ? toJstIso(utcDate) : "",
        repository: item.repository.full_name,
        sha: item.sha,
        message: item.commit.message,
        url: item.html_url,
      });
    }

    if (data.items.length < perPage) break;
    page += 1;
  }

  return out;
}
