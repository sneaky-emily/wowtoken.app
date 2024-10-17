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

import {updateHighVal} from "./highTime";
import {updateLowVal} from "./lowTime";

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

export default class TokenChart {
    constructor() {
        this._context = document.getElementById("token-chart").getContext('2d');
        this._chartActive = false;
        this._lastDatum = null;
        this._highDatum = null;
        this._lowDatum = null;
        this._lateUpdate = false;
    }

    get highDatum() {
        return this._highDatum;
    }

    get lowDatum() {
        return this._lowDatum;
    }

    async createChart(region, time, yLevel, data) {
        const chartData = [];
        let lateUpdateData = this._lastDatum;

        for (let i = 0; i < data.length; i++) {
            this._lastDatum = data[i];
            if (this._highDatum === null || this._lastDatum.getPrice() > this._highDatum.getPrice()) {
                this._highDatum = data[i];
            }

            if (this._lowDatum === null || this._lowDatum.getPrice() > this._lastDatum.getPrice()) {
                this._lowDatum = data[i];
            }

            chartData.push({
                x: data[i].getX(),
                y: data[i].getY(),
            })
        }

        updateHighVal(this.highDatum);
        updateLowVal(this.lowDatum);

        this._chart = new Chart(this._context, {
            type: 'line',
            data: {
                datasets: [{
                    borderColor: 'gold',
                    label: region.toUpperCase() + " WoW Token Price",
                    data: chartData,
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
                        grid: {
                            color: '#625f62',
                        },
                        ticks: {
                            color: '#a7a4ab',
                            font: {
                                size: 18,
                            }
                        },
                        time: {
                            unit: lookupTimeUnit(time)
                        }
                    },
                    y: {
                        beginAtZero: yLevel,
                        grid: {
                            color: '#2f2c2f',
                        },
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

        if (this._lateUpdate) {
            if (this._lastDatum.getPrice() !== lateUpdateData.getPrice() &&
                this._lastDatum.getTime() < lateUpdateData.getTime()) {
                await this.addDataToChart(lateUpdateData);
            }
            this._lateUpdate = false
        }

        this._chartActive = true;
    }

    async destroyChart() {
        await this._chart.destroy();
        this._chartActive = false;
        this._lastDatum = null;
        this._highDatum = null;
        this._lowDatum = null;
        this._lateUpdate = false;
    }

    async lateUpdate(datum){
        this._lastDatum = datum;
        this._lateUpdate = true;
    }

    async addDataToChart(datum) {
        this._lastDatum = datum;
        if (datum.getPrice() > this._highDatum.getPrice()) {
            this._highDatum = datum;
            updateHighVal(this.highDatum);
        }
        else if (datum.getPrice() < this._lowDatum.getPrice()) {
            this._lowDatum = datum;
            updateLowVal(this.lowDatum);
        }
        this._chart.data.datasets.forEach((dataset) => {
            dataset.data.push({
                x: datum.getX(),
                y: datum.getY(),
            })
        });
        this._chart.update();
    }

    active() {
        return this._chartActive;
    }

    toggleYStart(startYAtZero) {
        this._chart.options.scales.y.beginAtZero = startYAtZero;
        this._chart.update();
    }

}