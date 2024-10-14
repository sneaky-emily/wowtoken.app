export default class Datum {
    constructor(time, price) {
        this._time = time;
        this._price = price;
    }

    getTime() {
        return this._time;
    }

    getPrice() {
        return this._price;
    }

    getX() {
        return this.getTime();
    }

    getY() {
        return this.getPrice();
    }
}