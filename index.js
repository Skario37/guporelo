window.addEventListener("DOMContentLoaded", __main__);
let contentElement = null,
    guessElement = null,
    imgElement = null,
    mapElement = null, 
    areaElement = null,
    locationsElement = null,
    watermark = null;
let saving = false;
let locationSelected = false;
let zoomLevel = false;
let lastMarginLeft = "";

function __main__() {
    if (!window.fetch) return alert("Your browser doesn't support fetch.");
    zoomLevel = window.devicePixelRatio;
    // window.localStorage.clear();

    contentElement = document.getElementById("content");
    guessElement = document.getElementById("guess");
    locationsElement = document.getElementById("locations");
    watermark = document.getElementById("watermark");

    imgElement = createImageElement("map.jpg");
    imgElement.onload = imgLoaded;

    guessElement.appendChild(imgElement);

    startTuto();
}

function imgLoaded() {
    imgElement.width -= window.innerWidth - document.documentElement.clientWidth;
    guessElement.style.width = this.clientWidth + "px";
    guessElement.style.height = this.clientHeight + "px";
    mapElement = createMapElement(this.clientWidth, this.clientHeight);
    areaElement = createAreaElement(this.clientWidth, this.clientHeight);
    
    mapElement.appendChild(areaElement);
    guessElement.appendChild(mapElement);

    locationsElement.style.width = this.clientWidth + "px";
    lastMarginLeft = guessElement.getBoundingClientRect().left;
    addLocations(this.clientWidth, this.clientHeight);
}

/**
 * Create and return the map element
 * @return {Element}
 */
function createMapElement(width, height) {
    const map = document.createElement("map");
    map.id = "map";
    map.classList.add("map");
    map.name = "map";
    map.width = width + "px";
    map.height = height + "px";
    return map;
}

/**
 * 
 */
function createImageElement(url) {
    const img = new Image();
    img.useMap = "#map";
    img.src = url;
    img.id = "map";
    img.classList.add("map");
    img.width = document.body.clientWidth;
    return img;
}

/**
 * 
 */
function createAreaElement(width, height) {
    const area = document.createElement("area");
    area.shape = "rect";
    area.coords = `0,0,${width},${height}`;
    return area;
}

/**
 * 
 */
function addLocations(width, height) {
    fetch("locations/conf.json")
        .then(r => r.json())
        .then(d => {
            for (let i = 0; i < d.locations.icons.length; i++) {
                const img = new Image();
                img.src = "locations/" + d.locations.icons[i];
                img.setAttribute("data-src", "locations/" + d.locations.images[i])
                img.width = width / 10;
                img.height = height / 10;
                img.id = "loc_" + i;
                img.classList.add("locations");

                const cursorElement = document.createElement("span");
                cursorElement.classList.add("cursors");
                cursorElement.id = "cur_" + i;
                cursorElement.innerText = (i + 1) + "→";
                cursorElement.style.fontSize = width / 30 + "px";
                img.addEventListener("mouseup", (eimg) => {
                    if (saving) return;
                    eimg.stopImmediatePropagation();
                    eimg.stopPropagation();
                    if (eimg.button === 0) { // left
                        if (eimg.target.classList.contains("onuse")) {
                            stopMarking(eimg.target);
                            locationSelected = false;
                        } else {
                            locationSelected = true;
                            const locations = Array.from(locationsElement.children);
                            for (let i = 0; i < locations.length; i++) {
                                locations[i].classList.remove("onuse");
                            }
                            eimg.target.classList.add("onuse");
                            areaElement.classList.add("on");
                            areaElement.onmouseup = (e) => {
                                cursorElement.classList.add("show");
                                const cursRect = cursorElement.getBoundingClientRect();
                                const x = Math.round(e.pageX - cursRect.width);
                                const y = Math.round(e.pageY - cursRect.height / 2);
                                cursorElement.style.left = x + "px";
                                cursorElement.style.top = y + "px";
                                cursorElement.setAttribute("data-left", x);
                                cursorElement.setAttribute("data-top", y);
                                marking(eimg.target);
                                stopMarking(eimg.target);
                            }
                        }
                    } else if (eimg.button === 2) {
                        window.open(eimg.target.getAttribute('data-src'),'Image');
                    }
                });

                locationsElement.appendChild(img);
                guessElement.appendChild(cursorElement);
            }
        });
}

function stopMarking(e) {
    e.classList.remove("onuse");
    areaElement.classList.remove("on");
    areaElement.onmouseup = null;
    areaElement.onmousemove = null;
}

function marking(e) {
    e.classList.add("marked");
}

function download() {
    if (saving) return;
    saving = true;

    const locations = Array.from(locationsElement.children);
    const ilocs = [];
    for (let i = 0; i < locations.length; i++) {
        if (locations[i].classList.contains("marked")) {
            locations[i].classList.remove("marked");
            ilocs.push(i);
        }
    }

    const cursors = document.getElementsByClassName("cursors");
    const guessOffset = getOffset(guessElement);
    for (let i = 0; i < cursors.length; i++) {
        cursors[i].style.top = (parseInt(cursors[i].style.top.substring(-2)) - guessOffset.top) + "px";
    }
    const imgOffset = getOffset(imgElement);
    watermark.classList.add("show");
    watermark.style.top = imgOffset.top - guessOffset.top + "px";
    const btn = document.getElementById("btn-dl");
    const defInnerText = btn.innerText;
    btn.innerText = "Wait...";

    domtoimage
        .toJpeg(guessElement, { quality: 0.9 })
        .then(d => {
            const link = document.createElement("a");
            link.download = "guess-pokemon-locations.jpeg";
            link.href = d;
            link.click();
            // saveAs(d, "guess-pokemon-locations.png");
            for (const i of ilocs) {
                locations[i].classList.add("marked");
            }
            for (let i = 0; i < cursors.length; i++) {
                cursors[i].style.top = (parseInt(cursors[i].style.top.substring(-2)) + guessOffset.top) + "px";
            }
        })
        .catch(e => {
            alert("oops, something went wrong!", e)
        })
        .finally(() => {
            btn.innerText = defInnerText;
            watermark.classList.remove("show");
            saving = false;
        });
}

function getOffset(el) {
    var _x = 0;
    var _y = 0;
    while(el && !isNaN(el.offsetLeft) && !isNaN(el.offsetTop)) {
        _x += el.offsetLeft - el.scrollLeft;
        _y += el.offsetTop - el.scrollTop;
        el = el.offsetParent;
    }
    return {top: _y, left: _x};
}

function startTuto() {
    if (window.localStorage.getItem("tutoFinish") === "yes") return;
    const m = document.getElementById("modal");
    m.classList.add("show");

    const m_title = document.getElementById("modal_title");
    const m_btn = document.getElementById("modal_btn_next");
    m_title.nextSibling;
    tutoStep1(m_title, m_btn);
}

function tutoStep1(t, b) {
    t.children[0].innerText = "Hello!";
    t.children[1].innerText = "Ready to guess locations?";
    t.children[2].innerText = "Images may take time to load.";

    b.onclick = () => tutoStep2(t, b);
    b.innerText = "Let's go!";
}

function tutoStep2(t, b) {
    t.children[0].innerText = "Tutorial";
    t.children[1].innerText = "Click on a location to select it.";
    t.children[2].innerText = "";

    b.onclick = () => {
        if (locationSelected) {
            locationsElement.children[0].classList.remove("tuto-highlight");
            tutoStep3(t, b);
        } else {
            t.children[1].innerText = "Please click on the highlighted location to select it.";
        }
    };
    b.innerText = "Next";

    locationsElement.children[0].scrollIntoView();
    locationsElement.children[0].classList.add("tuto-highlight");
}

function tutoStep3(t, b) {
    const m_elem = document.getElementById("modal_elem");
    m_elem.classList.add("get-out-flux");
    document.body.appendChild(m_elem);


    t.children[0].innerText = "Tutorial";
    t.children[1].innerText = "Click somewhere on the map to add the location cursor.";
    t.children[2].innerText = "";

    b.onclick = () => {
        closeModal();
    };
    b.innerText = "Finish";

    imgElement.scrollIntoView();
    document.getElementById("cur_0").classList.add("tuto-up");
    imgElement.classList.add("tuto-highlight");
}

function closeModal() {
    const m = document.getElementById("modal");
    const m_cell = document.getElementById("modal_cell");
    const m_elem = document.getElementById("modal_elem");
    m_cell.appendChild(m_elem);
    m.classList.remove("show");

    document.getElementById("cur_0").classList.remove("tuto-up");
    imgElement.classList.remove("tuto-highlight");
    locationsElement.children[0].classList.remove("tuto-highlight");
    
    window.localStorage.setItem("tutoFinish", "yes");
}

window.onresize = () => {
    const rectGuess = guessElement.getBoundingClientRect();
    const cursors = document.getElementsByClassName("cursors");
    for (let i = 0; i < cursors.length; i++) {
        if (cursors[i].classList.contains("show")) {
            let left = parseInt(cursors[i].style.left.substring(-2));
            const dataLeft = parseInt(cursors[i].getAttribute("data-left"));
            console.log("a", dataLeft, left, lastMarginLeft, rectGuess.left)
            if (lastMarginLeft > rectGuess.left) { // + zoom
                if (rectGuess.left === 0) {
                    left = left - lastMarginLeft;
                } else {
                    left = dataLeft + rectGuess.left;
                }
            } else if (lastMarginLeft < rectGuess.left) { // - zoom
                left += (rectGuess.left - lastMarginLeft);
            }

            cursors[i].style.left = left + "px";
        }
    }

    lastMarginLeft = rectGuess.left;
}
