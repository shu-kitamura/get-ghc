type SearchCommitsResponse = {
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

type Commit = {
  date: string; // 例: 2026-01-30T00:01:17.000+09:00
  repository: string; // owner/repo
  sha: string; // sha
  message: string; // 1行目だけ（必要なら全文に変更OK）
  url: string; // commit URL
};

function isoDateOnlyUTC(d: Date): string {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// UTCのISO文字列をJST(+09:00)表記に整形して返す
// 入力例: 2026-01-29T15:01:17Z -> 出力例: 2026-01-30T00:01:17.000+09:00
function toJstIso(utcIso: string): string {
  const d = new Date(utcIso);
  if (Number.isNaN(d.getTime())) return utcIso;

  const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000);

  const yyyy = jst.getUTCFullYear();
  const mm = String(jst.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(jst.getUTCDate()).padStart(2, "0");
  const hh = String(jst.getUTCHours()).padStart(2, "0");
  const mi = String(jst.getUTCMinutes()).padStart(2, "0");
  const ss = String(jst.getUTCSeconds()).padStart(2, "0");
  const ms = String(jst.getUTCMilliseconds()).padStart(3, "0");

  return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}.${ms}+09:00`;
}

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

async function getMyLogin(token: string): Promise<string> {
  const me = await gh<{ login: string }>("https://api.github.com/user", token);
  return me.login;
}

function firstLine(msg: string): string {
  return (msg ?? "").split("\n")[0] ?? "";
}

async function main() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN is required");

  const login = await getMyLogin(token);

  // 直近30日（必要なら 1ヶ月 = 30日固定じゃなく“先月分”に変更可能）
  const until = new Date();
  const since = new Date(until.getTime() - 30 * 24 * 60 * 60 * 1000);

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
        message: firstLine(item.commit.message),
        url: item.html_url,
      });
    }

    if (data.items.length < perPage) break;
    page += 1;
  }

  // JSON（配列）で出力
  console.log(JSON.stringify(out, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
