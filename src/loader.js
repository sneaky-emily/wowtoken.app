function addLoader() {
    let loader = document.getElementById('loader');
    if (!loader) {
        const blank_div = document.createElement('div');
        let loaderNode = blank_div.cloneNode();
        loaderNode.id = 'loader';
        loaderNode.className = 'lds-ripple';
        loaderNode.appendChild(blank_div.cloneNode());
        loaderNode.appendChild(blank_div.cloneNode());
        let chartNode = document.getElementById('token-chart');
        chartNode.before(loaderNode);
    }
}

function removeLoader () {
    let loader = document.getElementById('loader');
    if (loader) {
        loader.remove();
    }
}

export {addLoader, removeLoader};