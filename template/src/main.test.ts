/**
 * Plugins are plain modules: test them with `bun test` against a minimal fake
 * context that records what `activate()` registers. Only stub what the code
 * under test touches.
 */
import { afterEach, expect, test } from "bun:test";
import plugin from "./main";

type Registered = { id: string; run: (...args: any[]) => any; defaultShortcut?: unknown };

function activate(settings: Record<string, unknown> = {}) {
  const commands: Registered[] = [];
  plugin.activate({
    manifest: { name: "My Plugin" },
    services: { storage: { get: (key: string) => (key === "settings" ? settings : undefined) } },
    domains: { library: { queries: { books: { list: async () => [] } } }, reading: { commands: { openBook() {} } } },
    contributions: {
      commands: { register: (command: Registered) => commands.push(command) },
      selectionActions: { register() {} },
      headerActions: { register() {} },
    },
  } as any);
  return { commands };
}

afterEach(() => plugin.deactivate?.());

test("the hello command greets with the configured greeting", async () => {
  const { commands } = activate({ greeting: "Hi" });
  const hello = commands.find((command) => command.id === "hello")!;
  expect(hello.defaultShortcut).toEqual({ key: "h", mod: true, alt: true });
  expect(await hello.run()).toEqual({ toast: "Hi from My Plugin!" });
});
