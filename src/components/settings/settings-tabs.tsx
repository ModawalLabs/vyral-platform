"use client";

import { CreditCard, Share2 } from "lucide-react";
import type { ReactNode } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * The two long sections of the settings page, one at a time.
 *
 * Profile and credits stay above as a fixed header — they are what the page *is*. These
 * two are what you came to change, and stacked they made the page a long scroll where
 * neither was ever fully in view.
 *
 * The tabs are the headings. Both panels used to carry their own uppercase label, which
 * is why neither does any more: a heading repeating the tab you just pressed is the
 * clearest sign a section was bolted on rather than designed in. Their descriptions
 * stayed — those say something the two-word tab cannot.
 *
 * Takes the panels as children rather than their data, so it knows nothing about
 * accounts or ledgers and the page keeps composing them.
 */
const TABS = [
  { value: "accounts", label: "Connected accounts", Icon: Share2 },
  { value: "spending", label: "Spending", Icon: CreditCard },
] as const;

export function SettingsTabs({
  accounts,
  spending,
}: {
  accounts: ReactNode;
  spending: ReactNode;
}) {
  const panels: Record<(typeof TABS)[number]["value"], ReactNode> = {
    accounts,
    spending,
  };

  return (
    <Tabs defaultValue="accounts" className="flex flex-col gap-4">
      {/* `group-data-horizontal/tabs:h-auto`, not plain `h-auto`: the list's height comes
          from a variant-prefixed `h-8`, which tailwind-merge treats as a different group
          and so does not replace. Unprefixed, the 32px survives and clips the descenders
          off these larger labels. */}
      <TabsList
        variant="line"
        className="no-scrollbar w-full justify-start gap-1 overflow-x-auto group-data-horizontal/tabs:h-auto"
      >
        {TABS.map(({ value, label, Icon }) => (
          <TabsTrigger
            key={value}
            value={value}
            data-slot="settings-tab"
            data-tab={value}
            // `flex-none` because the list is `w-full`: without it the two triggers
            // stretch to half the page each and the underline runs the whole width.
            className="flex-none gap-2 px-3.5 py-2 text-[15px] font-semibold"
          >
            <Icon className="size-4" />
            {label}
          </TabsTrigger>
        ))}
      </TabsList>

      {TABS.map(({ value }) => (
        /*
          `keepMounted`, which Base UI does not do by default.
          Both panels hold real state — the accounts you have added or promoted, the
          group-by and drill-down in spending. Letting the inactive one unmount would
          quietly discard all of it, so linking a second YouTube account and then
          glancing at Spending would undo the link.
        */
        <TabsContent key={value} value={value} keepMounted>
          {panels[value]}
        </TabsContent>
      ))}
    </Tabs>
  );
}
