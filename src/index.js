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
import $ from 'cash-dom';
import 'chartjs-adapter-dayjs-3';


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
const currentPriceHash = {
    us: 0,
    eu: 0,
    kr: 0,
    tw: 0
};
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
                    type: 'time'
                }
            },
        }
    });
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
    const idsToModify = ['agg_wmax', 'agg_wmin', 'agg_wavg']
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
    $("#token").html(currentPriceHash[currentRegionSelection].toLocaleString());
}

function detectURLQuery() {
    const urlSearchParams = new URLSearchParams(window.location.search)
    const validRegions = ['us', 'eu', 'tw', 'kr']
    if (urlSearchParams.has('region')) {
        if (validRegions.includes(urlSearchParams.get('region').toLowerCase())) {
            currentRegionSelection = urlSearchParams.get('region').toLowerCase()
            let region_ddl = document.getElementById('region')
            for (let i = 0; i < region_ddl.options.length; i++){
                if (region_ddl.options[i].value === currentRegionSelection) {
                    region_ddl.options[i].selected = true;
                }
            }
        } else {
            console.log("An incorrect or malformed region selection was made in the query string")
        }
    }
    // In the future, we will allow all the times to be selected,
    // once I come up with a good reduction algorithm.
    // For larger time selections, it's currently hardcoded into the backend
    const validTimes = ['72h', '168h', '336h', '720h', '30d', '2190h', '90d', '1y', '2y', '6m', 'all'];
    if (urlSearchParams.has('time')) {
        if (validTimes.includes(urlSearchParams.get('time').toLowerCase())) {
            currentTimeSelection = urlSearchParams.get('time').toLowerCase();
            let time_ddl = document.getElementById('time');
            for (let i = 0; i < time_ddl.options.length; i++){
                if (time_ddl.options[i].value === currentTimeSelection) {
                    time_ddl.options[i].selected = true;
                }
            }
        } else {
            console.log("An incorrect or malformed time selection was made in the query string");
        }
    }
}

$(document).ready(function() {
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
    detectURLQuery();
    Promise.all([callUpdateURL(), pullChartData()]).then(populateChart)
    setInterval(callUpdateURL, 60*1000);
});

