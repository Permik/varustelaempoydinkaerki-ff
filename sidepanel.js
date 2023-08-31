const label = () => document.createElement("label")
const input = () => document.createElement("input")

const setId = (object, id) => Object.assign(object, {id: id});
const setFor = (object, htmlFor) => Object.assign(object, {htmlFor: htmlFor});
const setValue = (object, value) => Object.assign(object, {value: value});

const setIdValue = (object, id, value) => setValue(setId(object,id),value)

const nameRowLabel = (x) => [setFor(label(), x), setId(input(), x)]
const nameRow = (x) => [setId(input(), x)]
const nameRowWithId = (x) => [setId(input(), x)]
const nameRowWithIdValue = (id, value) => [setValue(setId(input(), id), value)]

const getCurrentTab = async () => {
    let queryOptions = { active: true, lastFocusedWindow: true };
    // `tab` will either be a `tabs.Tab` instance or `undefined`.
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab;
}

const setChildTextNode = (elementId, text) => {
    document.getElementById(elementId).innerText = text;
}

const getUiString = (stringId) => chrome.i18n.getMessage(stringId)
const setDomString = (elementId, stringId) => setChildTextNode(elementId, getUiString(stringId))
const setSidepanelDomString = (combinedId) => setDomString(combinedId, "sidepanel_"+combinedId)

// ---- UI INIT ----

// Implicitly gets the current locale injected by the web browser
const initUi = () => {
    setSidepanelDomString("title")
    setSidepanelDomString("subtitle")
    setSidepanelDomString("item0")
    setSidepanelDomString("item1")
    setSidepanelDomString("item2")
    setSidepanelDomString("item3")
    setSidepanelDomString("item4")
    setSidepanelDomString("legend")
    setSidepanelDomString("save")
    setSidepanelDomString("paste")
    setSidepanelDomString("clear")
    setSidepanelDomString("launch")
}

// ---- DESTINATION DOM MANIP ----

const addNamesToCart = (names) => {
    let input = document.getElementById("nametags_input_field")
    let btn = document.getElementById("buy_button_red")
    names.forEach((name, index) => {
        setTimeout(
            () => {
                input.value = name
                btn.click()
            },
            index * 500
        )
    })
}

// ---- DOM STATE MANIP ----

const clearDOM = () => {
    document.getElementById("list").replaceChildren()
}

const updateDOM = (names) => {
    var names = names;
    
    if(names == undefined) names = [""];

    names.forEach((element, index) => {
        document.getElementById("list").append(
            ...nameRowWithIdValue("nameRow"+index, element)
        )
    });
}

// ---- STATE SETTING, FETCHING ----

/**
 * Gets collects all input elements that reside in 
 * an element that has an id of "list"
 * and returns the values of the input elements as an array of strings
 * @returns {string[]}
 */
const collectNames = () => {
    let inputs = document.getElementById("list").querySelectorAll("input")
    let names = []
    inputs.forEach(element => {
        names.push(element.value)
    });
    return names
}


const persistNames = (names, callback) => {
    chrome.storage.local.set({ nimet: names }).then(() => callback());
}

// the returns the promise to the upcoming names
const getPersistedNames = async () => {
    return chrome.storage.local.get(["nimet"])
}

// the returns the promise to the upcoming names
const getPersistedNamesUnwrap = async () => {
    return getPersistedNames().then((persistedObject) =>{
        return persistedObject.nimet
    })
}

// ---- DATA MANIP ----

// /[^a-zA-ZåöäÅÖÄ0-9\-\+\ ]/gm
// /[^a-zA-Z]/gm
// Seems not to declare correctly in d.ts

/**
 * Copies and returns an array of normalized strings that'll go through the validity check in Varusteleka.
 * @param {string[]} nameList 
 * @returns {string[]}
 */
const normalizeNames = (nameList) => {
    console.log(nameList)
    // make sure empties are discarded
    var newList = nameList.filter(word => word != "")
    newList = newList.map(text =>{
        console.log(text)
        // first take extra whitespace away to be user friendly as possible
        var mutText = text.trim()
        // then take invalid characters
        mutText = mutText.replace(/[^a-zåöä0-9\-\+\ ]/gim, "")
        // then _lastly_ enforce the character limit, bc this is the filtered subset of allowed characters
        mutText = mutText.substring(0, 15)
        // We've been hard at work, now uppercase it.
        mutText = mutText.toUpperCase()
        return mutText
    })

    console.log("before")
    console.log(newList)
    // if for some reason the filtering has left us with empty strings, discard them
    newList = newList.filter(word => word != "")
    console.log("after")
    console.log(newList)
    return newList
}
// EVENT REGISTRATION

window.addEventListener("DOMContentLoaded", (event) => {

    //init UI-text
    initUi()

    getPersistedNamesUnwrap().then((names) => {
        console.log("Value currently is " + JSON.stringify(names));

        updateDOM(names)

        console.log("Value currently is " + names);
    });
});

document.getElementById("clear").addEventListener("click", (event) => {
    let normalizedNames = [""]
    clearDOM()
    updateDOM(normalizedNames)
    persistNames(normalizedNames, (x) => {console.log(x)})
});

document.getElementById("save").addEventListener("click", (event) => {
    let names = collectNames()
    console.log(names)
    let normalizedNames = normalizeNames(names);
    console.log(normalizedNames)
    //UGLY DIRTY ARRAY MANIP
    normalizedNames.push("")

    clearDOM()
    updateDOM(normalizedNames)

    persistNames(normalizedNames, (x) => {console.log(x)})
});

document.getElementById("launch").addEventListener("click", async (event) => {

    let result = await browser.permissions.request({origins:["https://www.varusteleka.fi/fi/product/sarma-tst-m05-nimilappu-omalla-tekstilla-3-pack/35030", "https://www.varusteleka.com/en/product/sarma-tst-m05-name-tag-w-custom-text-3-pack/35030"]})
    if (result) {
        Promise.all([getCurrentTab(),getPersistedNamesUnwrap()]).then(
            ([tab, names]) => {
                chrome.scripting
                .executeScript({
                target : {tabId : tab.id},
                func : addNamesToCart,
                args : [ names ],
                })
            }
        )
    } else{
        // we could show an error here if denied
    }



});


document.getElementById("paste").addEventListener("click", async (event) => {

    let result = await browser.permissions.request({permissions:["clipboardRead"]})
    if (result) {
        let names = collectNames();
        let normalizedNames = normalizeNames(names);

        let clipboard = await navigator.clipboard.readText();
        let clipboardNameArray = clipboard.split("\n");
        let normalizedClipboardNames = normalizeNames(clipboardNameArray);

        let combinedNames = normalizedNames.concat(normalizedClipboardNames);
        combinedNames.push("")

        clearDOM()
        updateDOM(combinedNames)

        persistNames(combinedNames, (x) => {console.log(x)})
    } else{
        // we could show an error here if denied
    }
});