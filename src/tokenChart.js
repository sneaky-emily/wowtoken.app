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
import 'chartjs-adapter-dayjs-4';

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
import {isOverlaySelected, getOverlayTime, setOverlayLabelTime} from "./overlay";
import Datum from "./datum";
import patches from "./patches";

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

function timeDeltaInMilliseconds(time) {
    let timeDigits = (parseInt(time.slice(0, time.length - 1))).toFixed(0);
    let timeUnit = time.slice(time.length - 1);

    switch (timeUnit) {
        case 'h':
            return timeDigits * (60 * 60) * 1000;
        case 'd':
            return timeDigits * (24 * 60 * 60) * 1000;
        case 'm':
            return (timeDigits * (30.437 * 24 * 60 * 60)).toFixed(0) * 1000;
        case 'y':
            return (timeDigits * (365.25 * 24 * 60 * 60)).toFixed(0) * 1000;
        case 'l':
            console.warn("This path should not happen, this warning is an error in logic")
    }
}

function buildPatchLinePlugin() {
  return {
    id: "patchLines",
    afterDraw(chart) {
      const ctx = chart.ctx;
      const xAxis = chart.scales.x;
      const yAxis = chart.scales.y;

      patches.forEach((patch) => {
        const ts = new Date(patch.date).getTime();
        if (ts < xAxis.min || ts > xAxis.max) return;

        const x = xAxis.getPixelForValue(ts);

        ctx.save();

        ctx.beginPath();
        ctx.moveTo(x, yAxis.top);
        ctx.lineTo(x, yAxis.bottom);
        ctx.lineWidth = 12;
        ctx.strokeStyle = "rgba(0, 220, 255, 0.08)";
        ctx.setLineDash([]);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x, yAxis.top);
        ctx.lineTo(x, yAxis.bottom);
        ctx.lineWidth = 5;
        ctx.strokeStyle = "rgba(0, 220, 255, 0.2)";
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x, yAxis.top);
        ctx.lineTo(x, yAxis.bottom);
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = "rgba(0, 220, 255, 0.9)";
        ctx.setLineDash([6, 3]);
        ctx.stroke();

        ctx.restore();
      });
    },
  };
}

export default class TokenChart {
    constructor() {
        this._context = document.getElementById("token-chart").getContext('2d');
        this._chartActive = false;
        this._lastDatum = null;
        this._highDatum = null;
        this._lowDatum = null;
        this._lateUpdate = false;
        this._patchTooltipListener = null;
    }

    get highDatum() {
        return this._highDatum;
    }

    get lowDatum() {
        return this._lowDatum;
    }

    async #newChart(chartConfig) {
    this._chart = new Chart(this._context, chartConfig);
    this.#attachPatchTooltip();
  }

  #attachPatchTooltip() {
    const canvas = this._context.canvas;
    const tooltip = document.getElementById("patch-tooltip");

    if (this._patchTooltipListener) {
      canvas.removeEventListener("mousemove", this._patchTooltipListener);
    }

    this._patchTooltipListener = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const xAxis = this._chart.scales.x;
      let found = null;

      patches.forEach((patch) => {
        const ts = new Date(patch.date).getTime();
        if (ts < xAxis.min || ts > xAxis.max) return;
        const lineX = xAxis.getPixelForValue(ts);
        if (Math.abs(mouseX - lineX) < 8) found = patch;
      });

      if (found) {
        tooltip.style.display = "block";
        tooltip.style.left = e.clientX + 12 + "px";
        tooltip.style.top = e.clientY - 28 + "px";
        tooltip.textContent = found.label;
      } else {
        tooltip.style.display = "none";
      }
    };

    canvas.addEventListener("mousemove", this._patchTooltipListener);
  }

    async #updateHighLow(datum) {
        if (this._highDatum === null) {
            this._highDatum = new Datum(datum.getTime(), 0);
            this._lowDatum = datum;
            return;
        }
        if (datum.getPrice() > this._highDatum.getPrice()) {
            this._highDatum = datum;
            updateHighVal(this.highDatum);
        }
        else if (datum.getPrice() < this._lowDatum.getPrice()) {
            this._lowDatum = datum;
            updateLowVal(this.lowDatum);
        }
    }

    async #createOverlayChart(region, time, yLevel, data){
        const chartData = [];
        const overlayData = [];
        const overlayDelta = timeDeltaInMilliseconds(time);

        for (let i = 0; i < data.length; i++) {
            const originalDate = data[i].getX();
            if (i < (data.length / 2)) {
                overlayData.push({
                    x: new Date(originalDate.getTime() + overlayDelta),
                    y: data[i].getY(),
                });
            }
            else {
                await this.#updateHighLow(data[i]);

                chartData.push({
                    x: data[i].getX(),
                    y: data[i].getY(),
                })
            }
        }

        const chartConfig = {
            type: 'line',
            data: {
                datasets: [
                    {
                        borderColor: 'gold',
                        label: region.toUpperCase() + " WoW Token Price",
                        data: chartData,
                        cubicInterpolationMode: 'monotone',
                        pointRadius: 0
                    },
                    {
                        borderColor: 'red',
                        label: `Previous ${getOverlayTime()} ${region.toUpperCase()} WoW Token Price`,
                        data: overlayData,
                        cubicInterpolationMode: 'monotone',
                        pointRadius: 0
                    }
                ]
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
            },
            plugins: [buildPatchLinePlugin()],
        };

        await this.#newChart(chartConfig)
    }

    async #createNormalChart(region, time, yLevel, data) {
        const chartData = [];


        for (let i = 0; i < data.length; i++) {
            this._lastDatum = data[i];
            await this.#updateHighLow(data[i]);

            chartData.push({
                x: data[i].getX(),
                y: data[i].getY(),
            })
        }

        const chartConfig = {
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
            },
            plugins: [buildPatchLinePlugin()],
        };

        await this.#newChart(chartConfig)
    }

    async createChart(region, time, yLevel, data) {
        let lateUpdateData = this._lastDatum;

        if (isOverlaySelected()) {
            await this.#createOverlayChart(region, time, yLevel, data)
        }
        else {
            await this.#createNormalChart(region, time, yLevel, data)
        }

        setOverlayLabelTime();

        updateHighVal(this.highDatum);
        updateLowVal(this.lowDatum);

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
        this._chart.data.datasets[0].data.push({
            x: datum.getX(),
            y: datum.getY(),
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