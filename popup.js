

const setChildTextNode = (elementId, text) => {
    document.getElementById(elementId).innerText = text;
}
const setAttributeNode = (elementId, elementAttribute, text) => {
    document.getElementById(elementId)[elementAttribute] = text;
}

const getUiString = (stringId) => chrome.i18n.getMessage(stringId)
const setDomString = (elementId, stringId) => setChildTextNode(elementId, getUiString(stringId))
const setDomAttributeString = (elementId, elementAttribute, stringId) => setAttributeNode(elementId, elementAttribute, getUiString(stringId))
const setPopupDomString = (combinedId) => setDomString(combinedId, "popup_"+combinedId)



const getDestinationURL = () => getUiString("popup_go_url")

// We have to fake the link as anchor elements don't work in popups
document.getElementById("go").addEventListener("click", (event) => {
    event.preventDefault();
    chrome.tabs.create(
        {url: getDestinationURL()}
    )
});


// ---- UI INIT ----

// Implicitly gets the current locale injected by the web browser
const initUi = () => {
    setPopupDomString("title")
    setPopupDomString("go")
    setDomAttributeString("go", "title", "popup_go_title")
    setDomAttributeString("go", "href", "popup_go_url")
}

window.addEventListener("DOMContentLoaded", (event) => {

    //init UI-text
    initUi()
});

//https://www.varusteleka.fi/fi/product/sarma-tst-m05-nimilappu-omalla-tekstilla-3-pack/35030
//https://www.varusteleka.com/en/product/sarma-tst-m05-name-tag-w-custom-text-3-pack/35030