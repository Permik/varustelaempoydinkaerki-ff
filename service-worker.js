
const VARUSTELEKA_ORIGIN = 'https://www.varusteleka.fi';
const VARUSTELEKA_ORIGIN_EN = 'https://www.varusteleka.com';
const VARUSTELEKA_PATH = '/fi/product/sarma-tst-m05-nimilappu-omalla-tekstilla-3-pack/35030';
const VARUSTELEKA_PATH_EN = '/en/product/sarma-tst-m05-name-tag-w-custom-text-3-pack/35030';
// https://www.varusteleka.fi/fi/product/sarma-tst-m05-nimilappu-omalla-tekstilla-3-pack/35030
const VARUSTELEKA_URL = new URL(VARUSTELEKA_PATH, VARUSTELEKA_ORIGIN);
// https://www.varusteleka.com/en/product/sarma-tst-m05-name-tag-w-custom-text-3-pack/35030
const VARUSTELEKA_URL_EN = new URL(VARUSTELEKA_PATH_EN ,VARUSTELEKA_ORIGIN_EN);

const sidepanel = browser.runtime.getURL("/sidepanel.html");
const popup = browser.runtime.getURL("/popup.html");

/**
 * Returns a URL object what's stripped from achors and parameters
 * @param {URL} urlObject 
 * @returns {URL}
 */
const getStrippedURL = (urlObject) => {
  return new URL(urlObject.origin + urlObject.pathname)
}

/**
 * 
 * @param {URL} urlObject 
 * @param {URL} urlObject0 
 * @returns {boolean}
 */
const compareStrippedURL = (urlObject, urlObject0) => {
  const result = (urlObject.origin + urlObject.pathname) == (urlObject0.origin + urlObject0.pathname);
  return result;
}

/* chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error)); */

browser.action.onClicked.addListener((tab) => {
  browser.sidebarAction.open()
})

/**
 * 
 * @param {Object} activeInfo 
 * @param {number} activeInfo.previousTabId
 * @param {number} activeInfo.tabId
 * @param {number} activeInfo.windowId
 */
const onActiveListener = async (activeInfo) => {
  const tab = await browser.tabs.get(activeInfo.tabId)
  if (!tab.url) return;
  const url = new URL(tab.url);

  // Behavior essentially shared with onUpdated here. Try to abstract out.
  if (compareStrippedURL(url, VARUSTELEKA_URL) || compareStrippedURL(url, VARUSTELEKA_URL_EN)) {
    console.log("At Varusteleka");

    //Sets the sidebar panel to the namelist
    await browser.sidebarAction.setPanel({ panel: sidepanel });

    // Sets the popup to nothing
    // Enables the action button to open the sidepanel
    await browser.action.setPopup({ popup: null });


  } else {
    // Sets the popup that directs user to Varusteleka
    // if origin is other than Varusteleka.
    await browser.sidebarAction.setPanel({ panel: popup });

    // Sets the extension action to open a popup that'll direct the user to buy Varusteleka name tags
    await browser.action.setPopup({ popup: popup, tabId: tabId })

    // Disables the side panel on all other sites
    await browser.sidePanel.setOptions({
      tabId,
      enabled: false
    });

  }

}

browser.tabs.onActivated.addListener(onActiveListener);


browser.tabs.onUpdated.addListener(async (tabId, info, tab) => {
  if (!tab.url) return;
  const url = new URL(tab.url);

  console.log(compareStrippedURL(url, VARUSTELEKA_URL_EN));

  // Try to abstract out the behavior here. It's shared with onActiveListener
  if (compareStrippedURL(url, VARUSTELEKA_URL) || compareStrippedURL(url, VARUSTELEKA_URL_EN)) {
    console.log("At Varusteleka");

    await browser.sidebarAction.setPanel({ panel: sidepanel });

    await browser.action.setPopup({ popup: null });

  } else {
    // Disables the action button opening the sidepanel
    await browser.sidebarAction.setPanel({ panel: popup });

    // Sets the extension action to open a popup that'll direct the user to buy Varusteleka name tags
    await browser.action.setPopup({ popup: popup, tabId: tabId })

    // Disables the side panel on all other sites
    await browser.sidePanel.setOptions({
      tabId,
      enabled: false
    });
    
    console.log("disable")
  }
});