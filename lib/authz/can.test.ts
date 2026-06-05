import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/openfga", () => ({
  isOpenFgaConfigured: vi.fn(),
  getOpenFgaClient: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  default: {
    child: vi.fn().mockReturnValue({
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    }),
  },
}));

import { getOpenFgaClient, isOpenFgaConfigured } from "@/lib/openfga";
import { can, deleteTuples, listObjectIds, writeTuples } from "./can";

function makeClient(overrides: Record<string, unknown> = {}) {
  return {
    check: vi.fn().mockResolvedValue({ allowed: false }),
    write: vi.fn().mockResolvedValue(undefined),
    listObjects: vi.fn().mockResolvedValue({ objects: [] }),
    ...overrides,
  };
}

describe("can", () => {
  it("returns false when OpenFGA is not configured", async () => {
    vi.mocked(isOpenFgaConfigured).mockReturnValue(false);
    expect(await can("user:alice", "can_view", "blog:1")).toBe(false);
  });

  it("returns true when FGA check allows", async () => {
    vi.mocked(isOpenFgaConfigured).mockReturnValue(true);
    vi.mocked(getOpenFgaClient).mockReturnValue(
      makeClient({ check: vi.fn().mockResolvedValue({ allowed: true }) }) as never,
    );
    expect(await can("user:alice", "can_view", "blog:1")).toBe(true);
  });

  it("returns false when FGA check denies", async () => {
    vi.mocked(isOpenFgaConfigured).mockReturnValue(true);
    vi.mocked(getOpenFgaClient).mockReturnValue(
      makeClient({ check: vi.fn().mockResolvedValue({ allowed: false }) }) as never,
    );
    expect(await can("user:alice", "can_edit", "blog:1")).toBe(false);
  });

  it("returns false and swallows error when FGA throws", async () => {
    vi.mocked(isOpenFgaConfigured).mockReturnValue(true);
    vi.mocked(getOpenFgaClient).mockReturnValue(
      makeClient({
        check: vi.fn().mockRejectedValue(new Error("network error")),
      }) as never,
    );
    expect(await can("user:alice", "can_view", "blog:1")).toBe(false);
  });
});

describe("writeTuples", () => {
  it("does nothing when the list is empty", async () => {
    vi.mocked(isOpenFgaConfigured).mockReturnValue(true);
    const client = makeClient();
    vi.mocked(getOpenFgaClient).mockReturnValue(client as never);
    await writeTuples([]);
    expect(client.write).not.toHaveBeenCalled();
  });

  it("does nothing when OpenFGA is not configured", async () => {
    vi.mocked(isOpenFgaConfigured).mockReturnValue(false);
    const client = makeClient();
    vi.mocked(getOpenFgaClient).mockReturnValue(client as never);
    await writeTuples([{ user: "user:a", relation: "owner", object: "blog:1" }]);
    expect(client.write).not.toHaveBeenCalled();
  });

  it("calls client.write with the provided tuples", async () => {
    vi.mocked(isOpenFgaConfigured).mockReturnValue(true);
    const client = makeClient();
    vi.mocked(getOpenFgaClient).mockReturnValue(client as never);
    const tuples = [{ user: "user:alice", relation: "owner", object: "blog:1" }];
    await writeTuples(tuples);
    expect(client.write).toHaveBeenCalledWith({ writes: tuples });
  });
});

describe("deleteTuples", () => {
  it("does nothing when the list is empty", async () => {
    vi.mocked(isOpenFgaConfigured).mockReturnValue(true);
    const client = makeClient();
    vi.mocked(getOpenFgaClient).mockReturnValue(client as never);
    await deleteTuples([]);
    expect(client.write).not.toHaveBeenCalled();
  });

  it("does nothing when OpenFGA is not configured", async () => {
    vi.mocked(isOpenFgaConfigured).mockReturnValue(false);
    const client = makeClient();
    vi.mocked(getOpenFgaClient).mockReturnValue(client as never);
    await deleteTuples([{ user: "user:a", relation: "viewer", object: "blog:1" }]);
    expect(client.write).not.toHaveBeenCalled();
  });

  it("calls client.write with deletes", async () => {
    vi.mocked(isOpenFgaConfigured).mockReturnValue(true);
    const client = makeClient();
    vi.mocked(getOpenFgaClient).mockReturnValue(client as never);
    const tuples = [{ user: "user:alice", relation: "viewer", object: "blog:1" }];
    await deleteTuples(tuples);
    expect(client.write).toHaveBeenCalledWith(
      { deletes: tuples },
      expect.any(Object),
    );
  });
});

describe("listObjectIds", () => {
  it("returns empty array when OpenFGA is not configured", async () => {
    vi.mocked(isOpenFgaConfigured).mockReturnValue(false);
    expect(await listObjectIds("user:alice", "can_view", "blog")).toEqual([]);
  });

  it("returns stripped object ids when FGA responds", async () => {
    vi.mocked(isOpenFgaConfigured).mockReturnValue(true);
    vi.mocked(getOpenFgaClient).mockReturnValue(
      makeClient({
        listObjects: vi
          .fn()
          .mockResolvedValue({ objects: ["blog:1", "blog:2"] }),
      }) as never,
    );
    const ids = await listObjectIds("user:alice", "can_view", "blog");
    expect(ids).toEqual(["1", "2"]);
  });

  it("returns empty array and swallows error when FGA throws", async () => {
    vi.mocked(isOpenFgaConfigured).mockReturnValue(true);
    vi.mocked(getOpenFgaClient).mockReturnValue(
      makeClient({
        listObjects: vi.fn().mockRejectedValue(new Error("timeout")),
      }) as never,
    );
    expect(await listObjectIds("user:alice", "can_view", "blog")).toEqual([]);
  });
});
