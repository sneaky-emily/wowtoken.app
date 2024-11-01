export default function urlBuilder(currentRegionSelection, currentTimeSelection, currentAggregateSelection) {
    let url = "https://data.wowtoken.app/v2/";
    if (currentAggregateSelection !== '' && currentAggregateSelection !== 'none'){
        url += `math/${currentAggregateSelection}/classic/`
    }
    else {
        url += `relative/classic/`
    }

    url += `${currentRegionSelection}/${currentTimeSelection}.json`;
    return url;
}