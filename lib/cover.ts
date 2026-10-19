/** sessionStorage flag: the cover has been seen in this visit. */
export const COVER_SEEN = "cover-seen";

/**
 * Runs before the page paints: a visitor who already passed the cover in this
 * tab, or who arrives on a deep link (#work/…), goes straight to the canvas.
 */
export const coverScript = `try{if(location.hash||sessionStorage.getItem("${COVER_SEEN}"))document.documentElement.dataset.cover="skip"}catch(e){}`;
