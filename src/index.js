import {
    Chart,
    Legend,
    LinearScale,
    LineController,
    LineElement,
    PointElement,
    TimeSeriesScale,
    Title,
    Tooltip
} from 'chart.js';
import 'chartjs-adapter-dayjs-3';
import "./style.css"

// TODO: This file should be seperated into multiple with better ownership

Chart.register(
    LineElement,
    PointElement,
    LineController,
    LinearScale,
    TimeSeriesScale,
    Legend,
    Title,
    Tooltip
)

let currentRegionSelection = '';
let currentTimeSelection = '';
let currentAggregateSelection = '';
let startYAtZero = false;
const currentPriceHash = {
    us: 0,
    eu: 0,
    kr: 0,
    tw: 0
};
let chartData = {
    us: [],
    eu: [],
    kr: [],
    tw: []
}
let chartOptions = {
    us: {
        color: 'gold'
    },
    eu: {
        color: 'red'
    },
    kr: {
        color: 'white'
    },
    tw: {
        color: 'pink'
    }
}
let chartJsData;
let ctx;
let tokenChart;


function populateChart() {
    ctx = document.getElementById("token-chart").getContext('2d');
    tokenChart = new Chart(ctx, {
        type: 'line',
        data: { 
            datasets: [{
                borderColor: 'gold',
                label: currentRegionSelection.toUpperCase() + " WoW Token Price",
                data: chartJsData,
                cubicInterpolationMode: 'monotone',
                pointRadius: 0
            }]
        },
        options: {
            interaction: {
                intersect: false,
                mode: "index"
            },
            scales: {
                x: {
                    type: 'time',
                    ticks: {
                        color: '#a7a4ab',
                        font: {
                            size: 18,
                        }
                    },
                    time: {
                        unit: lookupTimeUnit(currentTimeSelection)
                    }
                },
                y: {
                    beginAtZero: startYAtZero,
                    ticks: {
                        color: '#a7a4ab',
                        font: {
                            size: 18,
                        }
                    }
                }
            },
        }
    });
}

function lookupTimeUnit(query){
    const lookup = {
        'h': 'day',
        'd': 'week',
        'm': 'month',
        'y': 'month',
        'l': 'year'
    }
    return lookup[query.charAt(query.length - 1)]
}


async function callUpdateURL() {
    let resp = await fetch("https://data.wowtoken.app/token/current.json");
    let data = await resp.json();
    updateTokens(data);
}

function updateTokens(data) {
    updateRegionalToken('us', data);
    updateRegionalToken('eu', data);
    updateRegionalToken('kr', data);
    updateRegionalToken('tw', data);
}

function updateRegionalToken(region, data) {
    if (currentPriceHash[region] !== data['price_data'][region]) {
        currentPriceHash[region] = data['price_data'][region];
        if (region === currentRegionSelection) {
            formatToken();
            if (currentAggregateSelection === 'none') {
                addDataToChart(region, data);
            }
        }
    }
}

function addDataToChart(region, data) {
    if (tokenChart) {
        const datum = {x: data['current_time'], y: data['price_data'][region]}
        tokenChart.data.datasets.forEach((dataset) => {
            dataset.data.push(datum);
        })
        tokenChart.update();
    }
}

async function aggregateFunctionToggle() {
    // TODO: We should probably make these global or something
    //  so if the need to be updated in the future we can do so easily
    const smallTimes = ['72h', '168h', '336h'];
    const longTimes = ['720h', '30d', '2190h', '90d', '1y', '2y', '6m', 'all'];
    const idsToModify = ['agg_wavg']
    if (smallTimes.includes(currentTimeSelection)) {
        for (const id of idsToModify) {
            let ele = document.getElementById(id);
            ele.disabled = true;
        }
    } else if (longTimes.includes(currentTimeSelection)) {
        for (const id of idsToModify) {
            let ele = document.getElementById(id);
            ele.disabled = false;
        }
    }
}

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

function updateRegionPreference(newRegion) {
    if (newRegion !== currentRegionSelection) {
        tokenChart.destroy();
        addLoader();
        currentRegionSelection = newRegion;
    }
    formatToken();
    pullChartData().then(populateChart);
}

function updateTimePreference(newTime) {
    if (newTime !== currentTimeSelection) {
        tokenChart.destroy();
        addLoader();
        currentTimeSelection = newTime;
        aggregateFunctionToggle();
    }
    pullChartData().then(populateChart);
}

function updateAggregatePreference(newAggregate) {
    if (newAggregate !== currentAggregateSelection) {
        tokenChart.destroy();
        addLoader();
        currentAggregateSelection = newAggregate;
    }
    pullChartData().then(populateChart);
}

function toggleAdvancedSetting() {
    let element = document.getElementById('advanced-options')
    if (document.getElementById('enable-advanced').checked)
    {
        element.style.display = 'flex';
    }
    else
    {
        element.style.display = 'none';
    }
}

function toggleStartYAtZero(){
    startYAtZero = document.getElementById('y-start').checked;
    if (tokenChart){
        tokenChart.options.scales.y.beginAtZero = startYAtZero;
        tokenChart.update();
    }
}

function urlBuilder() {
    let url = "https://data.wowtoken.app/token/history/";
    if (currentAggregateSelection !== 'none') {
        url += `${currentAggregateSelection}/`
    }
    url += `${currentRegionSelection}/${currentTimeSelection}.json`
    return url;
}

async function pullChartData() {
    let resp = await fetch(urlBuilder());
    let chartData = await resp.json();
    let newChartJSData = [];
    for (let i = 0; i < chartData.length; i++) {
        let datum = {
            x: chartData[i]['time'],
            y: chartData[i]['value']
        };
        newChartJSData.push(datum);
    }
    chartJsData = newChartJSData;
    removeLoader();
}

function formatToken() {
    document.getElementById("token").innerText = currentPriceHash[currentRegionSelection].toLocaleString();
}

// TODO: These maybe able to be collapsed into a single function with params or a lambda

function detectRegionQuery(urlSearchParams) {
    const validRegions = ['us', 'eu', 'tw', 'kr'];
    if (validRegions.includes(urlSearchParams.get('region').toLowerCase())) {
        currentRegionSelection = urlSearchParams.get('region').toLowerCase();
        let regionDDL = document.getElementById('region');
        for (let i = 0; i < regionDDL.options.length; i++) {
            if (regionDDL.options[i].value === currentRegionSelection) {
                regionDDL.options[i].selected = true;
            }
        }
    } else {
        console.warn("An incorrect or malformed region selection was made in the query string");
    }
}

function detectTimeQuery(urlSearchParams) {
    // In the future, we will allow all the times to be selected,
    // once I come up with a good reduction algorithm.
    // For larger time selections, it's currently hardcoded into the backend
    const validTimes = ['72h', '168h', '336h', '720h', '30d', '2190h', '90d', '1y', '2y', '6m', 'all'];
    if (validTimes.includes(urlSearchParams.get('time').toLowerCase())) {
        currentTimeSelection = urlSearchParams.get('time').toLowerCase();
        let timeDDL = document.getElementById('time');
        for (let i = 0; i < timeDDL.options.length; i++) {
            if (timeDDL.options[i].value === currentTimeSelection) {
                timeDDL.options[i].selected = true;
            }
        }
    } else {
        console.warn("An incorrect or malformed time selection was made in the query string");
    }
}

function detectAggregateQuery(urlSearchParams) {
    const validOperations = ['none', 'daily_mean', 'weekly_mean'];
    if (validOperations.includes(urlSearchParams.get('aggregate').toLowerCase())) {
        currentAggregateSelection = urlSearchParams.get('aggregate').toLowerCase();
        let aggregateDDL = document.getElementById('aggregate');
        for (let i = 0; i < aggregateDDL.options.length; i++) {
            if (aggregateDDL.options[i].value === currentAggregateSelection) {
                aggregateDDL.options[i].selected = true;
            }
        }
        aggregateFunctionToggle();
    } else {
        console.warn("An incorrect or malformed aggregate selection was made in the query string");
    }
}

function detectZeroQuery(urlSearchParams) {
    startYAtZero = urlSearchParams.get('startAtZero') === 'true';
    let advOptions = document.getElementById('enable-advanced');
    let startAtZeroOption = document.getElementById('y-start');
    advOptions.checked = startYAtZero;
    startAtZeroOption.checked = startYAtZero;
    toggleAdvancedSetting();
    toggleStartYAtZero();
}

function detectURLQuery() {
    const urlSearchParams = new URLSearchParams(window.location.search);
    if (urlSearchParams.has('region')) {
        detectRegionQuery(urlSearchParams);
    }
    if (urlSearchParams.has('time')) {
        detectTimeQuery(urlSearchParams);
    }
    if (urlSearchParams.has('aggregate')) {
        detectAggregateQuery(urlSearchParams);
    }
    if (urlSearchParams.has('startAtZero')) {
        detectZeroQuery(urlSearchParams)
    }
}

function buildDeepLinksURL() {
    let url = "https://wowtoken.app/?"
    if (currentTimeSelection !== '72h'){
        url += `time=${currentTimeSelection}&`
    }
    if (currentRegionSelection !== 'us'){
        url += `region=${currentRegionSelection}&`
    }
    if (currentAggregateSelection !== '' && currentAggregateSelection !== 'none'){
        url += `aggregate=${currentAggregateSelection}&`
    }
    if (startYAtZero !== false){
        url += `startAtZero=${startYAtZero}&`
    }
    return url
}

function copyURL() {
    let toolTip = document.getElementById('urlTooltip');
    navigator.clipboard.writeText(buildDeepLinksURL()).then(
        () => {
            toolTip.innerHTML= "Copied the URL";
        },
        () => {
            toolTip.innerHTML = "Unable to copy URL to clipboard";
        }
    );
}

function toolTipMouseOut() {
    let tooltip = document.getElementById("urlTooltip");
    tooltip.innerHTML = "Copy to clipboard";
}

function registerEventHandles() {
    registerCopyHandlers();
    registerOptionHandlers();
    registerAdvancedHandlers();
}

function registerAdvancedHandlers() {
    document.getElementById('enable-advanced').addEventListener('change', () => {
        toggleAdvancedSetting();
    })
    document.getElementById('y-start').addEventListener('change', () => {
        toggleStartYAtZero();
    })
}

function registerCopyHandlers() {
    document.getElementById('copyURLButton').addEventListener('click', function () {
        copyURL();
    })
    document.getElementById('copyURLButton').addEventListener('mouseout', function () {
        toolTipMouseOut();
    })
}

function registerOptionHandlers() {
    document.getElementById('region').addEventListener('change', function() {
        updateRegionPreference(this.value);
    });
    currentRegionSelection = document.getElementById('region').value;
    document.getElementById('time').addEventListener('change', function() {
        updateTimePreference(this.value);
    });
    currentTimeSelection = document.getElementById('time').value;
    document.getElementById('aggregate').addEventListener('change', function () {
        updateAggregatePreference(this.value);
    })
    currentAggregateSelection = document.getElementById('aggregate').value;
}

document.addEventListener('DOMContentLoaded', function () {
    registerEventHandles();
    detectURLQuery();
    Promise.all([callUpdateURL(), pullChartData()]).then(populateChart)
    setInterval(callUpdateURL, 60*1000);
}, false);

