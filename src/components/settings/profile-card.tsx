import { BadgeCheck, Pencil } from "lucide-react";

import { DoodleField } from "@/components/home/doodle-field";
import { LogOutButton } from "@/components/settings/log-out-button";
import { Panel, PanelBevel } from "@/components/ui/panel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils";
import type { UserProfile } from "@/types/account";

/**
 * Who is signed in, and the details a support conversation asks for.
 *
 * Read-only. The Edit control is present but inert, which is how the rest of the app
 * carries an action whose backend does not exist yet — the sidebar's Log out is the
 * same shape. Turning these four lines into inputs would mean a Save that appears to
 * work and persists nothing.
 *
 * TODO: point Edit at a form once there are server actions to submit to.
 */
export function ProfileCard({ profile }: { profile: UserProfile }) {
  return (
    <Panel className="lg:col-span-2">
      <PanelBevel />

      {/*
        A cover band, with the avatar breaking its lower edge.
        The oldest premium-profile move there is, and it earns its place here: it gives
        the page one piece of artwork instead of three panels of type, and it puts the
        identity where the eye already lands.
      */}
      <div
        aria-hidden
        data-slot="profile-cover"
        className="relative isolate h-28 shrink-0 overflow-hidden"
      >
        {/* Two offset washes rather than one centred gradient, so the light has a
            direction across the band instead of sitting symmetrically in it. */}
        <div className="absolute inset-0 bg-[radial-gradient(120%_150%_at_12%_0%,color-mix(in_oklab,var(--brand)_34%,transparent),transparent_68%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(95%_130%_at_88%_15%,color-mix(in_oklab,var(--brand-accent)_28%,transparent),transparent_66%)]" />

        {/*
          The home hero's film-kit doodles, which is what ties this page to the rest of
          the product rather than inventing a second decorative language for it.

          Its own negative z-index is contained by the `isolate` on this wrapper, so the
          layer paints above the washes instead of dropping behind them.

          The opacity token is raised locally, because the page-wide value is tuned to
          be almost invisible behind a full-height hero and this band has only 112px to
          register in. Raised as a *pair*, not a single number: dark ink on a light
          surface carries further than light ink on a dark one, which is the same reason
          the base tokens are 0.045 and 0.06 rather than one value.

          A smaller tile than the hero uses, so the motifs repeat often enough to read
          as texture instead of as three large illustrations parked in a band.
        */}
        <div className="absolute inset-0 isolate [--doodle-opacity:0.10] dark:[--doodle-opacity:0.15]">
          <DoodleField tileWidth={400} tileHeight={240} />
        </div>

        {/* Settles the band into the panel — without it the artwork stops on a hard
            horizontal line exactly where the content begins. */}
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-b from-transparent to-card" />
      </div>

      <div className="@container flex flex-1 flex-col gap-6 px-6 pb-6">
        {/* `items-end`, so the avatar hangs off the band while the name it belongs to
            keeps its baseline with the Edit button opposite. */}
        <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
          {/*
            `size-24` unprefixed, and deliberately not `size="lg"`: that variant is a
            `data-[size=lg]:size-10` rule, and tailwind-merge will not let a plain
            `size-*` replace a variant-prefixed one — the avatar would stay 40px with a
            dead class attached.

            The ring is the card's own colour rather than a border, so the avatar reads
            as punching through the cover instead of sitting on top of it.
          */}
          <Avatar className="-mt-14 size-24 shadow-xl ring-4 shadow-black/20 ring-card dark:shadow-black/50">
            {profile.avatarUrl ? <AvatarImage src={profile.avatarUrl} alt="" /> : null}
            {/* Reached whenever there is no photo, which is every time until upload
                exists. A brand gradient rather than the primitive's flat `bg-muted`,
                because at 96px this is the largest single element on the page. */}
            <AvatarFallback className="bg-gradient-to-br from-brand/25 to-brand-accent/25 text-2xl font-semibold text-brand-text">
              {profile.initials}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate font-heading text-xl font-semibold tracking-tight">
                {profile.name}
              </h2>
              {/* The plan, as a chip rather than a row in the list below: it is the one
                  thing here that changes what the account can do. */}
              <span
                data-slot="plan-badge"
                className="inline-flex shrink-0 items-center gap-1 rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-semibold text-brand-text ring-1 ring-brand/20 ring-inset"
              >
                <BadgeCheck aria-hidden className="size-3" />
                {profile.plan}
              </span>
            </div>
            <p className="mt-1 truncate text-sm text-muted-foreground">{profile.email}</p>
          </div>

          {/* Wrapped so the pair wraps as a unit — on a narrow panel they drop onto
              their own line together rather than Edit staying put and Log out sliding
              under the email. */}
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              // Inert until there is somewhere to submit to. Not `disabled`: a greyed-out
              // Edit on a profile reads as an account restriction rather than as an
              // unfinished feature.
              title="Editing your profile is not wired up yet"
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-foreground/[0.04] px-3.5 text-sm font-medium text-muted-foreground ring-1 ring-foreground/10 transition-colors ring-inset hover:bg-foreground/[0.08] hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <Pencil aria-hidden className="size-3.5" />
              Edit
            </button>

            <LogOutButton />
          </div>
        </div>

        {/*
          A description list, not a table: these are four labelled values, and `dl` is
          what pairs a label with its value for a screen reader without inventing rows
          and columns that do not exist.

          Inset on its own faint plate so the panel has two distinct registers — artwork
          and identity above, reference data below — rather than one continuous slab.

          The rule between columns comes from `divide-x` on the grid, which only draws
          where there are two columns to divide. Stacked, it draws nothing, so there is
          no state that shows a stray vertical line.

          Two columns by *container* width, not viewport. `sm:` was wrong for the same
          reason it was wrong on the account tiles: at a 660px viewport this panel is
          354px wide, and two columns of it put the phone number and the email under
          140px each — where `truncate` quietly ate the end of both. Truncation is
          meant for a pathological value, not for the seeded data.
        */}
        <dl className="mt-auto grid gap-y-5 rounded-xl bg-foreground/[0.02] p-5 ring-1 ring-foreground/[0.06] ring-inset @min-[21rem]:grid-cols-2 @min-[21rem]:divide-x @min-[21rem]:divide-border/50">
          <Field label="Display name" value={profile.name} />
          <Field label="Phone" value={profile.phone} className="@min-[21rem]:pl-6" />
          <Field label="Email" value={profile.email} />
          <Field
            label="Member since"
            value={formatDate(profile.memberSince, { month: "long", year: "numeric" })}
            className="@min-[21rem]:pl-6"
          />
        </dl>
      </div>
    </Panel>
  );
}

function Field({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className ? `min-w-0 ${className}` : "min-w-0"}>
      <dt className="text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
        {label}
      </dt>
      {/* `truncate` rather than wrap: an email or a phone number breaking onto a second
          line would make one column taller than the other and stagger the whole grid. */}
      <dd className="mt-1.5 truncate text-sm font-medium">{value}</dd>
    </div>
  );
}
