function isOverlaySelected() {
    return document.getElementById('period-overlay').checked;
}

function getOverlayTime() {
    return document.getElementById("time").selectedOptions[0].innerText;
}

function setOverlayLabelTime() {
    const currentTime = document.getElementById("time").selectedOptions[0].innerText;
    let overlayTimeLabel = document.getElementById("period-time");
    overlayTimeLabel.innerText = currentTime.toLocaleString();
}

function forceOverlayOff(){
    const overlaySetting = document.getElementById("period-overlay");
    const periodOverlayField = document.getElementById("period-overlay-options");
    overlaySetting.checked = false;
    periodOverlayField.style.display = 'none';
}

function allowOverlay(){
    const periodOverlayField = document.getElementById("period-overlay-options");
    periodOverlayField.style.display = 'flex';
}

export {isOverlaySelected, getOverlayTime, setOverlayLabelTime, forceOverlayOff, allowOverlay};