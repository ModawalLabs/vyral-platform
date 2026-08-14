"use client";

import { ChevronDown, Clock, Monitor, Share2, Sparkles } from "lucide-react";

import { GLASS_SURFACE } from "@/components/create/glass";
import {
  ASPECT_RATIOS,
  MAX_DURATION,
  MIN_DURATION,
  MODELS,
} from "@/components/home/composer-settings";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { SETTING_LABELS } from "@/lib/session/brief";
import {
  PLATFORMS,
  RESOLUTIONS,
  type Platform,
  type Resolution,
  type SessionSettings,
} from "@/types/session";
import { cn } from "@/lib/utils";

/**
 * One trigger treatment for every setting, so the row reads as a set rather than as
 * separately-designed controls.
 *
 * `aria-expanded` is what Base UI toggles on an open trigger, which is also the
 * accessible signal — styling off it means the two can never drift apart.
 *
 * Lives here rather than beside the settings data: this is the only bar of pills in
 * the app now that the composer is a field and a button.
 */
const PILL = cn(
  "group/pill inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-foreground/[0.03]",
  "px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors",
  "hover:border-border hover:bg-foreground/[0.07] hover:text-foreground",
  "focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
  "aria-expanded:border-brand/45 aria-expanded:bg-brand/10 aria-expanded:text-foreground",
  // Disabled is a real state here: the pills stay on screen showing the current
  // values until Edit unlocks them.
  "disabled:pointer-events-none disabled:opacity-55",
);

/** Panel chrome — a touch softer and deeper than the default popover. */
const PANEL = "rounded-xl p-1.5 shadow-xl";

function Chevron() {
  return (
    <ChevronDown
      aria-hidden
      className="size-3 opacity-60 transition-transform duration-200 group-aria-expanded/pill:rotate-180"
    />
  );
}

/** The frosted plate these pills sit on. See `GLASS_SURFACE` for why it is utilities. */
const GLASS = GLASS_SURFACE;

/**
 * The session's five settings as one row of glass pills.
 *
 * The same trigger treatment and menu behaviour as the home composer's bar — the
 * chrome is imported rather than restated so the two rows cannot drift — with
 * Platform and Resolution added, neither of which the composer offers.
 *
 * `disabled` is the whole point of the row rather than an afterthought: the pills
 * stay on screen showing the current values and only become interactive once Edit
 * is pressed. A `<select>` swapped in and out of the DOM would have moved the
 * layout on every edit.
 */
export function SessionSettingsBar({
  settings,
  onChange,
  disabled,
  /** Sits beside the model pill, so the model's trade-offs stay one hover away. */
  modelInfo,
}: {
  settings: SessionSettings;
  onChange: (patch: Partial<SessionSettings>) => void;
  disabled?: boolean;
  modelInfo?: React.ReactNode;
}) {
  const aspect =
    ASPECT_RATIOS.find((option) => option.value === settings.aspectRatio) ??
    ASPECT_RATIOS[0];

  return (
    <div
      data-slot="session-settings"
      className="flex flex-wrap items-center gap-2 rounded-2xl p-1"
    >
      <Choice
        field="model"
        Icon={Sparkles}
        value={settings.model}
        options={MODELS.map((model) => ({ value: model, label: model }))}
        onSelect={(value) => onChange({ model: value as SessionSettings["model"] })}
        disabled={disabled}
      />
      {modelInfo}

      <Choice
        field="platform"
        Icon={Share2}
        value={settings.platform}
        options={PLATFORMS.map((platform) => ({ value: platform, label: platform }))}
        onSelect={(value) => onChange({ platform: value as Platform })}
        disabled={disabled}
      />

      <Choice
        field="aspectRatio"
        Icon={aspect.Icon}
        value={aspect.value}
        options={ASPECT_RATIOS.map((option) => ({
          value: option.value,
          label: `${option.value} · ${option.label}`,
        }))}
        onSelect={(value) =>
          onChange({ aspectRatio: value as SessionSettings["aspectRatio"] })
        }
        disabled={disabled}
      />

      {/* Duration is a range, so it gets a slider in a popover rather than a list. */}
      <Popover>
        <PopoverTrigger
          className={cn(PILL, GLASS)}
          disabled={disabled}
          aria-label={`${SETTING_LABELS.durationSeconds}: ${settings.durationSeconds} seconds`}
        >
          <Clock className="size-3.5" />
          <span data-slot="setting-durationSeconds">{settings.durationSeconds}s</span>
          <Chevron />
        </PopoverTrigger>
        <PopoverContent align="start" className="w-64 gap-3 rounded-xl p-4 shadow-xl">
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] font-medium text-muted-foreground">
              {SETTING_LABELS.durationSeconds}
            </span>
            <span className="text-lg leading-none font-semibold tabular-nums">
              {settings.durationSeconds}
              <span className="ml-0.5 text-sm text-muted-foreground">s</span>
            </span>
          </div>

          <Slider
            min={MIN_DURATION}
            max={MAX_DURATION}
            step={1}
            value={[settings.durationSeconds]}
            onValueChange={(value) =>
              onChange({
                durationSeconds: Array.isArray(value) ? value[0] : value,
              })
            }
            aria-label="Duration in seconds"
            className={cn(
              "[&_[data-slot=slider-range]]:bg-gradient-to-r [&_[data-slot=slider-range]]:from-brand [&_[data-slot=slider-range]]:to-brand-accent",
              "[&_[data-slot=slider-thumb]]:size-3.5 [&_[data-slot=slider-thumb]]:border-brand [&_[data-slot=slider-thumb]]:ring-brand/40",
            )}
          />

          <div className="flex justify-between text-[11px] text-muted-foreground tabular-nums">
            <span>{MIN_DURATION}s</span>
            <span>{MAX_DURATION}s</span>
          </div>
        </PopoverContent>
      </Popover>

      <Choice
        field="resolution"
        Icon={Monitor}
        value={settings.resolution}
        options={RESOLUTIONS.map((resolution) => ({
          value: resolution,
          label: resolution,
        }))}
        onSelect={(value) => onChange({ resolution: value as Resolution })}
        disabled={disabled}
      />
    </div>
  );
}

/** A pill backed by a single-choice radio menu. */
function Choice({
  field,
  Icon,
  value,
  options,
  onSelect,
  disabled,
}: {
  field: keyof SessionSettings;
  Icon: typeof Sparkles;
  value: string;
  options: { value: string; label: string }[];
  onSelect: (value: string) => void;
  disabled?: boolean;
}) {
  const label = SETTING_LABELS[field];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(PILL, GLASS)}
        disabled={disabled}
        aria-label={`${label}: ${value}`}
      >
        <Icon className="size-3.5" />
        {/* Stable hook for reading the applied value without opening the menu. */}
        <span data-slot={`setting-${field}`}>{value}</span>
        <Chevron />
      </DropdownMenuTrigger>
      {/* Default content is anchor-width; these labels are wider than a pill. */}
      <DropdownMenuContent align="start" className={cn(PANEL, "w-auto min-w-44")}>
        <DropdownMenuRadioGroup value={value} onValueChange={onSelect}>
          {/* Must sit inside the radio group: Base UI's GroupLabel reads a context
              only Menu.Group / Menu.RadioGroup provides, and throws when rendered
              as their sibling. */}
          <DropdownMenuLabel className="px-2 text-[11px] font-medium text-muted-foreground">
            {label}
          </DropdownMenuLabel>
          {options.map((option) => (
            <DropdownMenuRadioItem
              key={option.value}
              value={option.value}
              // Base UI leaves radio menus open on click by default, which suits
              // multi-toggle menus. This is a single choice: without this the menu
              // lingers and its backdrop swallows clicks on neighbouring pills.
              closeOnClick
              className="px-2 py-1.5"
            >
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
