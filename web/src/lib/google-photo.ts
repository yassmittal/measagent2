/**
 * Google serves profile photos at the size asked for in the URL. The stored
 * URL asks for 96px, which blurs anywhere a portrait is shown large.
 */
export function toLargeGooglePhotoUrl(pictureUrl: string): string {
  return pictureUrl.replace(/=s\d+-c$/, '=s512-c');
}
