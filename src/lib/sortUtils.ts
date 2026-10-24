/**
 * Natural sort comparison for filenames.
 * Properly sorts numbers within strings:
 * e.g., ["page1.png", "page2.png", "page10.png"] instead of ["page1.png", "page10.png", "page2.png"]
 */
export function naturalCompare(a: string, b: string): number {
  return a.localeCompare(b, undefined, {
    numeric: true,
    sensitivity: 'base',
  });
}

/**
 * Sorts an array of File objects naturally by their name
 */
export function sortFilesNaturally(files: File[]): File[] {
  return [...files].sort((a, b) => naturalCompare(a.name, b.name));
}
