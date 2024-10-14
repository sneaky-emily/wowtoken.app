export default function urlBuilder(currentRegionSelection, currentTimeSelection, currentAggregateSelection) {
    let url = "https://data.wowtoken.app/token/history/";
    if (currentAggregateSelection !== 'none') {
        url += `${currentAggregateSelection}/`
    }
    url += `${currentRegionSelection}/${currentTimeSelection}.json`
    return url;
}