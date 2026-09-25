import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

/**
 * Returns true when running inside the native Android/iOS shell (Capacitor WebView).
 * In this environment the HTML5 `download` attribute on a blob URL is a silent
 * no-op: Android's WebView never fires a DownloadListener for `blob:` hrefs, so
 * jsPDF's `doc.save()` completes without error and without producing a file.
 */
export function isNativePlatform() {
  try {
    return Capacitor.isNativePlatform();
  } catch (e) {
    return false;
  }
}

/**
 * Strips characters that break filenames on Android's external storage.
 * Dots are removed too, so a crafted name can never create a hidden file or
 * traverse a directory. The `.pdf` extension is appended by the caller.
 */
export function safeFileName(name) {
  const cleaned = String(name)
    .replace(/[^A-Za-z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80);
  return cleaned || 'SolarQuote';
}

/**
 * Exports a jsPDF document across web and native.
 *
 * Web    -> blob download through an object URL (normal browser behaviour).
 * Native -> write base64 straight to the device filesystem, then hand the file
 *           to the Android share sheet (WhatsApp / Drive / Files / Email),
 *           which is how an installer actually sends a quote to a client.
 *
 * @param {import('jspdf').jsPDF} doc
 * @param {string} fileName
 * @returns {Promise<{method:'share'|'download'|'saved', uri?:string}>}
 */
export async function exportPDF(doc, fileName) {
  const name = `${safeFileName(fileName)}.pdf`;

  if (!isNativePlatform()) {
    doc.save(name);
    return { method: 'download' };
  }

  // `datauristring` embeds a filename in the prefix, so split on the first
  // comma only. Base64 output itself never contains a comma.
  const dataUri = doc.output('datauristring');
  const base64 = dataUri.slice(dataUri.indexOf(',') + 1);

  // Cache is shareable by default on Android and is cleaned up by the OS.
  const written = await Filesystem.writeFile({
    path: name,
    data: base64,
    directory: Directory.Cache,
    encoding: Encoding.Base64
  });

  try {
    await Share.share({
      title: 'SolarQuote NG Quotation',
      text: 'Your solar quotation and Bill of Quantities is attached.',
      files: [written.uri],
      dialogTitle: 'Send quotation to client'
    });
    return { method: 'share', uri: written.uri };
  } catch (e) {
    // User dismissed the share sheet. The file is still in app cache, so this
    // is a success with a different outcome, not a failure.
    return { method: 'saved', uri: written.uri };
  }
}
