import {
    Chart,
    LineElement,
    PointElement,
    LineController,
    LinearScale,
    TimeSeriesScale,
    Legend,
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

let current_region_selection = ''
let current_time_selection = ''
const current_price_hash = {
    us: 0,
    eu: 0,
    kr: 0,
    tw: 0
}
let chart_js_data;
let ctx;
let token_chart;


function populateChart() {
    ctx = document.getElementById("token-chart").getContext('2d');
    token_chart = new Chart(ctx, {
        type: 'line',
        data: { 
            datasets: [{
                borderColor: 'gold',
                label: current_region_selection.toUpperCase() + " WoW Token Price",
                data: chart_js_data,
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
    let resp = await fetch("https://data.wowtoken.app/next/token/current.json");
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
    if (current_price_hash[region] !== data['price_data'][region]) {
        current_price_hash[region] = data['price_data'][region];
        if (region === current_region_selection) {
            formatToken();
            add_data_to_chart(region, data);
        }
    }
}

function add_data_to_chart(region, data) {
    if (token_chart) {
        const datum = {x: data['current_time'], y: data['price_data'][region]}
        token_chart.data.datasets.forEach((dataset) => {
            dataset.data.push(datum);
        })
        token_chart.update();
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

export function updateRegionPreference(newRegion) {
    if (newRegion !== current_region_selection) {
        token_chart.destroy();
        addLoader();
        current_region_selection = newRegion;
    }
    formatToken();
    pullChartData().then(populateChart);
}

export function updateTimePreference(newTime) {
    if (newTime !== current_time_selection) {
        token_chart.destroy();
        addLoader();
        current_time_selection = newTime;
    }
    pullChartData().then(populateChart);
}

async function pullChartData() {
    let resp = await fetch("https://data.wowtoken.app/next/token/history/" + current_region_selection + "/" + current_time_selection + ".json");
    let chart_data = await resp.json();
    let new_chart_js_data = [];
    for (let i = 0; i < chart_data.length; i++) {
        let datum = {
            x: chart_data[i]['time'],
            y: chart_data[i]['value']
        };
        new_chart_js_data.push(datum);
    }
    chart_js_data = new_chart_js_data;
    removeLoader();
}

function formatToken() {
    $("#token").html(current_price_hash[current_region_selection].toLocaleString());
}

function detectURLQuery() {
    const urlSearchParams = new URLSearchParams(window.location.search)
    const validRegions = ['us', 'eu', 'tw', 'kr']
    if (urlSearchParams.has('region')) {
        if (validRegions.includes(urlSearchParams.get('region').toLowerCase())) {
            current_region_selection = urlSearchParams.get('region').toLowerCase()
            let region_ddl = document.getElementById('region')
            for (let i = 0; i < region_ddl.options.length; i++){
                if (region_ddl.options[i].value === current_region_selection) {
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
    const validTimes = ['72h', '168h', '336h', '720h', '30d', '90d', '1y', '2y', '6m', 'all'];
    if (urlSearchParams.has('time')) {
        if (validTimes.includes(urlSearchParams.get('time').toLowerCase())) {
            current_time_selection = urlSearchParams.get('time').toLowerCase();
            let time_ddl = document.getElementById('time')
            for (let i = 0; i < time_ddl.options.length; i++){
                if (time_ddl.options[i].value === current_time_selection) {
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
    current_region_selection = document.getElementById('region').value;
    document.getElementById('time').addEventListener('change', function() {
        updateTimePreference(this.value);
    });
    current_time_selection = document.getElementById('time').value;
    detectURLQuery();
    Promise.all([callUpdateURL(), pullChartData()]).then(populateChart)
    setInterval(callUpdateURL, 60*1000);
});

