const DICEBEAR_BASE = "https://api.dicebear.com/7.x/lorelei/png";

export function dicebearAvatar(seed: string): string {
  return `${DICEBEAR_BASE}?seed=${encodeURIComponent(seed)}&size=160`;
}

export function avatarUrlFor(username: string, avatarUrl: string | null | undefined): string {
  if (avatarUrl && avatarUrl.trim() !== "") {
    return avatarUrl;
  }
  return dicebearAvatar(username || "verdict");
}

export const SEED_LIBRARY = [
  "amber", "ariel", "aster", "atlas", "basil", "birch", "breeze", "cedar",
  "cinder", "comet", "dahlia", "dawn", "dusk", "echo", "ember", "evergreen",
  "fable", "fern", "frost", "gale", "ginkgo", "harbor", "heather", "indigo",
  "iris", "jasper", "juno", "kira", "linden", "luna", "marlowe", "mavis",
  "nebula", "nori", "olive", "oslo", "pixel", "poppy", "quincy", "quill",
  "raven", "river", "sable", "solstice", "thistle", "twilight", "umbra", "vega",
  "willow", "xenia", "yarrow", "zephyr", "blaze", "cosmo", "drift", "flint",
  "haven", "kairo", "maverick", "nova", "orion", "phoenix", "sage", "titan",
  "winter", "apollo", "aurora", "blossom", "clover", "cypress", "eden", "hazel",
  "ivy", "jade", "jupiter", "lotus", "meadow", "mystic", "ocean", "onyx",
  "opal", "reign", "rowan", "saffron", "shadow", "sky", "storm", "summit",
  "sylvan", "vortex", "zenith"
];

export function randomSeeds(count: number = 24): string[] {
  const shuffled = [...SEED_LIBRARY].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export const AVATAR_PRESET_SEEDS = SEED_LIBRARY.slice(0, 24);
