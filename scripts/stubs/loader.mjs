// Maps the Capacitor plugin specifiers to local stubs so the native branch of
// exportPDF can be exercised in Node, where no native bridge exists.
const map = {
  '@capacitor/core': new URL('./cap-core.mjs', import.meta.url).href,
  '@capacitor/filesystem': new URL('./cap-filesystem.mjs', import.meta.url).href,
  '@capacitor/share': new URL('./cap-share.mjs', import.meta.url).href
};

export async function resolve(specifier, context, next) {
  if (map[specifier]) {
    return { url: map[specifier], shortCircuit: true };
  }
  return next(specifier, context);
}
