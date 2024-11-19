import nodeData from './nodes.json' with {type: 'json'};

// Generate edge data
let nodeMap = new Map(nodeData.map(d => [d.id, d]));
let edgeData = nodeData.flatMap(d => d.neighbors.filter(id => id > d.id).map(id => ({ source: d, target: nodeMap.get(id) })));

// Dimensions and margins
let margin = { top: 150, right: 80, bottom: 20, left: 80 };
let width = 1500 - margin.left - margin.right;
let height = 800 - margin.top - margin.bottom;

// x and y transformations from data points to canvas
let x = d3.scaleLinear(d3.extent(nodeData, d => d.pos.x), [0, width]).nice();
let y = d3.scaleLinear(d3.extent(nodeData, d => d.pos.y), [height, 0]).nice();

// Color categories
let color = d3.scaleOrdinal(nodeData.map(({ type }) => type), d3.schemePaired);

// Create SVG
let svg = d3.select("body")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
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
    .style("fill", d => color(d.type))
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
