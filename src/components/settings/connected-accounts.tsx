"use client";

import { Check, Plus, Star, X } from "lucide-react";
import { useState } from "react";

import { initialsFor } from "@/components/social/initials";
import { PROVIDER_META } from "@/components/social/provider-marks";
import { Panel, PanelBevel } from "@/components/ui/panel";
import { cn, formatDate } from "@/lib/utils";
import type { LinkedAccount, ProviderConnection } from "@/types/account";
import type { SocialProvider } from "@/types/social";

/**
 * Plausible handles to hand out when Add account is clicked.
 *
 * A pool per provider rather than one generated string, so clicking twice gives two
 * accounts that look like they belong to the same person rather than `@account-2`. Once
 * the pool is spent it falls back to a numbered handle — running out is not a reason to
 * stop working.
 *
 * TODO: gone the moment the provider's OAuth flow returns a real account.
 */
const HANDLE_POOL: Record<SocialProvider, readonly string[]> = {
  youtube: ["@shivansh", "@vyral.studio", "@vyral.clips", "@behindthecut"],
  instagram: ["@vyral", "@vyral.reels", "@studio.vyral", "@vyral.bts"],
  tiktok: ["@vyral", "@vyral.cuts", "@vyralshorts", "@vyral.daily"],
};

let accountCounter = 0;
/** Monotonic rather than random, so ids stay stable under React's strict double-invoke. */
const nextAccountId = () => `acc_${(accountCounter += 1)}`;

/**
 * Where finished videos can be published.
 *
 * One tile per provider whether it is linked or not — an unlinked provider is an offer,
 * not an absence, so hiding it would leave the section looking complete when there is
 * nothing connected at all.
 *
 * A platform holds *any number* of accounts. That is the whole reason this is a client
 * component: adding and removing has to be walkable to judge how the tile behaves at two
 * and three accounts, so the list lives in state here. Nothing is persisted and a reload
 * puts the seeded set back.
 *
 * TODO: each button starts an OAuth flow once a provider is chosen. `src/data/account.ts`
 * is `server-only` so the tokens that flow back never reach a client component.
 */
export function ConnectedAccounts({
  connections,
}: {
  connections: ProviderConnection[];
}) {
  const [state, setState] = useState(connections);

  const linkedPlatforms = state.filter((c) => c.accounts.length > 0).length;
  const totalAccounts = state.reduce((sum, c) => sum + c.accounts.length, 0);

  /** Replace one provider's account list, leaving the others by reference. */
  const update = (
    provider: SocialProvider,
    next: (accounts: LinkedAccount[]) => LinkedAccount[],
  ) =>
    setState((current) =>
      current.map((connection) =>
        connection.provider === provider
          ? { ...connection, accounts: next(connection.accounts) }
          : connection,
      ),
    );

  const add = (provider: SocialProvider) =>
    update(provider, (accounts) => {
      const taken = new Set(accounts.map((a) => a.handle));
      const handle =
        HANDLE_POOL[provider].find((option) => !taken.has(option)) ??
        `@account-${accounts.length + 1}`;

      return [
        ...accounts,
        // Appended, not prepended: a new account must not silently become the default
        // and redirect where publishes go.
        { id: nextAccountId(), handle, connectedAt: new Date().toISOString() },
      ];
    });

  const remove = (provider: SocialProvider, id: string) =>
    update(provider, (accounts) => accounts.filter((a) => a.id !== id));

  // Promotion is a move to the front, because position *is* priority — see the note on
  // `ProviderConnection`.
  const makeDefault = (provider: SocialProvider, id: string) =>
    update(provider, (accounts) => {
      const target = accounts.find((a) => a.id === id);
      return target ? [target, ...accounts.filter((a) => a.id !== id)] : accounts;
    });

  return (
    <Panel>
      <PanelBevel />

      <div className="@container flex flex-1 flex-col gap-5 p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          {/* No panel label: the tab above already names this section. */}
          <div>
            <p className="text-sm text-muted-foreground">
              Link a destination to publish a finished cut without downloading it first.
              You can connect more than one account per platform.
            </p>
          </div>
          {/* Two numbers now that a platform can hold several accounts: how many
              platforms are reachable, and how many accounts that adds up to. */}
          <p className="text-xs text-muted-foreground tabular-nums">
            {linkedPlatforms} of {state.length} platforms · {totalAccounts}{" "}
            {totalAccounts === 1 ? "account" : "accounts"}
          </p>
        </div>

        {/*
          Measured against this panel, not the viewport — `sm:` is a 640px *viewport*
          while this panel is 394px wide at that point, which packed three tiles into
          91px each. 34rem is where three tiles still leave each one usable.
        */}
        <div className="grid gap-4 @min-[34rem]:grid-cols-3">
          {state.map((connection) => (
            <ProviderTile
              key={connection.provider}
              connection={connection}
              onAdd={() => add(connection.provider)}
              onRemove={(id) => remove(connection.provider, id)}
              onMakeDefault={(id) => makeDefault(connection.provider, id)}
            />
          ))}
        </div>
      </div>
    </Panel>
  );
}

function ProviderTile({
  connection,
  onAdd,
  onRemove,
  onMakeDefault,
}: {
  connection: ProviderConnection;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onMakeDefault: (id: string) => void;
}) {
  const { name, blurb, Mark, chip, glow } = PROVIDER_META[connection.provider];
  const { accounts } = connection;
  const linked = accounts.length > 0;

  return (
    <div
      data-slot="account-tile"
      data-provider={connection.provider}
      className={cn(
        "relative isolate flex flex-col overflow-hidden rounded-xl p-5 transition-colors",
        // A linked tile is tinted and ringed in the success colour; an unlinked one stays
        // neutral. The difference has to be visible before you read either tile, which a
        // badge alone does not achieve.
        linked
          ? "bg-success/[0.04] ring-1 ring-success/25 ring-inset"
          : "bg-foreground/[0.02] ring-1 ring-foreground/[0.08] ring-inset hover:bg-foreground/[0.04]",
      )}
    >
      {/* The provider's own colour, blurred out of the top corner. Held behind the
          content at `-z-10`, which inside this tile's `isolate` means above the tile's
          background and below its text. */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute -top-10 -right-10 -z-10 size-28 rounded-full blur-2xl",
          glow,
        )}
      />

      <div className="flex items-start justify-between gap-2">
        <span
          aria-hidden
          className={cn(
            "grid size-11 shrink-0 place-items-center rounded-xl ring-1 ring-foreground/[0.06] ring-inset",
            chip,
          )}
        >
          <Mark className="size-[22px]" />
        </span>

        {linked ? (
          <span
            data-slot="connected-badge"
            className="inline-flex items-center gap-1 rounded-full bg-success/12 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-success uppercase"
          >
            <Check aria-hidden className="size-2.5" strokeWidth={3} />
            Connected
          </span>
        ) : null}
      </div>

      <p className="mt-4 text-sm font-semibold">{name}</p>

      {/*
        `flex-1` on the body, not `mt-auto` on the button: the grid already stretches all
        three tiles to the tallest, so the slack has to be absorbed *above* the button for
        the three buttons to sit on one line. Letting the button take it would put a
        different gap under each list.
      */}
      <div className="mt-3 flex-1">
        {linked ? (
          <ul data-slot="account-list" className="flex flex-col gap-1.5">
            {accounts.map((account, index) => (
              <AccountRow
                key={account.id}
                account={account}
                provider={connection.provider}
                // Position is priority, so the default is simply the first one.
                isDefault={index === 0}
                canRemove={accounts.length > 0}
                onRemove={() => onRemove(account.id)}
                onMakeDefault={() => onMakeDefault(account.id)}
              />
            ))}
          </ul>
        ) : (
          // The pitch, shown only while there is nothing to list. Once accounts exist
          // they say more about the platform than a line of copy would.
          <p className="text-xs leading-relaxed text-muted-foreground">{blurb}</p>
        )}
      </div>

      {/* TODO: starts the provider's OAuth flow. For now it appends a mock account so
          the two- and three-account states can be walked. */}
      <button
        type="button"
        onClick={onAdd}
        aria-label={linked ? `Add another ${name} account` : `Connect ${name}`}
        title={`Connecting ${name} is not wired up yet — this adds a placeholder account`}
        className={cn(
          "mt-4 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl text-sm font-semibold transition-colors",
          "focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none",
          // Quieter once the platform is already linked: adding a second account is a
          // follow-up, not the call to action the empty tile is making.
          linked
            ? "text-muted-foreground ring-1 ring-foreground/10 ring-inset hover:bg-foreground/[0.06] hover:text-foreground"
            : "border border-brand/45 text-brand-text hover:border-brand hover:bg-brand/10",
        )}
      >
        <Plus aria-hidden className="size-3.5" />
        {linked ? "Add account" : "Connect"}
      </button>
    </div>
  );
}

/**
 * The two row controls are held back until the row is hovered.
 *
 * At rest a linked account is a label — a handle and, on the default, its badge. The
 * star and the cross are things you do to it, and three tiles' worth of them showing at
 * once turned a quiet list into a wall of icons.
 *
 * `opacity`, not `hidden`: the buttons keep their space, so revealing them cannot reflow
 * the handle beside them. They stay in the tab order too, which is the point of
 * `group-focus-within` — tabbing to one has to bring it into view, or focus lands
 * somewhere invisible. `(hover: none)` pins them open on touch, where there is no hover
 * to discover them with.
 *
 * The Default badge is deliberately *not* revealed this way. It is a label saying where a
 * publish would go, not something you do — hiding it would mean hovering each row in turn
 * to find out which account is the default.
 */
const ROW_CONTROL = cn(
  "grid size-6 shrink-0 place-items-center rounded-md text-muted-foreground/60",
  "opacity-0 transition-[opacity,background-color,color]",
  "group-focus-within/row:opacity-100 group-hover/row:opacity-100",
  "[@media(hover:none)]:opacity-100",
  "disabled:pointer-events-none disabled:opacity-0",
);

function AccountRow({
  account,
  provider,
  isDefault,
  canRemove,
  onRemove,
  onMakeDefault,
}: {
  account: LinkedAccount;
  provider: SocialProvider;
  isDefault: boolean;
  canRemove: boolean;
  onRemove: () => void;
  onMakeDefault: () => void;
}) {
  const { chip, name } = PROVIDER_META[provider];

  return (
    <li
      data-slot="account-row"
      data-default={isDefault ? "" : undefined}
      className="group/row flex items-center gap-2 rounded-lg bg-foreground/[0.03] py-1.5 pr-1.5 pl-1.5 ring-1 ring-foreground/[0.06] transition-colors ring-inset hover:bg-foreground/[0.06]"
    >
      {/* Initials rather than a fetched avatar: there is no account to fetch one from,
          and a generic silhouette says less than two letters of the handle. Tinted in
          the provider's own colour so the row reads as belonging to this tile. */}
      <span
        aria-hidden
        className={cn(
          "grid size-7 shrink-0 place-items-center rounded-md text-[10px] font-bold",
          chip,
        )}
      >
        {initialsFor(account.handle)}
      </span>

      {/* The date is a `title` rather than a line of its own: at this width a second
          line would double the row's height for something rarely looked at. */}
      <span
        className="min-w-0 flex-1 truncate text-xs font-medium"
        title={`Linked ${formatDate(account.connectedAt)}`}
      >
        {account.handle}
      </span>

      {isDefault ? (
        <span
          data-slot="default-badge"
          className="shrink-0 rounded-full bg-brand/12 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-brand-text uppercase"
        >
          Default
        </span>
      ) : (
        // An icon, not a "Make default" label: three words do not fit beside a handle in
        // a tile this narrow, and the row already has two controls competing for the end
        // of the line.
        <button
          type="button"
          onClick={onMakeDefault}
          aria-label={`Make ${account.handle} the default ${name} account`}
          title="Make default"
          className={cn(
            ROW_CONTROL,
            "hover:bg-foreground/[0.08] hover:text-brand-text focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none",
          )}
        >
          <Star className="size-3.5" />
        </button>
      )}

      <button
        type="button"
        onClick={onRemove}
        disabled={!canRemove}
        aria-label={`Disconnect ${account.handle} from ${name}`}
        title="Disconnect"
        className={cn(
          ROW_CONTROL,
          "hover:bg-foreground/[0.08] hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
        )}
      >
        <X className="size-3.5" />
      </button>
    </li>
  );
}
