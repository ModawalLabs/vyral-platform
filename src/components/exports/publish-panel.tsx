"use client";

import { ArrowRight, Check, LoaderCircle, Send, Share2, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { aiCopyFor } from "@/components/exports/ai-copy";
import {
  PUBLISH_FORMS,
  extraFieldsOf,
  sharedFieldOf,
  type PublishField,
} from "@/components/exports/publish-forms";
import { initialsFor } from "@/components/social/initials";
import { PROVIDER_META } from "@/components/social/provider-marks";
import { BrandButton } from "@/components/ui/brand-button";
import { Panel, PanelBevel, PanelLabel } from "@/components/ui/panel";
import { routes } from "@/config/routes";
import type { LinkedAccount, ProviderConnection } from "@/types/account";
import type { VideoExport } from "@/types/export";
import { SOCIAL_PROVIDERS, type SocialProvider } from "@/types/social";
import { cn } from "@/lib/utils";

/** One field treatment, so a text input and a select are the same object. */
const FIELD = cn(
  "h-9 w-full rounded-lg bg-foreground/[0.03] px-3 text-sm text-foreground",
  "ring-1 ring-foreground/10 transition-colors ring-inset",
  "placeholder:text-muted-foreground/70",
  "focus-visible:ring-2 focus-visible:ring-brand/45 focus-visible:outline-none",
);

const LABEL =
  "block text-[11px] font-medium tracking-[0.06em] text-muted-foreground uppercase";

/** How long the fake generation takes. Long enough to read as work, short enough to wait. */
const WRITING_MS = 750;

/** A destination is one platform, or every platform at once. */
type Destination = SocialProvider | "all";

/** Selected account ids, per platform. */
type Selection = Record<SocialProvider, ReadonlySet<string>>;

/**
 * Start with each platform's default account ticked.
 *
 * The default is `accounts[0]` — position is priority, see `ProviderConnection`. Ticking
 * it rather than starting empty means the common case is one click, and the picker still
 * shows what will happen if you never touch it.
 */
function initialSelection(connections: ProviderConnection[]): Selection {
  const defaultOf = (provider: SocialProvider) => {
    const accounts = connections.find((c) => c.provider === provider)?.accounts ?? [];
    return new Set(accounts[0] ? [accounts[0].id] : []);
  };

  // Written out rather than built with `Object.fromEntries`, which widens the keys to
  // `string` and needs an assertion to become a `Record<SocialProvider, …>` again — an
  // assertion that would go on lying if a provider were ever missed. Spelled out, adding
  // a fourth platform is a compile error here, which is exactly where it should surface.
  return {
    youtube: defaultOf("youtube"),
    instagram: defaultOf("instagram"),
    tiktok: defaultOf("tiktok"),
  };
}

/**
 * Choose a destination, pick the accounts, fill the form, publish.
 *
 * Still one *destination* at a time — "All platforms" is a fourth card in the same radio
 * group rather than the three becoming multi-select, which keeps exactly one Publish
 * button whose scope is always what the row says. Accounts *within* a platform are
 * multi-select, because posting the same cut to a main channel and a clips channel is
 * the reason to have two accounts at all.
 *
 * The selection is keyed by platform, not by destination, so ticking a YouTube account in
 * the single view and then switching to All keeps that tick. The platform is what the
 * choice belongs to; the destination is only how you got there.
 *
 * Nothing is submitted. The fields are real and typeable so the flow can be walked, but
 * there is no OAuth and no upload behind them, and Publish says so rather than
 * pretending.
 *
 * TODO: submit through a server action once a provider is chosen.
 */
export function PublishPanel({
  item,
  connections,
}: {
  item: VideoExport;
  /**
   * The accounts linked to each platform, read on the server.
   *
   * A snapshot: Settings keeps its own add/remove in client state, so an account added
   * there is not here until that data is real. Both surfaces read
   * `listProviderConnections`, so they cannot disagree about what is actually stored.
   */
  connections: ProviderConnection[];
}) {
  const [destination, setDestination] = useState<Destination | null>(null);
  const [selection, setSelection] = useState<Selection>(() =>
    initialSelection(connections),
  );

  /**
   * Caption text, keyed by destination.
   *
   * Kept up here rather than inside the form so switching destination and coming back
   * does not throw away what was written — and so "All platforms" keeps its own draft
   * separate from the three single-platform ones.
   */
  const [copy, setCopy] = useState<Partial<Record<Destination, string>>>({});
  /** Which draft each destination is on, so a second press rewrites rather than repeats. */
  const [draft, setDraft] = useState<Partial<Record<Destination, number>>>({});
  const [writing, setWriting] = useState<Destination | null>(null);

  // Cleared on unmount so a pending write cannot land in a dead component.
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const accountsOf = (provider: SocialProvider) =>
    connections.find((c) => c.provider === provider)?.accounts ?? [];

  const toggleAccount = (provider: SocialProvider, id: string) =>
    setSelection((current) => {
      const next = new Set(current[provider]);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { ...current, [provider]: next };
    });

  const writeWithAi = (target: Destination) => {
    if (writing) return;
    setWriting(target);
    const next = (draft[target] ?? -1) + 1;

    timer.current = window.setTimeout(() => {
      setCopy((current) => ({ ...current, [target]: aiCopyFor(target, item, next) }));
      setDraft((current) => ({ ...current, [target]: next }));
      setWriting(null);
    }, WRITING_MS);
  };

  const isAll = destination === "all";

  /**
   * The single platform, when exactly one is chosen.
   *
   * Derived rather than read off `destination` at each use site, because `isAll` is a
   * boolean and TypeScript cannot use it to narrow anything.
   */
  const provider: SocialProvider | null =
    destination !== null && destination !== "all" ? destination : null;

  /** Platforms in scope for the current destination that actually have an account. */
  const scope = (isAll ? SOCIAL_PROVIDERS : provider ? [provider] : []).filter(
    (key) => accountsOf(key).length > 0,
  );

  const selectedCount = scope.reduce((sum, key) => sum + selection[key].size, 0);

  /** The one selected account, when there is exactly one — so the button can name it. */
  const onlyAccount: LinkedAccount | undefined =
    selectedCount === 1
      ? scope.flatMap((key) => accountsOf(key).filter((a) => selection[key].has(a.id)))[0]
      : undefined;

  const nothingLinked = destination !== null && scope.length === 0;

  return (
    <Panel>
      <PanelBevel />

      <div className="@container flex flex-1 flex-col gap-5 p-6">
        <div>
          <PanelLabel>Publish</PanelLabel>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Send this cut straight to a connected account, or to all of them at once.
          </p>
        </div>

        {/*
          A radio group, not a set of toggles: exactly one destination can be chosen, and
          `radio` is what tells a screen reader that picking one clears the others.

          Measured against this panel rather than the viewport — four cards need real
          width, and a `sm:` step would fire while the panel is still too narrow.
        */}
        <div
          role="radiogroup"
          aria-label="Publish destination"
          data-slot="publish-destinations"
          className="grid gap-3 @min-[30rem]:grid-cols-2 @min-[52rem]:grid-cols-4"
        >
          {SOCIAL_PROVIDERS.map((key) => (
            <DestinationCard
              key={key}
              active={destination === key}
              onClick={() => setDestination(destination === key ? null : key)}
              name={PROVIDER_META[key].name}
              chip={PROVIDER_META[key].chip}
              glow={PROVIDER_META[key].glow}
              Mark={PROVIDER_META[key].Mark}
              // The count is the useful thing at a glance: it says both that the platform
              // is linked and how many places a publish could go.
              count={accountsOf(key).length}
            />
          ))}

          {/* The fourth card. Brand-tinted rather than borrowing one platform's colour,
              because it belongs to all three and none of them. */}
          <DestinationCard
            active={isAll}
            onClick={() => setDestination(isAll ? null : "all")}
            name="All platforms"
            chip="bg-brand/12 text-brand-text"
            glow="bg-brand/25"
            Mark={Share2}
            count={SOCIAL_PROVIDERS.reduce((n, key) => n + accountsOf(key).length, 0)}
          />
        </div>

        {destination === null ? (
          <p className="rounded-xl border border-dashed border-border/60 px-5 py-8 text-center text-sm text-muted-foreground">
            Pick a destination to see its options.
          </p>
        ) : nothingLinked ? (
          // The platform is still offered — it is just not linked yet. Replacing the form
          // rather than greying the card out keeps it visible as something you can have.
          <NoAccounts name={provider ? PROVIDER_META[provider].name : "any platform"} />
        ) : (
          // Keyed on the destination so switching remounts the fields. Without it React
          // reuses the uncontrolled inputs by position and a YouTube title would survive
          // into TikTok's form.
          <form
            key={destination}
            data-slot="publish-form"
            onSubmit={(event) => event.preventDefault()}
            className="flex flex-col gap-5 rounded-xl bg-foreground/[0.02] p-5 ring-1 ring-foreground/[0.06] ring-inset"
          >
            <p className="text-xs text-muted-foreground">
              {isAll
                ? `One caption, posted to ${scope.map((k) => PROVIDER_META[k].name).join(", ")}. Each platform keeps its own accounts and options below.`
                : provider && PUBLISH_FORMS[provider].blurb}
            </p>

            {/* Single platform: its accounts sit above the caption, so "where is this
                going" is answered before "what does it say". In the all view the same row
                repeats inside each platform's section instead. */}
            {provider ? (
              <AccountPicker
                provider={provider}
                accounts={accountsOf(provider)}
                selected={selection[provider]}
                onToggle={(id) => toggleAccount(provider, id)}
              />
            ) : null}

            {/* The shared caption. In the single-platform view it is that platform's own
                description or caption field; in the all-platforms view it is written once
                and sent to every one of them. Either way it is the field the AI writes. */}
            <CaptionField
              destination={destination}
              field={
                isAll
                  ? {
                      kind: "textarea",
                      name: "caption",
                      label: "Caption",
                      placeholder: "One caption for every platform…",
                      rows: 4,
                      shared: true,
                    }
                  : provider
                    ? sharedFieldOf(provider)
                    : undefined
              }
              value={copy[destination] ?? ""}
              onChange={(value) =>
                setCopy((current) => ({ ...current, [destination]: value }))
              }
              onWrite={() => writeWithAi(destination)}
              writing={writing === destination}
            />

            {isAll ? (
              // One section per platform, carrying its accounts and only the fields that
              // platform alone asks for. Nothing is lost against publishing one at a time.
              <div className="flex flex-col gap-6">
                {SOCIAL_PROVIDERS.map((key) => {
                  const accounts = accountsOf(key);
                  const Mark = PROVIDER_META[key].Mark;

                  return (
                    <section key={key} data-slot="publish-section">
                      <div className="flex items-center gap-2">
                        <span
                          aria-hidden
                          className={cn(
                            "grid size-6 shrink-0 place-items-center rounded-md",
                            PROVIDER_META[key].chip,
                          )}
                        >
                          <Mark className="size-3.5" />
                        </span>
                        <span className="text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
                          {PROVIDER_META[key].name}
                        </span>
                        <span aria-hidden className="h-px flex-1 bg-foreground/[0.08]" />
                      </div>

                      {accounts.length === 0 ? (
                        // No fields for a platform you cannot post to — options for a
                        // destination that does not exist are noise.
                        <p className="mt-3 text-xs text-muted-foreground">
                          No account connected.{" "}
                          <Link
                            href={routes.settings}
                            className="font-medium text-brand-text hover:underline"
                          >
                            Connect one in Settings
                          </Link>
                          .
                        </p>
                      ) : (
                        <>
                          <div className="mt-3">
                            <AccountPicker
                              provider={key}
                              accounts={accounts}
                              selected={selection[key]}
                              onToggle={(id) => toggleAccount(key, id)}
                            />
                          </div>

                          <div className="mt-4 grid gap-4 @min-[34rem]:grid-cols-2">
                            {extraFieldsOf(key).map((field) => (
                              <Field
                                key={field.name}
                                field={field}
                                idPrefix={key}
                                videoTitle={item.title}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </section>
                  );
                })}
              </div>
            ) : (
              <div className="grid gap-4 @min-[34rem]:grid-cols-2">
                {(provider ? extraFieldsOf(provider) : []).map((field) => (
                  <Field
                    key={field.name}
                    field={field}
                    idPrefix={destination}
                    videoTitle={item.title}
                  />
                ))}
              </div>
            )}

            {/* TODO: submits through a server action once an OAuth provider exists.
                Disabled with nothing ticked, because "publish to no accounts" is not a
                thing the button could do. */}
            <BrandButton
              type="submit"
              disabled={selectedCount === 0}
              title={
                selectedCount === 0
                  ? "Pick at least one account"
                  : "Publishing is not wired up yet"
              }
              className="self-end disabled:pointer-events-none disabled:opacity-45"
            >
              <Send aria-hidden className="size-4" />
              {selectedCount === 0
                ? "Publish"
                : onlyAccount
                  ? `Publish to ${onlyAccount.handle}`
                  : `Publish to ${selectedCount} accounts`}
            </BrandButton>
          </form>
        )}
      </div>
    </Panel>
  );
}

/**
 * Which accounts on this platform the publish goes to.
 *
 * Checkboxes, not radios: several accounts on one platform is exactly the case this
 * exists for. A real `<input type="checkbox">` sits behind each chip, so the keyboard
 * behaviour and the announced state are the browser's and the label does the drawing.
 */
function AccountPicker({
  provider,
  accounts,
  selected,
  onToggle,
}: {
  provider: SocialProvider;
  accounts: readonly LinkedAccount[];
  selected: ReadonlySet<string>;
  onToggle: (id: string) => void;
}) {
  const { chip, name } = PROVIDER_META[provider];

  return (
    <fieldset data-slot="account-picker" data-provider={provider} className="min-w-0">
      {/* A `legend` rather than a floating label: it is what associates the heading with
          the group for a screen reader, and this is a real set of choices. */}
      <legend className={LABEL}>Publish to</legend>

      <div className="mt-1.5 flex flex-wrap gap-2">
        {accounts.map((account, index) => {
          const isOn = selected.has(account.id);
          const id = `${provider}-acct-${account.id}`;

          return (
            <label
              key={account.id}
              htmlFor={id}
              data-slot="account-chip"
              data-selected={isOn ? "" : undefined}
              className={cn(
                "inline-flex cursor-pointer items-center gap-2 rounded-full py-1.5 pr-3 pl-1.5 transition-colors",
                "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand/50",
                isOn
                  ? "bg-brand/[0.12] ring-1 ring-brand/45 ring-inset"
                  : "bg-foreground/[0.03] ring-1 ring-foreground/10 ring-inset hover:bg-foreground/[0.06]",
              )}
            >
              <input
                id={id}
                type="checkbox"
                checked={isOn}
                onChange={() => onToggle(account.id)}
                aria-label={`Publish to ${account.handle} on ${name}`}
                className="peer sr-only"
              />

              {/* The avatar doubles as the tick: at chip size a separate checkbox and an
                  avatar are two round things fighting for the same corner. */}
              <span
                aria-hidden
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-full text-[9px] font-bold transition-colors",
                  isOn ? "bg-brand text-brand-foreground" : chip,
                )}
              >
                {isOn ? (
                  <Check className="size-3" strokeWidth={3} />
                ) : (
                  initialsFor(account.handle)
                )}
              </span>

              <span
                className={cn(
                  "text-xs font-medium",
                  isOn ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {account.handle}
              </span>

              {/* Position is priority, so the first account is the platform's default. */}
              {index === 0 ? (
                <span className="rounded-full bg-foreground/[0.08] px-1.5 text-[9px] font-bold tracking-wide text-muted-foreground uppercase">
                  Default
                </span>
              ) : null}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/** Shown when the chosen platform has nothing linked to publish to. */
function NoAccounts({ name }: { name: string }) {
  return (
    <div
      data-slot="no-accounts"
      className="rounded-xl border border-dashed border-border/60 px-5 py-8 text-center"
    >
      <p className="text-sm font-medium">No {name} account connected</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Link one and it will show up here as a publish target.
      </p>

      <Link
        href={routes.settings}
        className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-xl border border-brand/45 px-3.5 text-sm font-semibold text-brand-text transition-colors hover:border-brand hover:bg-brand/10 focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none"
      >
        Connect in Settings
        <ArrowRight aria-hidden className="size-3.5" />
      </Link>
    </div>
  );
}

function DestinationCard({
  active,
  onClick,
  name,
  chip,
  glow,
  Mark,
  count,
}: {
  active: boolean;
  onClick: () => void;
  name: string;
  chip: string;
  glow: string;
  Mark: (props: { className?: string }) => React.ReactNode;
  /** Linked accounts behind this destination. Zero is a real, shown state. */
  count: number;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={cn(
        "relative isolate flex items-center gap-3 overflow-hidden rounded-xl p-3 text-left transition-colors",
        "focus-visible:ring-2 focus-visible:ring-brand/45 focus-visible:outline-none",
        active
          ? "bg-brand/[0.06] ring-1 ring-brand/45 ring-inset"
          : "bg-foreground/[0.02] ring-1 ring-foreground/[0.08] ring-inset hover:bg-foreground/[0.05]",
      )}
    >
      {/* The destination's own colour, blurred out of the corner. Same device as the
          Settings tiles, so the two surfaces read as one product. */}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute -top-8 -right-8 -z-10 size-20 rounded-full blur-2xl",
          glow,
        )}
      />
      <span
        aria-hidden
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-lg ring-1 ring-foreground/[0.06] ring-inset",
          chip,
        )}
      >
        <Mark className="size-[18px]" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{name}</span>
        <span className="block truncate text-[11px] text-muted-foreground tabular-nums">
          {count === 0
            ? "No account"
            : `${count} ${count === 1 ? "account" : "accounts"}`}
        </span>
      </span>

      {/* A filled dot rather than a tick: this is a single choice, and a tick reads as
          "included" in a list you could add more to. */}
      <span
        aria-hidden
        className={cn(
          "size-2 shrink-0 rounded-full transition-colors",
          active ? "bg-brand" : "bg-foreground/15",
        )}
      />
    </button>
  );
}

/**
 * The caption, with the button that writes it.
 *
 * Controlled, unlike every other field here: the AI has to be able to put text into it,
 * which an uncontrolled textarea cannot express. The button sits on the label row rather
 * than under the field so it never pushes the layout around when its label changes
 * length mid-write.
 */
function CaptionField({
  destination,
  field,
  value,
  onChange,
  onWrite,
  writing,
}: {
  destination: Destination;
  field: PublishField | undefined;
  value: string;
  onChange: (value: string) => void;
  onWrite: () => void;
  writing: boolean;
}) {
  if (!field || field.kind !== "textarea") return null;
  const id = `${destination}-${field.name}`;

  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className={LABEL}>
          {field.label}
        </label>

        <button
          type="button"
          onClick={onWrite}
          disabled={writing}
          // Says what it will do, including that it overwrites — the field is the one
          // place on this panel where a click can destroy typing.
          title={
            value
              ? "Rewrite this caption with AI — replaces what is there"
              : "Write this caption with AI"
          }
          aria-live="polite"
          className={cn(
            "inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-semibold transition-colors",
            "text-brand-text ring-1 ring-brand/35 ring-inset",
            "hover:bg-brand/10 focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none",
            "disabled:pointer-events-none disabled:opacity-60",
          )}
        >
          {writing ? (
            <>
              <LoaderCircle aria-hidden className="size-3 animate-spin" />
              Writing…
            </>
          ) : (
            <>
              <Sparkles aria-hidden className="size-3" />
              {/* "Rewrite" once there is something to replace, so the second press is not
                  offering to do a thing it already did. */}
              {value ? "Rewrite" : "Write with AI"}
            </>
          )}
        </button>
      </div>

      <textarea
        id={id}
        name={field.name}
        rows={field.rows ?? 3}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={field.placeholder}
        className={cn(
          FIELD,
          "scrollbar-slim mt-1.5 h-auto resize-y py-2 leading-relaxed",
        )}
      />
    </div>
  );
}

function Field({
  field,
  idPrefix,
  videoTitle,
}: {
  field: PublishField;
  /** Namespaces the id so two platforms' `caption` fields never collide in the DOM. */
  idPrefix: string;
  videoTitle: string;
}) {
  const id = `${idPrefix}-${field.name}`;

  if (field.kind === "toggle") {
    return (
      // A real checkbox, visually restyled: `peer` plus `sr-only` keeps the native
      // control — and therefore its keyboard behaviour and announced state — while the
      // span next to it does the drawing.
      <label
        htmlFor={id}
        className="flex cursor-pointer items-center gap-2.5 self-end @min-[34rem]:col-span-2"
      >
        <input
          id={id}
          name={field.name}
          type="checkbox"
          defaultChecked={field.defaultOn}
          className="peer sr-only"
        />
        <span
          aria-hidden
          className={cn(
            "grid size-4 shrink-0 place-items-center rounded-[5px] ring-1 ring-foreground/20 transition-colors ring-inset",
            "peer-checked:bg-brand peer-checked:ring-brand",
            "peer-focus-visible:ring-2 peer-focus-visible:ring-brand/60",
          )}
        >
          <svg
            viewBox="0 0 12 12"
            className="size-2.5 text-brand-foreground opacity-0 peer-checked:opacity-100"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M2.5 6.5 5 9l4.5-5.5" />
          </svg>
        </span>
        <span className="text-sm">{field.label}</span>
      </label>
    );
  }

  return (
    <div
      className={cn(
        "min-w-0",
        // A textarea and a full-width text field both need the whole row; a select or a
        // short text field sits in half of it.
        (field.kind === "textarea" || (field.kind === "text" && field.wide)) &&
          "@min-[34rem]:col-span-2",
      )}
    >
      <label htmlFor={id} className={LABEL}>
        {field.label}
      </label>

      {field.kind === "textarea" ? (
        <textarea
          id={id}
          name={field.name}
          rows={field.rows ?? 3}
          placeholder={field.placeholder}
          className={cn(
            FIELD,
            "scrollbar-slim mt-1.5 h-auto resize-y py-2 leading-relaxed",
          )}
        />
      ) : field.kind === "select" ? (
        // A native select. The app's Base UI `Select` is unused everywhere else, and a
        // three-option choice gains nothing from a custom popup that has to reimplement
        // typeahead and keyboard handling.
        <select
          id={id}
          name={field.name}
          defaultValue={field.options[0]}
          className={cn(FIELD, "mt-1.5 appearance-none pr-8")}
        >
          {field.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          name={field.name}
          type="text"
          // YouTube's title starts from the video's own name, which is what someone would
          // type first anyway.
          defaultValue={field.fillWith === "title" ? videoTitle : undefined}
          placeholder={field.placeholder}
          className={cn(FIELD, "mt-1.5")}
        />
      )}
    </div>
  );
}
