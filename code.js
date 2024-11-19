import nodeData from './nodes.json' with {type: 'json'};

// Generate edge data
let nodeMap = new Map(nodeData.map(d => [d.id, d]));
let edgeData = nodeData.flatMap(d => d.neighbors.filter(id => id > d.id).map(id => ({ source: d, target: nodeMap.get(id) })));

// Adjust dimensions and margins
let margin = { top: 150, right: 200, bottom: 20, left: 80 }; // Increased right margin
let width = 1500 - margin.left - margin.right + 150; // Increased width for legend
let height = 800 - margin.top - margin.bottom;

// x and y transformations from data points to canvas
let x = d3.scaleLinear(d3.extent(nodeData, d => d.pos.x), [0, width]).nice();
let y = d3.scaleLinear(d3.extent(nodeData, d => d.pos.y), [height, 0]).nice();

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
    .append("g")
    .attr("width", width)
    .attr("height", height)
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

// Add axes
let xAxis = svg.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(x));

let yAxis = svg.append("g")
    .attr("class", "y-axis")
    .call(d3.axisLeft(y));

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
        `);
}

function hideTooltip() {
    tooltip.classed("visible", false);
}

// Draw nodes
let nodes = svg.append("g")
    .attr("class", "nodes")
    .selectAll(".node")
    .data(nodeData, ({ id }) => id)
    .enter()
    .append("g")
    .attr("class", "node");

nodes.append("text")
    .attr("x", d => x(d.pos.x))
    .attr("y", d => y(d.pos.y))
    .style("fill", d => color(d.type))
    .attr("text-anchor", "middle")
    .attr("dy", "-0.7em")
    .style("user-select", "none")
    .text(({ name }) => name);

    nodes.append("circle")
    .attr("r", 5)
    .attr("cx", d => x(d.pos.x))
    .attr("cy", d => y(d.pos.y))
    .style("fill", d => color(d.type)) // Use the same color scale
    .on("mouseover", updateTooltip)
    .on("mousemove", updateTooltip)
    .on("mouseout", hideTooltip);


// Draw edges
let edges = svg.append("g")
    .attr("class", "edges")
    .selectAll(".edge")
    .data(edgeData, d => d.source.id + '-' + d.target.id)
    .enter()
    .append("path")
    .attr("class", "edge")
    .attr("d", d => d3.line()([[x(d.source.pos.x), y(d.source.pos.y)], [x(d.target.pos.x), y(d.target.pos.y)]]))
    .attr("stroke", "white")
    .attr("fill", "none")
    .on("mouseover", function () {
        d3.select(this).attr("stroke", "#ffaa00").attr("stroke-width", 4);
    })
    .on("mouseout", function () {
        d3.select(this).attr("stroke", "white").attr("stroke-width", 2);
    });


    
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






/*
    // create side panel
function showSidePanel() {
    // TODO show a GUI with some details for the node
} */