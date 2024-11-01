import Datum from "./datum";
import urlBuilder from "./urlBuilder";

export default async function fetchData(currentRegionSelection, currentTimeSelection, currentAggregateSelection) {
    const data = [];
    const resp = await fetch(urlBuilder(currentRegionSelection, currentTimeSelection, currentAggregateSelection));
    const respData = await resp.json();
    for (let i = 0, l = respData.length; i < l; i++) {
        let datum = new Datum(Date.parse(respData[i][0]), respData[i][1]);
        data.push(datum);
    }
    return data;
}