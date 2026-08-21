import { expect, test, type Locator, type Page } from "@playwright/test";

/**
 * Click a trigger until its panel is actually open.
 *
 * A click that lands before React hydrates hits the DOM but not the handler, so
 * the panel never opens and the test times out waiting for it. Retrying the
 * click â€” rather than sleeping and hoping â€” is the only reliable fix.
 */
async function openPanel(trigger: Locator, revealed: Locator) {
  await expect(async () => {
    await trigger.click();
    await expect(revealed).toBeVisible({ timeout: 1_000 });
  }).toPass({ timeout: 15_000 });
}

/**
 * Answer the director's intake so the workspace opens.
 *
 * The right column is a production slate until both questions are proceeded past, so
 * every test that touches a workspace tab has to get through this first. Each Proceed
 * is followed by a pause while the next line is "typed", which is why this waits on the
 * button reappearing rather than on a fixed delay.
 */
async function completeIntake(page: Page) {
  const proceed = page.getByRole("button", { name: "Proceed" });
  for (let i = 0; i < 2; i++) {
    await expect(proceed).toBeVisible({ timeout: 10_000 });
    await proceed.click();
  }
  // The tabs replace the slate on the beat the closing line lands.
  await expect(page.getByRole("tab", { name: "Production Workspace" })).toBeVisible({
    timeout: 10_000,
  });
}

test("workspace home renders the composer and greets the user", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1, name: "Vyral" })).toBeVisible();
  // Scoped to the paragraph: the typewriter renders the line three times over
  // (screen-reader copy, invisible spacer, and the reveal itself).
  await expect(
    page.locator("p", { hasText: /ready to get creative\?/i }).first(),
  ).toBeVisible();
  await expect(page.getByLabel(/describe your vyral idea/i)).toBeVisible();
});

test("home keeps its spacing as the window gets shorter", async ({ page }) => {
  /*
   * The hero's height is viewport-derived but the space under the composer must not be.
   *
   * It used to be: `min-h-[56vh]` with centred content split the leftover height above
   * and below, so the following section sat 97px under the composer on a tall window and
   * 32px under it on a short one. The Trending block's own wash reached a fixed 128px
   * above its section on top of that, so as the gap closed the wash climbed over the
   * composer and drew a tinted edge across it.
   */
  await page.goto("/");

  const measure = () =>
    page.evaluate(() => {
      const composer = document.querySelector("form .glass-frame")!;
      const trending = [...document.querySelectorAll("h2")]
        .find((n) => /trending/i.test(n.textContent ?? ""))!
        .closest("section")!;
      // The rails' backdrop wash — the thing that used to ride up over the composer.
      // By slot, not by class: keying on `-top-16` would make this crash rather than
      // fail if the offset were ever retuned, which is exactly the case it must catch.
      const wash = document.querySelector("[data-slot=rails-wash]")!;
      const bottom = composer.getBoundingClientRect().bottom;
      return {
        gap: Math.round(trending.getBoundingClientRect().top - bottom),
        washClearance: Math.round(wash.getBoundingClientRect().top - bottom),
      };
    });

  // Deliberately spans the collapse: 56vh stops winning somewhere around 780px, so
  // these bracket both regimes — slack to distribute, and none.
  const heights = [1200, 900, 800, 700, 500, 400];
  const seen: Array<{ gap: number; washClearance: number }> = [];

  for (const height of heights) {
    await page.setViewportSize({ width: 1440, height });
    // The greeting types itself in; wait for the composer to settle at its final y.
    await expect.poll(async () => (await measure()).gap).toBeGreaterThan(0);
    seen.push(await measure());
  }

  // One gap, at every height — not merely "positive".
  expect(new Set(seen.map((s) => s.gap)).size).toBe(1);
  // ...and the wash stays off the composer throughout.
  for (const { washClearance } of seen) expect(washClearance).toBeGreaterThan(0);
  expect(new Set(seen.map((s) => s.washClearance)).size).toBe(1);
});

test("greeting types itself in without moving the page", async ({ page }) => {
  // On `/new`, not home: the greeting is the same component on both, but here it sits
  // in a full-viewport column rather than a narrow one, which is where a horizontal
  // shift is large enough to see. On home the slack was ~0 and hid the bug entirely.
  await page.goto("/new");

  const greeting = page.locator("p", { hasText: "Ready to get creative" }).first();
  const reveal = greeting.locator("[data-slot=typewriter-reveal]");
  const revealed = () =>
    reveal.evaluate(
      // Strip the caret element's (empty) text so the comparison is just copy.
      (el) => el.textContent?.trim() ?? "",
    );
  const composer = page.locator("form .glass-frame");
  const composerY = async () => Math.round((await composer.boundingBox())!.y);

  /**
   * Where the first character sits.
   *
   * Measured with a Range over the text node, not the element's box: the box spans
   * its grid cell and never moved even when the text jumped half the viewport, so
   * asserting on it would have missed this entirely.
   */
  const firstGlyphX = () =>
    reveal.evaluate((el) => {
      const node = [...el.childNodes].find(
        (n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim(),
      );
      if (!node) return null;
      const range = document.createRange();
      range.setStart(node, 0);
      range.setEnd(node, 1);
      return Math.round(range.getBoundingClientRect().left);
    });

  // `boundingBox()` is null until the element exists, and under a parallel run this
  // measurement can otherwise land before the page has painted.
  await expect(composer).toBeVisible();
  const startY = await composerY();

  // Mid-flight: some of the line, not all of it.
  await expect
    .poll(async () => {
      const text = await revealed();
      return (
        text.length > 0 && text.length < "Hello Shivansh, Ready to get creative?".length
      );
    })
    .toBe(true);

  // The reserved box means nothing below shifts while characters land.
  expect(await composerY()).toBe(startY);
  const midX = await firstGlyphX();

  await expect.poll(revealed).toBe("Hello Shivansh, Ready to get creative?");
  expect(await composerY()).toBe(startY);

  /*
   * ...and the line does not slide sideways on the last keystroke either.
   *
   * It used to: the reveal was left-aligned in a cell as wide as the container, so
   * typing began at the page margin and snapped to the middle when `text-left` came
   * off — a ~520px jump on this route. The cell is now the width of the line.
   */
  expect(await firstGlyphX()).toBe(midX);
  // Sanity: that stable position really is centred, not just consistently left.
  const centred = await reveal.evaluate((el) => {
    const box = el.parentElement!.getBoundingClientRect();
    return Math.abs(box.left - (window.innerWidth - box.right)) <= 2;
  });
  expect(centred).toBe(true);

  // Screen readers get the whole line from the start, not letter by letter.
  await expect(greeting.locator(".sr-only")).toHaveText(
    "Hello Shivansh, Ready to get creative?",
  );

  // A parent re-render must not restart it.
  await page.getByLabel(/describe your vyral idea/i).pressSequentially("hi");
  await expect.poll(revealed).toBe("Hello Shivansh, Ready to get creative?");
});

test("sidebar navigates and collapses", async ({ page }) => {
  await page.goto("/");

  const nav = page.getByRole("navigation", { name: "Workspace" });
  await nav.getByRole("link", { name: "Projects" }).click();
  // Generous: this is the first visit to /projects, so on the dev server it waits
  // on a route compile, which under a parallel run overruns the default 5s.
  await expect(page).toHaveURL(/\/projects$/, { timeout: 20_000 });
  await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();

  // Collapsing drops the visible labels; the links stay, now named by title.
  await page.getByRole("button", { name: /collapse sidebar/i }).click();
  await expect(nav.getByText("Projects", { exact: true })).toBeHidden();
  await expect(page.getByRole("button", { name: /expand sidebar/i })).toBeVisible();

  // The choice survives a reload because it is stored in a cookie.
  await page.reload();
  await expect(page.getByRole("button", { name: /expand sidebar/i })).toBeVisible();
});

test("theme switch flips between light and dark", async ({ page }) => {
  await page.goto("/");

  // Scoped to the switch: prompt copy on the page also contains "light".
  const theme = page.getByRole("group", { name: "Theme" });
  const html = page.locator("html");

  await theme.getByRole("button", { name: "Dark" }).click();
  await expect(html).toHaveClass(/dark/);

  await theme.getByRole("button", { name: "Light" }).click();
  await expect(html).not.toHaveClass(/dark/);
});

test("suggestion cards load the composer", async ({ page }) => {
  await page.goto("/");
  const input = page.getByLabel(/describe your vyral idea/i);

  const trending = page.getByRole("button", { name: /neon-lit Tokyo alley/i });
  await trending.click();
  await expect(input).toHaveValue(/neon-lit Tokyo alley/i);
  await expect(input).toBeFocused();

  // "Try now" on a portrait card replaces the draft with that card's prompt.
  await page
    .getByRole("article")
    .filter({ hasText: /lone astronaut/i })
    .getByRole("button", { name: /try now/i })
    .click();
  await expect(input).toHaveValue(/lone astronaut/i);
});

test("the composer is a field and a button, nothing else", async ({ page }) => {
  for (const route of ["/", "/new"]) {
    await page.goto(route);
    const form = page.locator("form");

    // Settings and attachments belong to the Production Workspace now. Gone from the
    // DOM, not merely hidden — nothing to tab into.
    for (const name of [
      /^Model:/,
      /^Duration:/,
      /^Aspect ratio:/,
      /^Platform:/,
      /^Resolution:/,
      "Add attachment",
    ]) {
      await expect(form.getByRole("button", { name })).toHaveCount(0);
    }

    // What is left: the field and one submit.
    await expect(form.getByLabel(/describe your vyral idea/i)).toBeVisible();
    await expect(form.getByRole("button")).toHaveCount(1);
    await expect(form.getByRole("button", { name: "Generate" })).toBeVisible();
  }
});

test("prompt field takes multiple lines and caps its height", async ({ page }) => {
  await page.goto("/");
  const field = page.getByLabel(/describe your vyral idea/i);
  const box = () =>
    field.evaluate((el) => ({
      height: Math.round(el.getBoundingClientRect().height),
      scrolls: el.scrollHeight > el.clientHeight + 1,
    }));

  const oneLine = await box();
  expect(oneLine.scrolls).toBe(false);

  // Shift+Enter builds lines and the field grows with them.
  await field.click();
  for (let i = 1; i <= 4; i++) {
    await field.pressSequentially(`line ${i}`);
    if (i < 4) await field.press("Shift+Enter");
  }
  const fourLines = await box();
  expect(fourLines.height).toBeGreaterThan(oneLine.height);
  expect(fourLines.scrolls).toBe(false);

  // Past the cap it stops growing and scrolls instead of shoving the page down.
  for (let i = 5; i <= 9; i++) {
    await field.press("Shift+Enter");
    await field.pressSequentially(`line ${i}`);
  }
  const nineLines = await box();
  expect(nineLines.height).toBeLessThanOrEqual(fourLines.height + 30);
  expect(nineLines.scrolls).toBe(true);

  // Plain Enter submits rather than adding a line.
  const before = await field.inputValue();
  await field.press("Enter");
  await expect(field).toHaveValue(before);
});

test("autofill leaves the glass inset alone until the user types", async ({ page }) => {
  await page.goto("/");
  const frame = page.locator("form .glass-frame");
  const paddingTop = () => frame.evaluate((el) => getComputedStyle(el).paddingTop);
  const field = page.getByLabel(/describe your vyral idea/i);

  await page.getByRole("button", { name: /neon-lit Tokyo alley/i }).click();
  await expect(field).toHaveValue(/neon-lit Tokyo alley/i);
  await expect(field).toBeFocused();
  // The card handed over a prompt; that is not the user settling in to write,
  // so the frame keeps its inset.
  await expect.poll(paddingTop).toBe("5px");

  // The first keystroke is.
  await field.press("End");
  await expect.poll(paddingTop).toBe("0px");
});

test("autofill keeps the composer's inset even on all sides", async ({ page }) => {
  await page.goto("/");

  // The frame's inset must stay symmetric: a re-centring smooth scroll used to
  // leave the backdrop-filtered layer misaligned, pooling the whole inset at
  // the bottom edge.
  const insets = () =>
    page.locator("form .glass-frame").evaluate((frame) => {
      const inner = frame.querySelector(".bg-composer")!;
      const f = frame.getBoundingClientRect();
      const i = inner.getBoundingClientRect();
      return {
        top: Math.round(i.top - f.top),
        bottom: Math.round(f.bottom - i.bottom),
      };
    });

  // Composer already on screen â€” nothing should scroll.
  await page.getByRole("button", { name: /neon-lit Tokyo alley/i }).click();
  await expect.poll(insets).toEqual({ top: 6, bottom: 6 });

  // And from far enough down that bringing it into view is a real scroll.
  await page.mouse.wheel(0, 1200);
  await page
    .getByRole("article")
    .filter({ hasText: /lone astronaut/i })
    .getByRole("button", { name: /try now/i })
    .click();
  await expect.poll(insets).toEqual({ top: 6, bottom: 6 });
});

test("glass frame collapses only for the prompt input", async ({ page }) => {
  await page.goto("/");

  // Trending cards use .glass-frame too; the composer's is the one in the form.
  const frame = page.locator("form .glass-frame");
  const paddingTop = () => frame.evaluate((el) => getComputedStyle(el).paddingTop);

  const field = page.getByLabel(/describe your vyral idea/i);
  const submit = page.getByRole("button", { name: "Generate" });

  await expect.poll(paddingTop).toBe("5px");

  // Writing collapses the inset...
  await field.click();
  await expect.poll(paddingTop).toBe("0px");

  /*
   * ...and leaving the field restores it.
   *
   * Type first so the submit is focusable: it is disabled on an empty prompt, and a
   * disabled button cannot take focus — so `.focus()` on it was a silent no-op, the
   * field never blurred, and the earlier version of this check asserted nothing.
   */
  await field.pressSequentially("a idea");
  await expect(submit).toBeEnabled();
  await expect.poll(paddingTop).toBe("0px");

  await submit.focus();
  await expect(submit).toBeFocused();
  await expect.poll(paddingTop).toBe("5px");
});

test("New Video opens the full-screen composer", async ({ page }) => {
  await page.goto("/projects");

  // Both entry points land on the same route.
  await page.getByRole("main").getByRole("link", { name: "New video" }).click();
  await expect(page).toHaveURL(/\/new$/);

  // Full screen means no app chrome at all.
  await expect(page.getByRole("navigation", { name: "Workspace" })).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 1, name: "Vyral" })).toBeVisible();
  await expect(page.getByLabel(/describe your vyral idea/i)).toBeVisible();

  // Closing returns to wherever it was opened from, not blindly to home.
  await page.getByRole("button", { name: "Close" }).click();
  await expect(page).toHaveURL(/\/projects$/);

  await page.goto("/");
  await page.getByRole("link", { name: "New Video" }).click();
  await expect(page).toHaveURL(/\/new$/);
});

test("Generate on home hands the session to /new", async ({ page }) => {
  await page.goto("/");

  const prompt = "A neon-lit Tokyo alley in the rain";
  await page.getByLabel(/describe your vyral idea/i).fill(prompt);

  const composerX = async () =>
    Math.round((await page.locator("form .glass-frame").boundingBox())!.x);

  await page.getByRole("button", { name: "Generate" }).click();
  await page.waitForURL(/\/new\?/);

  /*
   * The prompt and settings travel in the URL, so this survives a reload.
   * Compared decoded: URLSearchParams writes spaces as "+", not "%20".
   *
   * The settings are the defaults now rather than something picked on the way — the
   * composer has no controls left. The handoff still has to carry them, because /new
   * reads its opening settings from these params and not from its own defaults.
   */
  const query = new URL(page.url()).searchParams;
  expect(query.get("prompt")).toBe(prompt);
  expect(query.get("model")).toBe("Veo3");
  expect(query.get("aspect")).toBe("16:8");
  expect(query.get("duration")).toBe("10");

  /*
   * The composer travels to the corner rather than snapping there — asserted from
   * the transition it carries, not by sampling its position mid-flight.
   *
   * Sampling does not work. The handoff waits 140ms and the travel takes 700ms on
   * a front-loaded ease, and on a busy machine all of it can elapse before
   * `waitForURL` returns and the first `boundingBox()` comes back: earlier versions
   * of this check read 371 and then 67 on repeat runs, against a start of ~420 and
   * an end of ~24. The animation is real, the timing simply is not observable from
   * here — so assert the mechanism and the destination instead.
   */
  const travel = await page.locator("[data-slot=composer-travel]").evaluate((el) => ({
    properties: getComputedStyle(el).transitionProperty,
    duration: getComputedStyle(el).transitionDuration,
  }));
  expect(travel.properties).toContain("left");
  expect(travel.properties).toContain("width");
  expect(travel.duration).toBe("0.7s");

  await expect.poll(composerX).toBeLessThan(100);

  await expect(page.getByRole("heading", { name: "AI Director" })).toBeVisible();
  await expect(page.getByText(prompt).first()).toBeVisible();

  await completeIntake(page);

  // The carried settings reached the session. The brief is the only place they are
  // visible — and the only place they can be changed.
  await page.getByRole("tab", { name: "Production Workspace" }).click();
  await expect(page.locator("[data-slot=setting-aspectRatio]")).toHaveText("16:8");
  await expect(page.locator("[data-slot=setting-model]")).toHaveText("Veo3");
});

test("a hand-edited handoff URL cannot inject bad settings", async ({ page }) => {
  await page.goto("/new?prompt=Test%20prompt&model=GPT-9&duration=999&aspect=1%3A1");

  await expect(page.getByText("Test prompt").first()).toBeVisible();

  // The settings live in the workspace, which the intake gates.
  await completeIntake(page);

  // Unknown model and ratio fall back; the duration clamps to the slider's max.
  await page.getByRole("tab", { name: "Production Workspace" }).click();
  await expect(page.locator("[data-slot=setting-model]")).toHaveText("Veo3");
  await expect(page.locator("[data-slot=setting-aspectRatio]")).toHaveText("16:8");
  await expect(page.locator("[data-slot=setting-durationSeconds]")).toHaveText("15s");
});

test("Generate splits /new into director and workspace columns", async ({ page }) => {
  await page.goto("/new");

  const composer = page.locator("form .glass-frame");
  const field = page.getByLabel(/describe your vyral idea/i);
  const box = async () => {
    const b = (await composer.boundingBox())!;
    return { x: Math.round(b.x), width: Math.round(b.width) };
  };

  // Idle: centred, wide, no columns.
  const idle = await box();
  await expect(page.getByRole("heading", { name: "AI Director" })).toBeHidden();
  await expect(page.getByRole("tab", { name: "Production Workspace" })).toBeHidden();

  const prompt = "A neon-lit Tokyo alley in the rain";
  await field.fill(prompt);
  await page.getByRole("button", { name: "Generate" }).click();

  await expect(page.getByRole("heading", { name: "AI Director" })).toBeVisible();
  await expect(page).toHaveURL(/\/new$/);

  /*
   * The right column starts as a production slate, not the workspace.
   *
   * Unmounted rather than hidden, so this asserts a count of zero: a hidden `Tabs`
   * would still be focusable behind the slate, and `toBeHidden` passes for an element
   * that is merely clipped by an overflow ancestor.
   */
  await expect(page.locator("[data-slot=intake-slate]")).toBeVisible();
  await expect(page.getByRole("tab", { name: "Production Workspace" })).toHaveCount(0);
  // The slate carries the brief it was handed, so both halves agree on the job.
  await expect(page.locator("[data-slot=intake-slate]")).toContainText(prompt);

  await completeIntake(page);
  await expect(page.locator("[data-slot=intake-slate]")).toHaveCount(0);

  // The composer travelled rather than being re-created: same element, moved
  // left and narrowed into the left column.
  await expect.poll(async () => (await box()).x < idle.x - 100).toBe(true);
  expect((await box()).width).toBeLessThan(idle.width);

  // The prompt became a message and left the field, so the next instruction
  // starts from empty.
  await expect(page.getByText(prompt).first()).toBeVisible();
  await expect(field).toHaveValue("");
  // In the split view the composer's submit is the send arrow, not "Generate".
  await expect(page.getByRole("button", { name: "Send" })).toBeDisabled();

  // ...and it is stripped back to just the field: the settings pills and the
  // attachment button belong to composing a brief, not to instructing a running
  // session, where the brief and the Asset Library own that ground.
  // Gone from the DOM, not merely hidden — nothing to tab into.
  //
  // Scoped to the composer: the brief's own settings bar carries Model, Duration and
  // Aspect ratio pills of its own, so an unscoped query finds those instead.
  const composerForm = page.locator("form");
  for (const name of [/^Model:/, /^Duration:/, /^Aspect ratio:/, "Add attachment"]) {
    await expect(composerForm.getByRole("button", { name })).toHaveCount(0);
  }
  // The one control that survives, so this is not passing on a broken composer.
  await expect(page.getByRole("button", { name: "Send" })).toHaveCount(1);

  /*
   * The director's scroll area ends above the composer.
   *
   * Not padding inside the scroller — that clears the last message but leaves the
   * viewport running under a translucent box, so mid-scroll the transcript showed
   * through it and the scrollbar ran past it. The reserve is measured from the
   * composer, so it has to survive the composer growing too.
   */
  const chatGap = () =>
    page.evaluate(() => {
      const reserve = document.querySelector("[data-slot=composer-reserve]")!;
      const scroller = reserve.previousElementSibling!;
      const composer = document.querySelector("[data-slot=composer-travel]")!;
      return {
        gap: Math.round(
          composer.getBoundingClientRect().top - scroller.getBoundingClientRect().bottom,
        ),
        composerHeight: Math.round(composer.getBoundingClientRect().height),
      };
    });

  // Polled, not read once: mid-travel the composer is still up in the middle of the
  // screen, so the gap is meaningless until it lands in the corner.
  await expect.poll(async () => (await chatGap()).gap).toBeGreaterThan(0);
  const oneLine = await chatGap();

  // Grow the field; the reserve tracks it rather than being a fixed guess.
  const chatField = page.getByLabel(/describe your vyral idea/i);
  await chatField.click();
  for (let i = 0; i < 4; i++) {
    await chatField.pressSequentially(`line ${i}`);
    await chatField.press("Shift+Enter");
  }
  await expect
    .poll(async () => (await chatGap()).composerHeight)
    .toBeGreaterThan(oneLine.composerHeight);
  await expect.poll(async () => (await chatGap()).gap).toBeGreaterThan(0);

  await chatField.fill("");

  // Two tabs, opening on the brief. Screenplay lives inside the brief now, and
  // Generation is gone entirely — so neither is a destination.
  //
  // Scoped to the first tablist: the screenplay's beats are a nested tab set, so
  // an unscoped tab query picks those up too.
  const workspaceTabs = page.getByRole("tablist").first();
  await expect(workspaceTabs.getByRole("tab")).toHaveText([
    "Production Workspace",
    "Asset Library",
  ]);
  await expect(page.getByRole("tab", { name: "Production Workspace" })).toHaveAttribute(
    "data-active",
    "",
  );
  await expect(page.getByRole("button", { name: "Generate video" })).toHaveCount(0);

  // The screenplay is a section of the brief, under its own heading, rather than
  // somewhere to navigate to — and its beats are a nested tab set.
  const panel = page.getByRole("tabpanel");
  await expect(panel.getByRole("heading", { name: "Screenplay" })).toBeVisible();
  await expect(panel.getByRole("tab")).toHaveCount(5);

  await page.getByRole("tab", { name: "Asset Library" }).click();
  await expect(panel.getByRole("heading", { name: "Screenplay" })).toBeHidden();
});

test("workspace tabs drive one shared session", async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto("/new?prompt=A%20neon-lit%20Tokyo%20alley%20in%20the%20rain");
  const chat = page.getByRole("heading", { name: "AI Director" }).locator("..");

  // Once a session is running the composer is a chat box: the launcher label
  // gives way to a send arrow.
  await expect(page.getByRole("button", { name: "Send" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Generate", exact: true })).toHaveCount(
    0,
  );

  await completeIntake(page);

  // The brief: prose and settings on one page, read-only until Edit.
  await page.getByRole("tab", { name: "Production Workspace" }).click();
  // `.first()` because the screenplay's beats are a nested tab set, so there are two
  // tabpanels on screen: this one and the open beat's. Chained locators tolerate the
  // ambiguity; `evaluate` does not.
  const panel = page.getByRole("tabpanel").first();
  // Scoped to the card: the screenplay shares this page and every scene has its
  // own Edit, Regenerate and version control.
  const brief = panel.locator("[data-slot=brief-card]");
  const model = page.locator("[data-slot=setting-model]");
  const storyBody = page.locator("[data-slot=story-body]");
  const revisions = panel.locator("[data-slot=revision-rail]").getByRole("button");
  /** The strip is the only thing marking the active revision now. */
  const active = panel.locator("[data-slot=revision-rail] [aria-current=true]");

  // A fresh session opens on Revision 1, already selected — the strip is present
  // from the first revision rather than appearing once there are two.
  await expect(revisions).toHaveCount(1);
  await expect(active).toContainText("Revision 1");
  await expect(model).toHaveText("Veo3");

  /*
   * Read-only locks the pills rather than replacing them.
   *
   * They stay on screen showing the applied values — the assertion is that they are
   * disabled, not absent, because swapping them for text would move the layout on
   * every edit.
   */
  const SETTING_PILL = /^(Model|Platform|Aspect ratio|Duration|Resolution):/;
  // By label rather than by counting the bar's buttons: the model info trigger sits
  // in there too, so a raw count would be six.
  await expect(brief.getByRole("button", { name: SETTING_PILL })).toHaveCount(5);
  for (const label of [
    /^Model:/,
    /^Platform:/,
    /^Aspect ratio:/,
    /^Duration:/,
    /^Resolution:/,
  ]) {
    await expect(brief.getByRole("button", { name: label })).toBeDisabled();
  }
  // Resolution is session-only, so a handed-over session takes the default.
  await expect(brief.locator("[data-slot=setting-resolution]")).toHaveText("1080p");

  // Two rows, settings above the story rather than beside it.
  const rows = await brief.evaluate((el) => {
    const y = (sel: string) =>
      Math.round(el.querySelector(sel)!.getBoundingClientRect().top);
    return {
      settings: y("[data-slot=session-settings]"),
      story: y("[data-slot=story-body]"),
    };
  });
  expect(rows.settings).toBeLessThan(rows.story);
  await expect(brief).toContainText("Read-only. Use Edit above to change them.");

  // The model's trade-offs are behind an info affordance rather than a permanent
  // card, so they are absent until asked for.
  const info = brief.locator("[data-slot=model-info]");
  const modelCard = page.locator("[data-slot=hover-card-content]");
  /**
   * Park the pointer elsewhere first.
   *
   * `hover()` is a mouse *move*, so calling it when the pointer is already on the
   * target emits nothing and the card never gets a fresh `mouseenter`. Without the
   * reset the second call is a silent no-op — which is exactly how this passed
   * alone and failed on a repeat run.
   */
  const openModelCard = async () => {
    await page.mouse.move(0, 0);
    await info.hover();
    await expect(modelCard).toBeVisible();
  };

  await expect(info).toBeVisible();
  await expect(page.getByText(/synced dialogue/i)).toHaveCount(0);
  await openModelCard();
  await expect(modelCard).toContainText(/synced dialogue/i);

  // One Edit governs both halves at once, and unlocks every pill.
  await brief.getByRole("button", { name: "Edit" }).click();
  const save = brief.getByRole("button", { name: "Save revision" });
  // Nothing changed yet, so there is no revision to make.
  await expect(save).toBeDisabled();
  for (const label of [/^Model:/, /^Platform:/, /^Resolution:/]) {
    await expect(brief.getByRole("button", { name: label })).toBeEnabled();
  }

  await page.getByLabel("Story text").fill("A much shorter story.");
  // The pills are menus now, not selects — pick from the one that opens.
  await brief.getByRole("button", { name: /^Model:/ }).click();
  await page.getByRole("menuitemradio", { name: "Seedance" }).click();
  await expect(brief.locator("[data-slot=setting-model]")).toHaveText("Seedance");

  // Resolution is a real setting: changing it alone is enough to make a revision.
  await brief.getByRole("button", { name: /^Resolution:/ }).click();
  await page.getByRole("menuitemradio", { name: "720p" }).click();
  await expect(brief.locator("[data-slot=setting-resolution]")).toHaveText("720p");
  await expect(save).toBeEnabled();
  // The hover card previews the draft model before it is committed.
  await openModelCard();
  await expect(modelCard).toContainText(/No dialogue support/i);

  // Save lands prose and settings together as ONE revision, not two.
  await save.click();
  await expect(revisions).toHaveCount(2);
  await expect(active).toContainText("Revision 2");
  await expect(model).toHaveText("Seedance");
  await expect(storyBody).toHaveText("A much shorter story.");
  await expect(chat.getByText(/revision 2/i)).toBeVisible();

  // Regenerate is gone from the brief — each scene keeps its own.
  await expect(brief.getByRole("button", { name: "Regenerate" })).toHaveCount(0);

  // Oldest first, new revisions appended to the right — and each card carries its
  // settings, so a settings-only revision is not a visual duplicate of its parent.
  await expect(revisions.nth(0)).toContainText("Revision 1");
  await expect(revisions.nth(1)).toContainText("Revision 2");
  await expect(revisions.nth(1)).toContainText("Seedance");

  // Selecting an older revision restores every part of it, because a revision is a
  // snapshot of the whole brief rather than of the prose alone.
  await revisions.nth(0).click();
  await expect(storyBody).not.toHaveText("A much shorter story.");
  await expect(model).toHaveText("Veo3");
  await expect(brief.locator("[data-slot=setting-resolution]")).toHaveText("1080p");
  await expect(revisions.nth(0)).toHaveAttribute("aria-current", "true");

  // ...and forward again, so nothing was discarded on the way back.
  await revisions.nth(1).click();
  await expect(model).toHaveText("Seedance");
  await expect(brief.locator("[data-slot=setting-resolution]")).toHaveText("720p");

  // Inert while an edit is open — switching would silently drop the draft.
  await brief.getByRole("button", { name: "Edit" }).click();
  await expect(revisions.nth(0)).toBeDisabled();
  await brief.getByRole("button", { name: "Cancel" }).click();
  await expect(revisions.nth(0)).toBeEnabled();

  // Screenplay: same page, below the brief card. One tab per beat, one scene on
  // screen at a time.
  const beats = panel.getByRole("tab");
  await expect(beats).toHaveCount(5);
  await expect(beats.nth(0)).toContainText("Hook");
  await expect(beats.nth(4)).toContainText("CTA");

  // Only the open beat's panel is on screen, though all stay mounted.
  const scene = panel.locator("[data-slot=scene-panel]").filter({ visible: true });
  await expect(scene).toHaveCount(1);

  // Scenes are read-only now: no per-scene edit, regenerate, duplicate or delete.
  for (const name of ["Edit", "Regenerate", "Duplicate", "Delete"]) {
    await expect(scene.getByRole("button", { name })).toHaveCount(0);
  }
  // Generating them is a section-level action instead.
  await expect(panel.getByRole("button", { name: "Generate Scenes" })).toBeVisible();

  // Media is its own row under the script: a slot to add more plus two stand-in
  // stills.
  const media = scene.locator("[data-slot=scene-media]");
  await expect(media.getByRole("button", { name: /^Add media/ })).toBeVisible();
  await expect(media.locator("img")).toHaveCount(2);

  /*
   * The script sits in two columns above it, filled downwards.
   *
   * Asserted through geometry rather than DOM order, because `grid-flow-col` is
   * exactly the kind of thing that silently reverts to row-major: Duration and
   * Lighting share a column, Duration and Action share a row.
   */
  const script = await scene.evaluate((el) => {
    const rows = el.lastElementChild!;
    const box = (label: string) => {
      const dt = [...rows.querySelectorAll("dt")].find(
        (d) => d.textContent?.trim() === label,
      )!;
      const r = dt.getBoundingClientRect();
      return { x: Math.round(r.left), y: Math.round(r.top) };
    };
    return {
      duration: box("Duration"),
      lighting: box("Lighting"),
      action: box("Action"),
      transition: box("Transition"),
      mediaTop: Math.round(
        rows.querySelector("[data-slot=scene-media]")!.getBoundingClientRect().top,
      ),
      lightingBottom: Math.round(
        [...rows.querySelectorAll("dt")]
          .find((d) => d.textContent?.trim() === "Lighting")!
          .getBoundingClientRect().bottom,
      ),
    };
  });
  // Column one: Duration above Lighting, same left edge.
  expect(script.duration.x).toBe(script.lighting.x);
  expect(script.duration.y).toBeLessThan(script.lighting.y);
  // Column two starts to its right, back at the top row.
  expect(script.action.x).toBeGreaterThan(script.duration.x);
  expect(script.action.y).toBe(script.duration.y);
  expect(script.transition.x).toBe(script.action.x);
  // ...and the media row is below both columns.
  expect(script.mediaTop).toBeGreaterThan(script.lightingBottom);

  // Switching take changes that scene and no other — the guarantee the screenplay
  // exists to demonstrate, now reachable through the take switcher rather than a
  // Regenerate button. Every beat ships with two takes.
  const visuals = () => panel.locator("[data-slot=scene-visual]").allTextContents();
  const before = await visuals();
  expect(before).toHaveLength(5);

  await scene.getByRole("button", { name: "2 versions" }).click();
  await scene.getByRole("button", { name: /Take 2/ }).click();
  await expect.poll(async () => (await visuals())[0] !== before[0]).toBe(true);
  expect((await visuals()).slice(1)).toEqual(before.slice(1));

  // ...and back, so nothing was discarded.
  await scene.getByRole("button", { name: /Take 1/ }).click();
  await expect.poll(async () => (await visuals())[0]).toBe(before[0]);

  // The arrows step between beats rather than reordering them: a faster way through
  // the tab row than aiming at each tab. They name their destination, and the
  // running order is left alone.
  const order = () => beats.allTextContents();
  const beforeOrder = await order();

  await expect(scene.getByRole("button", { name: "Previous scene" })).toBeDisabled();
  await scene.getByRole("button", { name: "Next scene: Problem" }).click();
  await expect(beats.nth(1)).toHaveAttribute("data-active", "");
  expect(await order()).toEqual(beforeOrder);

  // ...and back the other way, from the beat we just landed on.
  const problem = panel.locator("[data-slot=scene-panel]").filter({ visible: true });
  await problem.getByRole("button", { name: "Previous scene: Hook" }).click();
  await expect(beats.nth(0)).toHaveAttribute("data-active", "");

  // Generate Scenes sits below the screenplay, and nothing is screenable yet — the
  // whole Test Screening section is absent rather than sitting there empty.
  const generateScenes = panel.getByRole("button", { name: "Generate Scenes" });
  const screeningHeading = panel.getByRole("heading", { name: "Test Screening" });
  expect((await generateScenes.boundingBox())!.y).toBeGreaterThan(
    (await scene.boundingBox())!.y,
  );
  await expect(screeningHeading).toHaveCount(0);
  await expect(panel.locator("[data-slot=screening-preview]")).toHaveCount(0);

  // Nor is there a scene picker on the composer yet — there is nothing to list.
  const scenePill = page.getByRole("button", { name: /^Scenes/ });
  await expect(scenePill).toHaveCount(0);

  // Clicking it reveals the section, and the director says so.
  await generateScenes.click();
  await expect(screeningHeading).toBeVisible();
  await expect(chat.getByText(/test screening below/i)).toBeVisible();
  expect((await screeningHeading.boundingBox())!.y).toBeGreaterThan(
    (await generateScenes.boundingBox())!.y,
  );

  // Test Screening: a full-width preview, one card per scene, then the final CTA.
  const preview = panel.locator("[data-slot=screening-preview]");
  const finalCta = panel.getByRole("button", { name: "Generate Final Production" });
  await expect(preview).toBeVisible();
  const takes = panel.locator("[data-slot=take-switcher]");
  await expect(takes).toHaveCount(5);
  await expect(panel.locator("[data-slot=screening-scenes]")).toContainText("Scene 5");

  // Preview and CTA span the section; the scene row is one row, centred inside it.
  const widths = await panel.evaluate(() => {
    const previewEl = document.querySelector("[data-slot=screening-preview]")!;
    const scenes = document.querySelector("[data-slot=screening-scenes]")!;
    // The row hugs its cards (`w-max`), so centring is the slack either side of the
    // row within its scroll container — not within the row itself.
    const strip = scenes.parentElement!.getBoundingClientRect();
    const row = scenes.getBoundingClientRect();
    const cards = [...scenes.children];
    return {
      preview: Math.round(previewEl.getBoundingClientRect().width),
      section: Math.round(previewEl.parentElement!.getBoundingClientRect().width),
      leftGap: Math.round(row.left - strip.left),
      rightGap: Math.round(strip.right - row.right),
      // One row: every card shares a top edge.
      rows: new Set(cards.map((c) => Math.round(c.getBoundingClientRect().top))).size,
    };
  });
  expect(widths.preview).toBe(widths.section);
  expect(widths.rows).toBe(1);
  expect(Math.abs(widths.leftGap - widths.rightGap)).toBeLessThanOrEqual(1);
  expect(Math.round((await finalCta.boundingBox())!.width)).toBe(widths.section);

  // Each card switches take on its own, and the counts differ per scene (2–4).
  const counts = await takes.allTextContents();
  expect(counts).toEqual(["v1/2", "v1/3", "v1/4", "v1/2", "v1/3"]);

  const second = takes.nth(1);
  await expect(second.getByRole("button", { name: /Previous take/ })).toBeDisabled();
  await second.getByRole("button", { name: "Next take of Problem" }).click();
  await expect(second).toContainText("v2/3");
  // Only that card moved.
  expect((await takes.allTextContents()).filter((t) => t.startsWith("v1"))).toHaveLength(
    4,
  );
  // ...and it stops at the end of its own range.
  await second.getByRole("button", { name: "Next take of Problem" }).click();
  await expect(second).toContainText("v3/3");
  await expect(second.getByRole("button", { name: /Next take/ })).toBeDisabled();

  /*
   * Generating scenes also puts the scene picker on the composer.
   *
   * It has to sit on top of the chat box without being overlapped by it, which is why
   * it is in flow above the measured composer reserve rather than positioned over the
   * composer: the reserve grows with the field, so the pill is pushed up with it.
   */
  await expect(scenePill).toBeVisible();
  const pillBox = await scenePill.boundingBox();
  const composerBox = await page.locator("[data-slot=composer-travel]").boundingBox();
  expect(pillBox!.y + pillBox!.height).toBeLessThan(composerBox!.y);
  // Flush with the composer's left edge — the column's padding is the same 1.5rem.
  expect(Math.round(pillBox!.x)).toBe(Math.round(composerBox!.x));

  // Opens upward, because the composer is pinned to the bottom of the screen.
  await scenePill.click();
  const sceneRows = page.locator("[data-slot=scene-picker-list] [role=checkbox]");
  await expect(sceneRows).toHaveCount(5);
  // Polled, not sampled: the panel enters on `slide-in-from-bottom-2`, whose 8px offset
  // exactly cancels the 8px `sideOffset`, so a single read mid-flight finds it sitting
  // on the pill it will clear once the animation settles.
  await expect
    .poll(async () => {
      const box = (await page.locator("[data-slot=popover-content]").boundingBox())!;
      return Math.round(box.y + box.height);
    })
    .toBeLessThan(Math.round(pillBox!.y));

  // Every row names its beat and carries the scene's own length.
  await expect(sceneRows.nth(0)).toContainText("Hook");
  await expect(sceneRows.nth(2)).toContainText("3s");

  // Multiple at once: ticking a second row leaves the first ticked, and the pill
  // carries the count while its accessible name stays "Scenes".
  await sceneRows.nth(0).click();
  await sceneRows.nth(2).click();
  await expect(sceneRows.nth(0)).toHaveAttribute("aria-checked", "true");
  await expect(sceneRows.nth(2)).toHaveAttribute("aria-checked", "true");
  await expect(sceneRows.nth(1)).toHaveAttribute("aria-checked", "false");
  await expect(scenePill).toContainText("2");

  await page.getByRole("button", { name: "Select all" }).click();
  await expect(scenePill).toContainText("5");
  await page.getByRole("button", { name: "Clear" }).click();
  await expect(sceneRows.nth(0)).toHaveAttribute("aria-checked", "false");

  /*
   * A selected scene writes a live card into the foot of the conversation.
   *
   * Live rather than posted: it tracks the current selection instead of appending a
   * message per tick, so it leaves again when the selection is emptied.
   */
  const sceneCards = page.locator("[data-slot=selected-scene]");
  await expect(sceneCards).toHaveCount(0);

  await sceneRows.nth(0).click();
  await sceneRows.nth(2).click();
  await page.keyboard.press("Escape");
  await expect(page.locator("[data-slot=popover-content]")).toHaveCount(0);

  await expect(sceneCards).toHaveCount(2);
  await expect(chat.getByText("2 scenes selected")).toBeVisible();
  // The cards hand back to the composer rather than ending the exchange.
  await expect(chat.getByText("What would you like to edit?")).toBeVisible();
  // Numbered by position in the cut, not in the selection.
  await expect(sceneCards.nth(1)).toHaveAttribute("aria-label", "Scene 3, Solution");
  // In the conversation itself, not in a panel beside it.
  expect(
    await page.evaluate(() =>
      document
        .querySelector("[data-slot=chat-scroller]")!
        .contains(document.querySelector("[data-slot=selected-scene]")),
    ),
  ).toBe(true);

  /*
   * The version buttons drive the same active take the Screenplay tab does, so the
   * card's own duration follows — which is what proves it is switching the take and
   * not just painting a button.
   */
  const hookCard = sceneCards.first();
  await expect(hookCard).toContainText("2s");
  await hookCard.getByRole("button", { name: "Take 2 of scene 1" }).click();
  await expect(
    hookCard.getByRole("button", { name: "Take 2 of scene 1" }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(hookCard).toContainText("1s");

  // Media is real session state: adding and removing here changes the Screenplay
  // tab's row for the same beat, which used to derive its stills and could not.
  const hookMedia = hookCard.locator("[data-slot=selected-scene-media] img");
  await expect(hookMedia).toHaveCount(2);
  await hookCard.getByRole("button", { name: "Add media to scene 1" }).click();
  await expect(hookMedia).toHaveCount(3);
  await expect(
    panel.locator("[data-slot=scene-media]").first().locator("img"),
  ).toHaveCount(3);

  await hookCard.getByRole("button", { name: "Remove reference 1 from scene 1" }).click();
  await expect(hookMedia).toHaveCount(2);
  await expect(
    panel.locator("[data-slot=scene-media]").first().locator("img"),
  ).toHaveCount(2);

  // The selection is session state, so it outlives the panel that set it.
  await page.getByRole("tab", { name: "Asset Library" }).click();
  await page.getByRole("tab", { name: "Production Workspace" }).click();
  await expect(sceneCards).toHaveCount(2);

  // Emptying the selection takes the cards with it.
  await scenePill.click();
  await page.getByRole("button", { name: "Select all" }).click();
  await page.getByRole("button", { name: "Clear" }).click();
  await page.keyboard.press("Escape");
  await expect(sceneCards).toHaveCount(0);

  /*
   * Generate Final Production splits the director column 30/70.
   *
   * The flag lives in the session, which is the only place that can join these two up:
   * the button is in this tab panel, which unmounts on a tab switch, while the card it
   * reveals is in the director column, which does not.
   */
  const split = page.locator("[data-slot=director-split]");
  const productionCard = page.locator("[data-slot=final-production]");
  await expect(split).toHaveCount(0);
  await expect(productionCard).toHaveCount(0);

  await panel.getByRole("button", { name: "Generate Final Production" }).click();
  await expect(productionCard).toBeVisible();
  await expect(chat.getByText(/final production is under way/i)).toBeVisible();

  const ratio = await split.evaluate((el) => {
    const [top, bottom] = [...el.children];
    const total = el.getBoundingClientRect().height;
    return {
      top: +((top.getBoundingClientRect().height / total) * 100).toFixed(1),
      bottom: +((bottom.getBoundingClientRect().height / total) * 100).toFixed(1),
    };
  });
  // Exact, not approximate: a `gap` on the container would come off both panes and
  // land this at 29.6/69, so the spacing lives inside the top pane instead.
  expect(ratio.top).toBe(30);
  expect(ratio.bottom).toBe(70);

  // The chat keeps its composer clearance inside the smaller pane.
  await expect
    .poll(() =>
      page.evaluate(() => {
        // Named, not `reserve.previousElementSibling` — the scene picker now sits
        // between the two, so a sibling walk would measure the pill and pass on a
        // clearance it never checked.
        const scroller = document.querySelector("[data-slot=chat-scroller]")!;
        const composer = document.querySelector("[data-slot=composer-travel]")!;
        return Math.round(
          composer.getBoundingClientRect().top - scroller.getBoundingClientRect().bottom,
        );
      }),
    )
    .toBeGreaterThan(0);

  // ...and the card survives leaving the tab that launched it.
  await page.getByRole("tab", { name: "Asset Library" }).click();
  await expect(productionCard).toBeVisible();

  // The Asset Library is deliberately empty — its UI is being rebuilt.
  await page.getByRole("tab", { name: "Asset Library" }).click();
  await expect(page.getByRole("tab", { name: "Asset Library" })).toHaveAttribute(
    "data-active",
    "",
  );
  await expect(panel).toBeEmpty();

  // Coming back, the screening is still revealed: that flag lives in the session, so
  // it survives the panel unmounting on a tab switch.
  await page.getByRole("tab", { name: "Production Workspace" }).click();
  await expect(screeningHeading).toBeVisible();
});

test("Escape closes a workspace popup before it closes the screen", async ({ page }) => {
  // The composer no longer has popups of its own, but the brief's settings pills do —
  // on this same route. Escape is bound to dismissing it, so a popup swallowing the
  // key first is the difference between closing a menu and losing the whole screen.
  await page.goto("/new?prompt=A%20neon-lit%20Tokyo%20alley");
  await completeIntake(page);
  const brief = page.getByRole("tabpanel").first().locator("[data-slot=brief-card]");
  await brief.getByRole("button", { name: "Edit" }).click();

  const seedance = page.getByRole("menuitemradio", { name: "Seedance" });
  await openPanel(brief.getByRole("button", { name: /^Model:/ }), seedance);

  await page.keyboard.press("Escape");
  await expect(seedance).toBeHidden();
  await expect(page).toHaveURL(/\/new\?/);

  // With nothing open, Escape leaves.
  await page.keyboard.press("Escape");
  await expect(page).not.toHaveURL(/\/new/);
});

test("templates page paginates a mixed-orientation grid", async ({ page }) => {
  await page.goto("/templates");

  await expect(page.getByLabel("Search templates")).toBeVisible();

  const cards = page.locator("[data-slot=template-card]");
  const orientations = () =>
    cards.evaluateAll((els) => {
      const of = (o: string) => els.filter((e) => e.dataset.orientation === o).length;
      return { total: els.length, landscape: of("landscape"), portrait: of("portrait") };
    });

  await expect(cards).toHaveCount(15);
  expect(await orientations()).toEqual({ total: 15, landscape: 5, portrait: 10 });

  /*
   * The shapes come from the grid, not from a class on the card, so assert them.
   * Landscape spans two columns and one row, portrait one column and two rows over
   * square tracks — the gutter inside a two-track span puts the measured ratio a
   * couple of percent past 2 and 0.5, which is why these are ranges.
   */
  const ratios = await cards.evaluateAll((els) =>
    els.map((e) => {
      const r = e.getBoundingClientRect();
      return { o: e.dataset.orientation, ratio: r.width / r.height };
    }),
  );
  for (const { o, ratio } of ratios) {
    if (o === "landscape") expect(ratio).toBeGreaterThan(1.9);
    else expect(ratio).toBeLessThan(0.55);
  }

  // Pagination is real links writing `?page=`, so it works without hydration.
  const pager = page.getByRole("navigation", { name: "Template pages" });
  await expect(pager.getByRole("link", { name: "Previous page" })).toHaveCount(0);

  await pager.getByRole("link", { name: "3", exact: true }).click();
  await expect(page).toHaveURL(/\?page=3$/);
  await expect(cards).toHaveCount(15);
  // Every page carries the same mix, not just the first.
  expect(await orientations()).toEqual({ total: 15, landscape: 5, portrait: 10 });
  await expect(pager.locator("[aria-current=page]")).toHaveText("3");
  // No "next" past the end — rendered as a span, so there is nothing to click.
  await expect(pager.getByRole("link", { name: "Next page" })).toHaveCount(0);

  // Out-of-range and junk clamp instead of serving an empty grid.
  for (const [query, expected] of [
    ["?page=99", "3"],
    ["?page=0", "1"],
    ["?page=abc", "1"],
  ] as const) {
    await page.goto(`/templates${query}`);
    await expect(pager.locator("[aria-current=page]")).toHaveText(expected);
    await expect(cards).toHaveCount(15);
  }
});

test("projects page renders both sections from the data layer", async ({ page }) => {
  await page.goto("/projects");

  // Scoped to the main landmark: the sidebar has its own "New Video" button,
  // and Playwright's name matching is case-insensitive.
  const main = page.getByRole("main");

  await expect(page.getByText(/what you have created so far/i)).toBeVisible();
  await expect(page.getByRole("searchbox", { name: /search projects/i })).toBeVisible();
  await expect(main.getByRole("button", { name: "New folder" })).toBeVisible();
  await expect(main.getByRole("link", { name: "New video" })).toBeVisible();

  // Counts come from `src/data/projects.ts`, so this catches a data-layer swap
  // that silently returns the wrong slice.
  const recents = page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: "Recents" }) });
  await expect(recents.getByRole("article")).toHaveCount(3);

  const all = page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: "All" }) });
  await expect(all.getByRole("article")).toHaveCount(10);

  // Each card carries its label underneath.
  await expect(all.getByText("Neon alley chase")).toBeVisible();
});

test("project cards expose edit, preview and download on hover", async ({ page }) => {
  await page.goto("/projects");

  const recents = page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: "Recents" }) });

  const ready = recents.getByRole("article").filter({ hasText: "Neon alley chase" });
  await ready.hover();
  for (const name of ["Edit", "Preview", "Download"]) {
    await expect(ready.getByRole("button", { name })).toBeVisible();
  }

  // A render that has not landed has nothing to play or save.
  const processing = recents
    .getByRole("article")
    .filter({ hasText: "Black sand aerial" });
  await processing.hover();
  await expect(processing.getByRole("button", { name: /^Edit/ })).toBeEnabled();
  await expect(processing.getByRole("button", { name: /^Preview/ })).toBeDisabled();
  await expect(processing.getByRole("button", { name: /^Download/ })).toBeDisabled();

  // Controls stay reachable without a pointer: they are focusable while the
  // overlay is transparent, and focusing one reveals the set.
  await ready.getByRole("button", { name: "Edit" }).focus();
  await expect(ready.getByRole("button", { name: "Edit" })).toBeFocused();
});

test("settings shows the profile, credits and every connection", async ({ page }) => {
  await page.goto("/settings");

  // Profile: identity from the shared placeholder, so this and the home greeting
  // cannot disagree about who is signed in.
  await expect(page.getByRole("heading", { name: "Shivansh Modawal" })).toBeVisible();
  await expect(page.getByText("shivansh@i2ltech.com").first()).toBeVisible();
  await expect(page.locator("[data-slot=plan-badge]")).toContainText("Studio");

  // The four fields are a description list, so each label owns its value.
  const fields = page.locator("dl div");
  await expect(fields).toHaveCount(4);
  for (const label of ["Display name", "Phone", "Email", "Member since"]) {
    await expect(page.getByText(label, { exact: true })).toBeVisible();
  }

  // No photo exists yet, so the avatar must fall through to initials rather than
  // rendering a broken image.
  const avatar = page.locator("[data-slot=avatar]");
  await expect(avatar).toContainText("SM");
  await expect(avatar.locator("img")).toHaveCount(0);

  /*
   * Credits: the meter has to be a real progressbar.
   *
   * Without the role the fill is the only place the proportion is stated, and a
   * screen reader gets the two numbers and nothing about how full the bar is.
   */
  const meter = page.locator("[data-slot=credit-meter]");
  await expect(meter).toHaveAttribute("aria-valuenow", "1240");
  await expect(meter).toHaveAttribute("aria-valuemax", "2000");
  await expect(meter).toHaveAttribute(
    "aria-valuetext",
    "1,240 of 2,000 credits remaining",
  );
  // The arc tracks the numbers rather than being a hardcoded sweep. Asserted as the
  // swept *fraction* rather than a raw dash offset, so retuning the ring's radius does
  // not turn this into a magic-number test.
  const swept = await meter.evaluate((el) => {
    const arc = el.querySelectorAll("circle")[1];
    const total = Number(arc.getAttribute("stroke-dasharray"));
    const offset = Number(arc.getAttribute("stroke-dashoffset"));
    return (total - offset) / total;
  });
  expect(swept).toBeCloseTo(1240 / 2000, 2);

  // Connections: all three providers, whether linked or not — an unlinked one is an
  // offer, so filtering it out would leave the section looking complete when nothing
  // is connected.
  const rows = page.locator("[data-slot=account-tile]");
  await expect(rows).toHaveCount(3);
  for (const name of ["YouTube", "Instagram", "TikTok"]) {
    await expect(rows.filter({ hasText: name })).toHaveCount(1);
  }

  // The linked row shows its handle and offers to unlink; the others offer to link.
  const youtube = rows.filter({ hasText: "YouTube" });
  await expect(youtube.locator("[data-slot=connected-badge]")).toBeVisible();
  await expect(youtube).toContainText("@shivansh");
  await expect(youtube.getByRole("button", { name: "Disconnect" })).toBeVisible();
  // `exact`, because the accessible-name match is a substring one and "Disconnect"
  // contains "Connect" — without it this found all three rows and passed for the
  // wrong reason.
  await expect(page.getByRole("button", { name: "Connect", exact: true })).toHaveCount(2);
  // ...and only the linked one, so a handle can never show on an unlinked row.
  await expect(page.locator("[data-slot=connected-badge]")).toHaveCount(1);

  // Every control here is inert, and says so rather than looking broken.
  //
  // `exact` throughout: accessible-name matching is a case-insensitive substring, so
  // "Edit" also matches "Buy cr-edit-s" and "Connect" also matches "Disconnect". Both
  // bit here — one as a strict-mode violation, one as a count of 3 where 2 was right.
  for (const name of ["Edit", "Buy credits", "Disconnect"]) {
    await expect(page.getByRole("button", { name, exact: true })).toHaveAttribute(
      "title",
      /not wired/,
    );
  }
});

test("health endpoint reports ok", async ({ request }) => {
  const response = await request.get("/api/health");

  expect(response.status()).toBe(200);
  expect(await response.json()).toMatchObject({ ok: true, data: { status: "ok" } });
});

test("unknown routes render the 404 page", async ({ page }) => {
  const response = await page.goto("/this-route-does-not-exist");

  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: /page not found/i })).toBeVisible();
});
