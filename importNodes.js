import { writeFile } from 'fs';

const NODE_TYPES = [
    'Connection',
    'Town',
    'City',
    'Gateway',
    'Farming',
    'Trade',
    'Gathering',
    'Mining',
    'Lumbering',
    'Danger Zone',
    'Investment Bank', // Monopoly
    'Fish Drying Yard',
    'Investment Bank', // CP
    'Specialties',
    'Production',
    'Excavation',
];

(async () => {
    let url = "https://apiv2.bdolytics.com/en/map/nodes";
    console.log("Fetch", url);
    let response = await fetch(url);
    let { data } = await response.json();

    let result = [];

    for (let d of data) {
        let [coords] = d.coordinates;
        let [x, z, y] = coords || [];

        result.push({
            id: d.id,
            name: d.name,
            territory: d.territory_name,
            cp: d.contribution_points,
            yeild: (d.node_yields_items || []).map(({ id, name }) => ({ id, name })),
            luckYield: (d.node_luck_yields_items || []).map(({ id, name }) => ({ id, name })),
            pos: { x, y },
            isMain: d.is_main_node,
            neighbors: d.connections,
            type: NODE_TYPES[d.node_kind],
            monopoly: d.node_kind == 10 || d.node_kind == 13,
        });
    }

    let json = JSON.stringify(result);

    let fileName = 'nodes.json';

    writeFile(fileName, json, error => console.log(error ? error : "File written", fileName));
})();