import 'chartjs-adapter-dayjs-4';
import "./style.css"

import fetchCurrent from "./fetchCurrent";
import fetchData from "./fetchData";
import {updateHighTime} from "./highTime";
import {updateLowTime} from "./lowTime";
import {addLoader, removeLoader} from "./loader";
import {allowOverlay, forceOverlayOff, forceOverlayOn, isOverlayAllowed, isOverlaySelected} from "./overlay";
import TokenChart from "./tokenChart";
import Datum from "./datum";

// TODO: This file should be seperated into multiple with better ownership

let currentRegionSelection = '';
let currentTimeSelection = '';
let currentAggregateSelection = '';
let startYAtZero = false;
let datum;
let chart;
const currentPriceHash = {
    us: 0,
    eu: 0,
    kr: 0,
    tw: 0
};
const chartData = {
    us: [],
    eu: [],
    kr: [],
    tw: []
}

async function callUpdateURL() {
    await updateTokens(await fetchCurrent());
}

async function updateTokens(data) {
    await Promise.all([
        updateRegionalToken('us', data),
        updateRegionalToken('eu', data),
        updateRegionalToken('kr', data),
        updateRegionalToken('tw', data)
    ]);
}

async function updateRegionalToken(region, data) {
    if (currentPriceHash[region] !== data[region][1]) {
        currentPriceHash[region] = data[region][1];
        if (region === currentRegionSelection) {
            formatToken();
            datum = new Datum(Date.parse(data[region][0]), data[region][1]);
            if (currentAggregateSelection === 'none' && chart.active()) {
                await chart.addDataToChart(datum);
            }
            else if (currentAggregateSelection === 'none' && !chart.active()) {
                await chart.lateUpdate(datum);
            }
        }
    }
}

async function updateRegionPreference(newRegion) {
    if (newRegion !== currentRegionSelection) {
        await chart.destroyChart();
        addLoader();
        currentRegionSelection = newRegion;
    }
    formatToken();
    await pullChartData();
}

async function updateTimePreference(newTime) {
    if (newTime !== currentTimeSelection) {
        await chart.destroyChart();
        addLoader();
        currentTimeSelection = newTime;
    }
    if (newTime === "all") {
        forceOverlayOff();
    }
    else {
        allowOverlay();
    }
    await pullChartData();
    updateHighTime();
    updateLowTime();
}

async function updateAggregatePreference(newAggregate) {
    if (newAggregate !== currentAggregateSelection) {
        await chart.destroyChart();
        addLoader();
        currentAggregateSelection = newAggregate;
    }
    await pullChartData();
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
    chart.toggleYStart(startYAtZero);
}

async function toggleOverlay() {
    await chart.destroyChart();
    addLoader();
    await pullChartData();
}

async function pullChartData() {
    let timeSelection = currentTimeSelection;
    if (isOverlaySelected()) {
        let timeDigits = parseInt(timeSelection.slice(0, timeSelection.length - 1)) * 2;
        let timeUnit = timeSelection.slice(timeSelection.length - 1);
        timeSelection = `${timeDigits}${timeUnit}`;
    }
    chartData[currentRegionSelection] = await fetchData(currentRegionSelection, timeSelection, currentAggregateSelection);
    if (!chart.active()) {
        await chart.createChart(currentRegionSelection, currentTimeSelection, startYAtZero, chartData[currentRegionSelection]);
    }
    else {
        for (let i = 0; i < chartData[currentRegionSelection].length; i++) {
            await chart.addDataToChart(chartData[currentRegionSelection][i]);
        }
        console.warn("This should never hit, and should be okay to remove");
    }
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
        if (currentTimeSelection === 'all') {
            forceOverlayOff();
        }
        let timeDDL = document.getElementById('time');
        for (let i = 0; i < timeDDL.options.length; i++) {
            if (timeDDL.options[i].value === currentTimeSelection) {
                timeDDL.options[i].selected = true;
            }
        }
        updateHighTime();
        updateLowTime();
    } else {
        console.warn("An incorrect or malformed time selection was made in the query string");
    }
}

function detectAggregateQuery(urlSearchParams) {
    const validOperations = ['none', 'daily_mean', 'avg'];
    if (validOperations.includes(urlSearchParams.get('aggregate').toLowerCase())) {
        currentAggregateSelection = urlSearchParams.get('aggregate').toLowerCase();
        // For backwards compatibility
        if (currentAggregateSelection === 'daily_mean') {
            currentAggregateSelection = 'avg';
        }
        let aggregateDDL = document.getElementById('aggregate');
        for (let i = 0; i < aggregateDDL.options.length; i++) {
            if (aggregateDDL.options[i].value === currentAggregateSelection) {
                aggregateDDL.options[i].selected = true;
            }
        }
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

function detectOverlayQuery(urlSearchParams) {
    const enableOverlay = urlSearchParams.get('overlay') === 'previous_time';
    if (enableOverlay) {
        forceOverlayOn();
    } else {
        forceOverlayOff();
    }
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
    if (urlSearchParams.has('overlay')) {
        detectOverlayQuery(urlSearchParams);
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
    if (isOverlaySelected()){
        url += `overlay=previous_time&`
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

// TODO: These need to be moved out into probably tokenChart if not other files

function registerAdvancedHandlers() {
    document.getElementById('enable-advanced').addEventListener('change', () => {
        toggleAdvancedSetting();
    })
    document.getElementById('y-start').addEventListener('change', () => {
        toggleStartYAtZero();
    })
    document.getElementById('period-overlay').addEventListener('change', () => {
        toggleOverlay();
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
    chart = new TokenChart();
    Promise.all([
        callUpdateURL(),
    ]).then(pullChartData);

    setInterval(callUpdateURL, 60*1000);
}, false);

