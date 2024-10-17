import Datum from "./datum";


function updateHighTime() {
    const highTime= document.getElementById("high-time");

    const currentTime = document.getElementById("time").selectedOptions[0].innerText;
    if (currentTime.toLowerCase() !== highTime.innerText) {
        highTime.innerText = currentTime.toLowerCase();
    }
}

function updateHighVal(datum) {
    const highVal = document.getElementById("high-val");
    highVal.innerHTML = datum.getPrice().toLocaleString();
}

export {updateHighTime, updateHighVal};