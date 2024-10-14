export default async function fetchCurrent() {
    const resp = await fetch("https://data.wowtoken.app/token/current.json");
    return await resp.json();
}
