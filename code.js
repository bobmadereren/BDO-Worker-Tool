import nodeData from './nodes.json' with {type: 'json'};
import ownedArray from './owned.json' with {type: 'json'};

let owned = new Set(ownedArray);

function buy(e, d) {
    // Check if at least one neighbor is owned
    const hasOwnedNeighbor = d.neighbors.some(neighborId => owned.has(neighborId));

    if (!hasOwnedNeighbor) {
        alert('You can only buy a house if at least one neighbor is owned.');
        return;
    }

    // Add the current node to the owned set
    owned.add(d.id);

    // Update the visualization
    d3.select(e.target) // Assuming the target is the node element
        .select('circle') // Update the node's circle
        .style('fill', '#ffaa00'); // Example: Change color to indicate ownership

    // Optional: Update the tooltip
    updateTooltip(e, d);

    alert(`House bought at ${d.name}!`);
}


// Generate edge data
let nodeMap = new Map(nodeData.map(d => [d.id, d]));
let edgeData = nodeData.flatMap(d => d.neighbors.filter(id => id > d.id).map(id => ({ source: d, target: nodeMap.get(id) })));

// Adjust dimensions and margins
let margin = { top: 20, right: 20, bottom: 20, left: 20 };
let width = window.innerWidth - margin.left - margin.right;
let height = window.innerHeight - margin.top - margin.bottom;

// Define the affine transformation sending the world to the svg
let [x0, x1] = d3.extent(nodeData, d => d.pos.x);
let [y0, y1] = d3.extent(nodeData, d => d.pos.y);
let k = Math.min(width / (x1 - x0), height / (y1 - y0));
let X = x => (x - (x0 + x1) / 2) * k + width / 2;
let Y = y => (y - (y0 + y1) / 2) * (-1) * k + height / 2;

// Edge lines
let line = d3.line();

let zoom = d3.zoom()
    .translateExtent([[0, 0], [width + margin.left + margin.right, height + margin.top + margin.bottom]])
    .scaleExtent([1, 500])
    .on("zoom", draw);

// Define a custom color palette
let customColors = [
    "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728",
    "#9467bd", "#8c564b", "#e377c2", "#7f7f7f",
    "#bcbd22", "#17becf"
];

let types = [...new Set(nodeData.map(({ type }) => type))]; // Unique types
let color = d3.scaleOrdinal(types, customColors); // Ensure the scale matches the dataset

// Create SVG
let svg = d3.select("body")
    .append("svg")
    .attr("width", width + margin.left + margin.right) // Adjusted width
    .attr("height", height + margin.top + margin.bottom)
    .style("display", "block")
    .style("margin", "0 auto")
    .style("cursor", "crosshair")
    .call(zoom)
    .append("g")
    .attr("width", width)
    .attr("height", height)
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

// Add axes
let xAxis = svg.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0, ${height})`);

let yAxis = svg.append("g")
    .attr("class", "y-axis");

// Create tooltip
let tooltip = d3.select("body")
    .append("div")
    .attr("class", "node-tooltip");

function updateTooltip(e, d) {
    tooltip
        .style("left", `${e.pageX + 10}px`)
        .style("top", `${e.pageY - 50}px`)
        .classed("visible", true)
        .html(`
            <div><strong>${d.name}</strong></div>
            <div>Type: ${d.type}</div>
            <div>Territory: ${d.territory}</div>
            <div>CP: ${d.cp}</div>
            <div>Owned: ${owned.has(d.id)}</div>
            <div>Double click to buy</div>
        `);
}

function hideTooltip() {
    tooltip.classed("visible", false);
}

// TODO Fix zoom bug

// Flag to track node name visibility
let nodeNamesVisible = true;

// Function to toggle node name visibility
function toggleNodeNames() {
    nodeNamesVisible = !nodeNamesVisible;
    nodes.selectAll("text")
        .style("visibility", nodeNamesVisible ? "visible" : "hidden");
}

// Attach event listener to the toggle button
document.getElementById('toggleNodeNames').addEventListener('click', toggleNodeNames);


// Create edges
let edges = svg.append("g")
    .attr("class", "edges")
    .selectAll(".edge")
    .data(edgeData, d => d.source.id + '-' + d.target.id)
    .enter()
    .append("path") // TODO style depending on whether none, one or both nodes are owned
    .attr("class", "edge")
    .attr("stroke", "white")
    .attr("fill", "none")
    .on("mouseover", e => d3.select(e.target).attr("stroke", "#ffaa00").attr("stroke-width", 4))
    .on("mouseout", e => d3.select(e.target).attr("stroke", "white").attr("stroke-width", 2));

// Create nodes with persistent names
let nodes = svg.append("g")
    .attr("class", "nodes")
    .selectAll(".node")
    .data(nodeData, ({ id }) => id)
    .enter()
    .append("g")
    .attr("class", "node");

nodes.append("text")
    .style("fill", d => color(d.type))
    .attr("text-anchor", "middle")
    .attr("dy", "-0.7em")
    .style("user-select", "none")
    .text(({ name }) => name);

nodes.append("circle")
    .attr("r", 5) // TODO use symbols depending on type instead of circles
    .style("fill", d => (owned.has(d.id) ? "#ffaa00" : color(d.type)))
    .on("mouseover", updateTooltip)
    .on("mousemove", updateTooltip)
    .on("mouseout", hideTooltip)
    .on('dblclick', (e, d) => buy(e, d));

// Draw legend
let legend = svg.append("g")
    .attr("class", "legends")
    .selectAll(".legend")
    .data(types) // Use the unique types from the dataset
    .enter()
    .append("g")
    .attr("class", "legend")
    .attr("transform", (_, i) => `translate(${width - 100}, ${i * 25})`); // Position legend to the right

// Add colored rectangles for the legend
legend.append("rect")
    .attr("x", 0)
    .attr("width", 18)
    .attr("height", 18)
    .style("fill", color); // Use the same color scale

// Add text labels for the legend
legend.append("text")
    .attr("x", 25)
    .attr("y", 12)
    .style("text-anchor", "start")
    .style("font-size", "14px")
    .style("font-weight", "bold")
    .style("fill", "#FFFFFF") // Adjust text color if necessary
    .text(d => d); // Display the type names

function draw({ transform }) {
    let x = x => transform.applyX(X(x));
    let y = y => transform.applyY(Y(y));

    //xAxis.call(d3.axisBottom(x));
    //yAxis.call(d3.axisLeft(y));

    nodes.selectAll("text")
        .attr("x", d => x(d.pos.x))
        .attr("y", d => y(d.pos.y))
        .style("visibility", () => transform.k > 2 ? "visible" : "hidden"); // Show names only when zoom > 2

    nodes.selectAll('circle')
        .attr("r", 5)
        .attr("cx", d => x(d.pos.x))
        .attr("cy", d => y(d.pos.y));

    edges.attr("d", d => line([[x(d.source.pos.x), y(d.source.pos.y)], [x(d.target.pos.x), y(d.target.pos.y)]]));
}
function showSidePanel(d) {
    let sidePanel = d3.select("#side-panel");
    sidePanel.classed("hidden", false);
    // TODO option to buy from house from side panel
    // TODO display yield, luckYield and whether it is a subnode (=not mainNode) and whether it is a monopoly node.
    d3.select("#side-panel-content").html(`
            <div><strong>Name:</strong> ${d.name}</div>
            <div><strong>Type:</strong> ${d.type}</div>
            <div><strong>Territory:</strong> ${d.territory}</div>
            <div><strong>Contribution Points:</strong> ${d.cp}</div>
        `);
}

function hideSidePanel() {
    d3.select("#side-panel").classed("hidden", true);
}

// Attach event handlers to nodes
nodes.on("click", (_, d) => showSidePanel(d));

// Optional: Hide panel when clicking outside of nodes
d3.select("body").on("click", function (e) {
    if (!e.target.closest(".node")) {
        hideSidePanel();
    }
});

// Initial render
svg.call(zoom.transform, d3.zoomIdentity);
