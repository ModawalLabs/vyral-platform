import {
  Briefcase,
  Flame,
  Gem,
  Globe,
  Heart,
  MapPin,
  Monitor,
  MoreHorizontal,
  Music2,
  Play,
  RectangleHorizontal,
  RectangleVertical,
  Smile,
  Users,
  Waves,
  Zap,
  type LucideIcon,
} from "lucide-react";

export type OnboardingOption = {
  /** Stable key. The label is display copy and may be reworded. */
  id: string;
  label: string;
  Icon: LucideIcon;
  /** Opens a free-text field when chosen. Exactly one option per step has this. */
  freeText?: boolean;
};

export type OnboardingStep = {
  id: string;
  /** Two or three words for the step indicator, where the heading will not fit. */
  short: string;
  heading: string;
  subtext: string;
  options: readonly OnboardingOption[];
};

/**
 * The three first-run questions.
 *
 * Each one is a single choice, and each one is a decision the product could actually
 * act on — personality sets tone, audience sets pacing, and platform is the one that
 * already exists in the app as a setting driving frame and runtime. That is the reason
 * these three and not, say, industry and cadence: an onboarding question that feeds
 * nothing is a form the user fills in for our benefit.
 *
 * Every step ends in "Other" with a free-text field, because six pills cannot cover a
 * brand's own words and a dead end on the last option is worse than no option.
 *
 * TODO: persist the answers and seed the session's settings from step 3.
 */
export const ONBOARDING_STEPS: readonly OnboardingStep[] = [
  {
    id: "personality",
    short: "Personality",
    heading: "Brand personality",
    subtext: "This helps us set the right tone for your videos.",
    options: [
      { id: "bold", label: "Bold and hype", Icon: Zap },
      { id: "heartfelt", label: "Heartfelt and inspiring", Icon: Heart },
      { id: "witty", label: "Witty / Gen Z", Icon: Smile },
      { id: "premium", label: "Premium / luxury", Icon: Gem },
      { id: "calm", label: "Calm and confident", Icon: Waves },
      { id: "other", label: "Other", Icon: MoreHorizontal, freeText: true },
    ],
  },
  {
    id: "audience",
    short: "Audience",
    heading: "Who is this for?",
    subtext: "Tells us how fast to cut and how hard to sell.",
    options: [
      { id: "gen-z", label: "Gen Z", Icon: Flame },
      { id: "millennials", label: "Millennials", Icon: Users },
      { id: "b2b", label: "Professionals / B2B", Icon: Briefcase },
      { id: "local", label: "Local community", Icon: MapPin },
      { id: "global", label: "Global audience", Icon: Globe },
      { id: "other", label: "Other", Icon: MoreHorizontal, freeText: true },
    ],
  },
  {
    id: "platform",
    short: "Platform",
    heading: "Where will these live?",
    subtext: "Sets your default frame and runtime.",
    options: [
      { id: "reels", label: "Instagram Reels", Icon: RectangleVertical },
      { id: "tiktok", label: "TikTok", Icon: Music2 },
      { id: "shorts", label: "YouTube Shorts", Icon: Play },
      { id: "youtube", label: "YouTube long-form", Icon: RectangleHorizontal },
      { id: "website", label: "Website hero", Icon: Monitor },
      { id: "other", label: "Somewhere else", Icon: MoreHorizontal, freeText: true },
    ],
  },
];
