/**
 * Plugin template — TypeScript is the recommended authoring path.
 *
 * `bun run build` bundles this file to `main.js`, which is what ships; type
 * imports are erased at build time, so the plugin stays dependency-free.
 */
import type { PluginContext, PluginModule } from "../../types/plugin-api";

const plugin: PluginModule = {
  activate(ctx: PluginContext) {
    ctx.ui.registerCommand({
      id: "hello",
      title: "My Plugin: hello",
      run: () => ({ toast: `Hello from ${ctx.manifest.name}!` }),
    });
  },
};

export default plugin;
