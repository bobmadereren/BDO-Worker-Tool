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
let margin = { top: 150, right: 200, bottom: 20, left: 80 }; // Increased right margin
let width = 1500 - margin.left - margin.right + 150; // Increased width for legend
let height = 800 - margin.top - margin.bottom;

const xRange = d3.extent(nodeData, d => d.pos.x);
const yRange = d3.extent(nodeData, d => d.pos.y);

const xScale = (xRange[1] - xRange[0]) / width;
const yScale = (yRange[1] - yRange[0]) / height;

const scaleFactor = Math.max(xScale, yScale);

let xExtent = d3.extent(nodeData, d => d.pos.x);
let paddingFactor = 0.1; // 10% compression on each side
let adjustedDomain = [
    xExtent[0] - (xExtent[1] - xExtent[0]) * paddingFactor,
    xExtent[1] + (xExtent[1] - xExtent[0]) * paddingFactor
];

let X = d3.scaleLinear(adjustedDomain, [0, width]).nice();


let Y = d3.scaleLinear()
    .domain([yRange[0], yRange[0] + scaleFactor * height])
    .range([height, 0]);


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

// Create nodes
let nodes = svg.append("g") // TODO double click to buy // TODO highlight cheapest path (in CP) to an owned node using Breath First Search (BFS)
    .attr("class", "nodes")
    .selectAll(".node")
    .data(nodeData, ({ id }) => id)
    .enter()
    .append("g")
    .attr("class", "node")
    .style("fill", d => color(d.type)); // TODO highlight depending on whether it is owned

nodes.append("text")
    .style("fill", d => color(d.type))
    .attr("text-anchor", "middle")
    .attr("dy", "-0.7em")
    .style("user-select", "none")
    .text(({ name }) => name);

nodes.append("circle")
    .attr("r", 5) // TODO use symbols depending on type instead of circles
    .on("mouseover", updateTooltip)
    .on("mousemove", updateTooltip)
    .on("mouseout", hideTooltip);

// Draw legend
let legend = svg.append("g")
    .attr("class", "legends")
    .selectAll(".legend")
    .data(types) // Use the unique types from the dataset
    .enter()
    .append("g")
    .attr("class", "legend")
    .attr("transform", (_, i) => `translate(${width + 30}, ${i * 25})`); // Position legend to the right

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
    .style("fill", "#0066cc") // Adjust text color if necessary
    .text(d => d); // Display the type names

function draw({ transform }) {
    let x = transform.rescaleX(X);
    let y = transform.rescaleY(Y);

    xAxis.call(d3.axisBottom(x));
    yAxis.call(d3.axisLeft(y));

    nodes.selectAll("node"); // TODO dynamic filtering of nodes and edges using a GUI

    nodes.selectAll("text") // TODO hide text to prevent clutter, allow the user to adjust the zoom threshhold for when to show the text
        .attr("x", d => x(d.pos.x))
        .attr("y", d => y(d.pos.y));

        nodes.selectAll('circle')
        .attr("r", 5) // Set radius for circles
        .attr("cx", d => x(d.pos.x)) // Set x position
        .attr("cy", d => y(d.pos.y)) // Set y position
        .on("mouseover", updateTooltip) // Attach tooltip on hover
        .on("mousemove", updateTooltip) // Update tooltip position
        .on("mouseout", hideTooltip) // Hide tooltip on mouse out
        .on('dblclick', (e, d) => buy(e, d)); // Attach the double-click event
    

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
