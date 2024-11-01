export default function urlBuilder(currentRegionSelection, currentTimeSelection, currentAggregateSelection) {
    let url = "https://data.wowtoken.app/v2/";
    if (currentAggregateSelection !== '' && currentAggregateSelection !== 'none'){
        url += `math/${currentAggregateSelection}/retail/`
    }
    else {
        url += `relative/retail/`
    }

    url += `${currentRegionSelection}/${currentTimeSelection}.json`;
    return url;
}