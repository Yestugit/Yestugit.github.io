export const POST_SECTIONS = ["learning", "life"] as const;

export type PostSection = (typeof POST_SECTIONS)[number];
