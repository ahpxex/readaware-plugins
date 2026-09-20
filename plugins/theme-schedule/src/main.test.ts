import { afterEach, expect, test } from "bun:test";
import plugin from "./main";

function setup(enabled = true) {
  const values = new Map<string, unknown>([["settings", { enabled }]]);
  const callbacks: Record<string, (...args: any[]) => any> = {};
  const writes: Array<() => void> = [];
  const storage = {
    get: (key: string) => values.get(key),
    set: (key: string, value: unknown) => new Promise<void>((resolve, reject) => {
      callbacks.reject = reject;
      writes.push(() => { values.set(key, value); resolve(); });
    }),
    remove: (key: string) => new Promise<void>((resolve) => {
      writes.push(() => { values.delete(key); resolve(); });
    }),
    onChange: (handler: (...args: any[]) => any) => { callbacks.change = handler; },
  };
  plugin.activate({
    locale: "en", services: { storage, ui: { showToast() {} }, schedules: { bind(_id: string, handler: (...args: any[]) => any) { callbacks.tick = handler; } } },
    domains: { settings: { commands: { update: async () => {} } } },
    contributions: { settingsOptions: { register() {} }, commands: { register(command: { run: (...args: any[]) => any }) { callbacks.command = command.run; } } },
  } as any);
  return { callbacks, writes };
}

afterEach(() => plugin.deactivate?.());

test("schedule completes only after its applied mark is durable", async () => {
  const { callbacks, writes } = setup();
  let settled = false;
  const result = callbacks.tick().then(() => { settled = true; });
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(writes).toHaveLength(1);
  expect(settled).toBe(false);
  writes[0]!();
  await result;
  expect(settled).toBe(true);
});

test("a failed durable mark rejects the scheduled execution", async () => {
  const { callbacks } = setup();
  const result = callbacks.tick();
  const failure = result.catch((error: Error) => error);
  await new Promise((resolve) => setTimeout(resolve, 0));
  callbacks.reject(new Error("disk unavailable"));
  expect((await failure).message).toBe("disk unavailable");
});

test("settings delivery stays pending until disabling clears the mark", async () => {
  const { callbacks, writes } = setup(false);
  let settled = false;
  const result = callbacks.change().then(() => { settled = true; });
  await Promise.resolve();
  expect(writes).toHaveLength(1);
  expect(settled).toBe(false);
  writes[0]!();
  await result;
  expect(settled).toBe(true);
});
