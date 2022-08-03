window.addEventListener("DOMContentLoaded", __main__);
let contentElement = null,
    guessElement = null,
    imgElement = null,
    mapElement = null, 
    areaElement = null,
    locationsElement = null,
    positionElement = null,
    watermark = null;

function __main__() {
    if (!window.fetch) return alert("Your browser doesn't support fetch.");

    contentElement = document.getElementById("content");
    guessElement = document.getElementById("guess");
    locationsElement = document.getElementById("locations");
    positionElement = document.getElementById("position");
    watermark = document.getElementById("watermark");

    imgElement = createImageElement("map.jpg");
    imgElement.onload = imgLoaded;

    guessElement.appendChild(imgElement);
}

function imgLoaded() {
    guessElement.style.width = this.clientWidth + "px";
    mapElement = createMapElement(this.clientWidth, this.clientHeight);
    areaElement = createAreaElement(this.clientWidth, this.clientHeight);
    
    mapElement.appendChild(areaElement);
    guessElement.appendChild(mapElement);

    locationsElement.style.width = this.clientWidth + "px";
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
            for (let i = 0; i < d.locations.length; i++) {
                const img = new Image();
                img.src = "locations/" + d.locations[i];
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
                    eimg.stopImmediatePropagation();
                    eimg.stopPropagation();
                    const imgRect = imgElement.getBoundingClientRect();
                    if (eimg.button === 0) { // left
                        if (eimg.target.classList.contains("onuse")) {
                            stopMarking(eimg.target);
                        } else {
                            eimg.target.classList.add("onuse");
                            areaElement.classList.add("on");
                            positionElement.classList.add("show");
                            areaElement.onmousemove = (e) => {
                                const x = Math.round(e.pageX - imgRect.left);
                                const y = Math.round(e.pageY - imgRect.top);
                                positionElement.style.left = e.pageX + "px";
                                positionElement.style.top = e.pageY + "px";
                                positionElement.style.fontSize = Math.max(50, 100 - (window.devicePixelRatio * 100)) + "px";
                                positionElement.innerText = `x: ${x}; y: ${y}`;
                            }
                            areaElement.onmouseup = (e) => {
                                cursorElement.classList.add("show");
                                const cursRect = cursorElement.getBoundingClientRect();
                                const x = Math.round(e.pageX - cursRect.width);
                                const y = Math.round(e.pageY - cursRect.height / 2 - 15);

                                cursorElement.style.left = x + "px";
                                cursorElement.style.top = y + "px";
                                
                                marking(eimg.target);
                                stopMarking(eimg.target);
                            }
                        }
                    } else if (eimg.button === 2) {
                        window.open(eimg.target.getAttribute('src'),'Image');
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
    positionElement.classList.remove("show");
    areaElement.onmouseup = null;
    areaElement.onmousemove = null;
}

function marking(e) {
    e.classList.add("marked");
}

function download() {
    const locations = Array.from(locationsElement.children);
    const ilocs = [];
    for (let i = 0; i < locations.length; i++) {
        if (locations[i].classList.contains("marked")) {
            locations[i].classList.remove("marked");
            ilocs.push(i);
        }
    }

    watermark.classList.add("show");
    const imgRect = imgElement.getBoundingClientRect();
    const wRect = watermark.getBoundingClientRect();
    const x = 0;
    const y = Math.round(imgRect.bottom - wRect.height * 4);
    watermark.style.fontSize = imgRect.width / 50 + "px";
    watermark.style.left = x + "px";
    watermark.style.top = y + "px";

    const btn = document.getElementById("btn-dl");
    const defInnerText = btn.innerText;
    btn.innerText = "Wait...";

    domtoimage
        .toBlob(guessElement)
        .then(blob => {
            saveAs(blob, "guess-pokemon-locations.png");
            for (const i of ilocs) {
                locations[i].classList.add("marked");
            }
        })
        .catch(e => {
            alert("oops, something went wrong!", e)
        })
        .finally(() => {
            btn.innerText = defInnerText;
            watermark.classList.remove("show");
        });
}