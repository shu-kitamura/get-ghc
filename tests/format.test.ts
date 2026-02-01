import { groupCommitsByRepository } from "../src/lib/format";
import type { Commit } from "../src/lib/types";

describe("groupCommitsByRepository", () => {
  it("returns empty array when no commits", () => {
    expect(groupCommitsByRepository([])).toEqual([]);
  });

  it("groups commits by repository and preserves order", () => {
    const commits: Commit[] = [
      {
        date: "2026-01-02T10:00:00.000+09:00",
        repository: "owner/repo1",
        sha: "sha1",
        message: "first",
        url: "https://github.com/owner/repo1/commit/sha1",
      },
      {
        date: "2026-01-03T10:00:00.000+09:00",
        repository: "owner/repo2",
        sha: "sha2",
        message: "second",
        url: "https://github.com/owner/repo2/commit/sha2",
      },
      {
        date: "2026-01-04T10:00:00.000+09:00",
        repository: "owner/repo1",
        sha: "sha3",
        message: "third",
        url: "https://github.com/owner/repo1/commit/sha3",
      },
    ];

    expect(groupCommitsByRepository(commits)).toEqual([
      {
        repository: "owner/repo1",
        commits: [
          { date: "2026-01-02T10:00:00.000+09:00", message: "first" },
          { date: "2026-01-04T10:00:00.000+09:00", message: "third" },
        ],
      },
      {
        repository: "owner/repo2",
        commits: [{ date: "2026-01-03T10:00:00.000+09:00", message: "second" }],
      },
    ]);
  });
});
