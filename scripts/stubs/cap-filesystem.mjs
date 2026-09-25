export const calls = { written: null, shared: null };

export const Filesystem = {
  writeFile: async (opts) => {
    calls.written = opts;
    return { uri: 'file:///data/user/0/com.solarquote.ng/cache/' + opts.path };
  }
};
export const Directory = { Cache: 'CACHE' };
export const Encoding = { Base64: 'base64' };
