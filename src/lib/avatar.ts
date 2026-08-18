const DICEBEAR_BASE = "https://api.dicebear.com/7.x/lorelei/svg";

export function dicebearAvatar(seed: string): string {
  return `${DICEBEAR_BASE}?seed=${encodeURIComponent(seed)}`;
}

export function avatarUrlFor(username: string, avatarUrl: string | null | undefined): string {
  return avatarUrl || dicebearAvatar(username);
}

export function randomSeeds(count: number): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  while (out.length < count) {
    const s = `vf-${Math.random().toString(36).slice(2, 10)}`;
    if (!seen.has(s)) {
      seen.add(s);
      out.push(s);
    }
  }
  return out;
}

export const AVATAR_PRESET_SEEDS = [
  "amber",
  "ariel",
  "aster",
  "atlas",
  "basil",
  "birch",
  "breeze",
  "cedar",
  "cinder",
  "comet",
  "dahlia",
  "dawn",
  "dusk",
  "echo",
  "ember",
  "evergreen",
  "fable",
  "fern",
  "frost",
  "gale",
  "ginkgo",
  "harbor",
  "heather",
  "indigo",
  "iris",
  "jasper",
  "juno",
  "kira",
  "linden",
  "luna",
  "marlowe",
  "mavis",
  "nebula",
  "nori",
  "olive",
  "oslo",
  "pixel",
  "poppy",
  "quincy",
  "quill",
  "raven",
  "river",
  "sable",
  "solstice",
  "thistle",
  "twilight",
  "umbra",
  "vega",
  "willow",
  "xenia",
  "yarrow",
  "zephyr",
];
