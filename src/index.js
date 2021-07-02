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
import { DateTime } from 'luxon';
import 'chartjs-adapter-luxon';
import './style.css';


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

var current_region_selection = 'us'
var current_time_selection = '72h'
var current_price_hash = {
    us: 0,
    eu: 0,
    kr: 0,
    tw: 0
}
var chart_js_data;
var ctx;
var token_chart;


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
            scales: {
                x: {
                    type: 'time',
                    
                }
            },
        }
    })
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
    if (current_price_hash[region] != data['price_data'][region]) {
        current_price_hash[region] = data['price_data'][region];
        if (region === current_region_selection) {
            formatToken();
        }
    }
    
}

export function updateRegionPreference(newRegion) {
    if (newRegion != current_region_selection) {
        token_chart.destroy();
        current_region_selection = newRegion;
    }
    formatToken();
    pullChartData().then(populateChart);
}
export function updateTimePreference(newTime) {
    if (newTime != current_time_selection) {
        token_chart.destroy();
        current_time_selection = newTime;
    }
    pullChartData().then(populateChart)
}

async function pullChartData() {
    let resp = await fetch("https://data.wowtoken.app/token/history/" + current_region_selection + "/" + current_time_selection + ".json");
    let chart_data = await resp.json();
    var new_chart_js_data = []
    for (var i = 0; i < chart_data.length; i++) {
        var datum = {
            x: chart_data[i]['time'],
            y: chart_data[i]['value']
        }
        new_chart_js_data.push(datum)
    }
    chart_js_data = new_chart_js_data
}

async function updateChartData() {
    token_chart.destroy();
    pullChartData().then(populateChart)
}

function formatToken() {
    $("#token").html(current_price_hash[current_region_selection].toLocaleString());
}


$(document).ready(function() {
    callUpdateURL()
    setInterval(callUpdateURL, 60*1000);
    pullChartData().then(populateChart);
    setInterval(updateChartData, 15*60*1000)
});

