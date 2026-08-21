import { Check } from "lucide-react";

import { Panel, PanelBevel, PanelLabel } from "@/components/ui/panel";
import { PROVIDER_META } from "@/components/social/provider-marks";
import { cn, formatDate } from "@/lib/utils";
import type { ConnectedAccount } from "@/types/account";

/**
 * Where finished videos can be published.
 *
 * Tiles rather than a list of rows. Three integrations in a row of equal cards read as
 * a set of offers you choose between; the same three stacked as full-width rows read as
 * a settings table, and buried the one piece of colour each provider brings. It is also
 * the shape that survives a fourth and fifth provider being added.
 *
 * One tile per provider whether it is linked or not — an unlinked provider is an offer,
 * not an absence, so hiding it would leave the section looking complete when nothing is
 * connected at all.
 *
 * Every control here is inert. The buttons are real and focusable rather than
 * `disabled`, matching the sidebar's Log out: a row of greyed-out Connect buttons reads
 * as "your plan cannot do this" instead of "this is not built yet".
 *
 * TODO: each button starts an OAuth flow once a provider is chosen. `src/data/account.ts`
 * is `server-only` so the tokens that flow back never reach a client component.
 */
export function ConnectedAccounts({ accounts }: { accounts: ConnectedAccount[] }) {
  const linked = accounts.filter((account) => account.connected).length;

  return (
    <Panel className="lg:col-span-3">
      <PanelBevel />

      <div className="@container flex flex-1 flex-col gap-5 p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <div>
            <PanelLabel>Connected accounts</PanelLabel>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Link a destination to publish a finished cut without downloading it first.
            </p>
          </div>
          <p className="text-xs text-muted-foreground tabular-nums">
            {linked} of {accounts.length} connected
          </p>
        </div>

        {/*
          Measured against this panel, not the viewport.

          `sm:grid-cols-3` looked right and was not: `sm` is a 640px *viewport*, while
          this panel is 394px wide at that point because the sidebar takes 256px of it.
          Three tiles were being packed into 91px each — a 51px button and a caption
          wrapped over four lines. 34rem is the width at which three tiles plus their
          gaps still leave each one usable.
        */}
        <div className="grid gap-4 @min-[34rem]:grid-cols-3">
          {accounts.map((account) => (
            <AccountTile key={account.provider} account={account} />
          ))}
        </div>
      </div>
    </Panel>
  );
}

function AccountTile({ account }: { account: ConnectedAccount }) {
  const { name, blurb, Mark, chip, glow } = PROVIDER_META[account.provider];

  return (
    <div
      data-slot="account-tile"
      className={cn(
        "relative isolate flex flex-col overflow-hidden rounded-xl p-5 transition-colors",
        // A linked tile is tinted and ringed in the success colour; an unlinked one
        // stays neutral. The difference has to be visible before you read either tile,
        // which a badge alone does not achieve.
        account.connected
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

        {account.connected ? (
          <span
            data-slot="connected-badge"
            className="inline-flex items-center gap-1 rounded-full bg-success/12 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-success uppercase"
          >
            <Check aria-hidden className="size-2.5" strokeWidth={3} />
            Connected
          </span>
        ) : null}
      </div>

      {/*
        `flex-1` on the text block, not `mt-auto` on the button: the grid already
        stretches all three tiles to the tallest, so the slack has to be absorbed
        *above* the button for the three buttons to sit on one line. Letting the button
        take the slack instead would put a different gap under each caption.
      */}
      <div className="mt-4 flex-1">
        <p className="text-sm font-semibold">{name}</p>

        {/* The second line carries the account when there is one and the pitch when
            there is not — the useful thing to say in each state, out of one slot. */}
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {account.connected
            ? `${account.handle} · linked ${formatDate(account.connectedAt, {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}`
            : blurb}
        </p>
      </div>

      {account.connected ? (
        <button
          type="button"
          title={`Disconnecting ${name} is not wired up yet`}
          // Muted, not destructive-red: unlinking is reversible in two clicks, and the
          // only red on the page should be reserved for something that is not.
          className="mt-5 h-9 w-full rounded-xl text-sm font-medium text-muted-foreground ring-1 ring-foreground/10 transition-colors ring-inset hover:bg-foreground/[0.06] hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          Disconnect
        </button>
      ) : (
        <button
          type="button"
          title={`Connecting ${name} is not wired up yet`}
          className="mt-5 h-9 w-full rounded-xl border border-brand/45 text-sm font-semibold text-brand-text transition-colors hover:border-brand hover:bg-brand/10 focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none"
        >
          Connect
        </button>
      )}
    </div>
  );
}
