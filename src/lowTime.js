import Datum from "./datum";

function updateLowTime() {
    const lowTime= document.getElementById("low-time");

    const currentTime = document.getElementById("time").selectedOptions[0].innerText;
    if (currentTime.toLowerCase() !== lowTime.innerText) {
        lowTime.innerText = currentTime.toLowerCase();
    }
}

function updateLowVal(datum) {
    const lowVal = document.getElementById("low-val");
    lowVal.innerHTML = datum.getPrice().toLocaleString();
}

export {updateLowTime, updateLowVal};