"use client";

import { BookText, Library } from "lucide-react";

import { AssetsTab } from "@/components/create/tabs/assets-tab";
import { BriefTab } from "@/components/create/tabs/brief-tab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * Two panels: the brief and the material it draws on.
 *
 * The screenplay used to be a tab of its own and now sits inside the brief, under
 * its own heading — it is a consequence of the story and the settings rather than
 * a separate place to visit, and the scroll from one to the other is shorter than
 * a tab switch. Generation has been removed entirely.
 */
const TABS = [
  { value: "brief", label: "Production Workspace", Icon: BookText, Panel: BriefTab },
  { value: "assets", label: "Asset Library", Icon: Library, Panel: AssetsTab },
] as const;

/** The output half of a session. */
export function WorkspacePanel() {
  return (
    <Tabs defaultValue="brief" className="flex min-h-0 flex-1 flex-col gap-4 pt-4 pb-6">
      {/* `group-data-horizontal/tabs:h-auto`, not plain `h-auto`: the list's height
          comes from a variant-prefixed `h-8`, which tailwind-merge treats as a
          different group and so does not replace. Unprefixed, the 32px survives and
          clips the descenders off these now-larger labels. */}
      <TabsList
        variant="line"
        className="no-scrollbar w-full shrink-0 justify-start gap-1 overflow-x-auto group-data-horizontal/tabs:h-auto"
      >
        {TABS.map(({ value, label, Icon }) => (
          <TabsTrigger
            key={value}
            value={value}
            // These are the top-level destinations, so they carry more weight than
            // the beat tabs nested inside the brief.
            className="flex-none gap-2 px-3.5 py-2 text-base font-semibold"
          >
            <Icon className="size-4.5" />
            {label}
          </TabsTrigger>
        ))}
      </TabsList>

      <div className="scrollbar-slim min-h-0 flex-1 overflow-y-auto pr-1">
        {TABS.map(({ value, Panel }) => (
          <TabsContent key={value} value={value}>
            <Panel />
          </TabsContent>
        ))}
      </div>
    </Tabs>
  );
}
