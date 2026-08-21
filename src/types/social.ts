/**
 * The social destinations the product knows about.
 *
 * Its own module because two unrelated features share this vocabulary: Settings links
 * accounts to them, and an export publishes to them. Left in either one, the other
 * would be importing across a feature boundary to find out what a provider is.
 */
export const SOCIAL_PROVIDERS = ["youtube", "instagram", "tiktok"] as const;
export type SocialProvider = (typeof SOCIAL_PROVIDERS)[number];
