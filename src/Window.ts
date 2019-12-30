/**
 * @file Window.ts
 * @description Window interface for extending global variables in the browser.
 * @author Syeerus
 * @license MIT
 */


interface bz2 {
    decompress(data: Uint8Array, test?: boolean): Uint8Array;
}

interface Window {
    bz2: bz2;
}
