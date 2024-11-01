export default async function fetchCurrent() {
    const resp = await fetch("https://data.wowtoken.app/v2/current/classic.json");
    return await resp.json();
}
