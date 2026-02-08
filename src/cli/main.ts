import {
  getMyLogin,
  fetchCommits,
  parseIsoDateOnlyUTC,
  groupCommitsByRepository,
} from "../lib/index.js";

type CliOptions = {
  start?: string;
  end?: string;
};

function parseArgs(argv: string[]): CliOptions {
  const out: CliOptions = {};

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === "-s" || arg === "--start") {
      const value = argv[i + 1];
      if (!value || value.startsWith("-")) {
        throw new Error("Missing value for --start (expected YYYY-MM-DD)");
      }
      out.start = value;
      i += 1;
      continue;
    }

    if (arg === "-e" || arg === "--end") {
      const value = argv[i + 1];
      if (!value || value.startsWith("-")) {
        throw new Error("Missing value for --end (expected YYYY-MM-DD)");
      }
      out.end = value;
      i += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return out;
}

async function main() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN is required");

  const login = await getMyLogin(token);

  const { start, end } = parseArgs(process.argv.slice(2));

  let since: Date;
  let until: Date;

  if (start || end) {
    if (!start || !end) {
      throw new Error(
        "Both --start and --end are required when specifying a range"
      );
    }

    const startDate = parseIsoDateOnlyUTC(start);
    if (!startDate) {
      throw new Error(`Invalid --start date: ${start} (expected YYYY-MM-DD)`);
    }

    const endDate = parseIsoDateOnlyUTC(end);
    if (!endDate) {
      throw new Error(`Invalid --end date: ${end} (expected YYYY-MM-DD)`);
    }

    if (startDate.getTime() > endDate.getTime()) {
      throw new Error("--start must be less than or equal to --end");
    }

    since = startDate;
    until = endDate;
  } else {
    // 直近30日（必要なら 1ヶ月 = 30日固定じゃなく"先月分"に変更可能）
    until = new Date();
    since = new Date(until.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  const commits = await fetchCommits(token, login, since, until);
  const grouped = groupCommitsByRepository(commits);

  // JSON（total + repos配列）で出力
  console.log(JSON.stringify(grouped, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
