import nodeData from './nodes.json' with {type: 'json'};

let nodeMap = new Map(nodeData.map(d => [d.id, d]));

let edgeData = nodeData.flatMap(d => d.neighbors.map(id => ({ source: d, target: nodeMap.get(id) })));

let margin = { top: 150, right: 80, bottom: 20, left: 80 };
let width = 1500 - margin.left - margin.right;
let height = 800 - margin.top - margin.bottom;

let x = d3.scaleLinear(d3.extent(nodeData, d => d.pos.x), [0, width]);
let y = d3.scaleLinear(d3.extent(nodeData, d => d.pos.y), [height, 0]);
let color = d3.scaleOrdinal(nodeData.map(({ type }) => type), d3.schemePaired);

let svg = d3.select("body")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .style("display", "block")  // Make the SVG block element
    .style("margin", "0 auto")  // Center the block element
    .append("g")
    .attr("width", width)
    .attr("height", height)
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

let xAxis = svg.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(x));

let yAxis = svg.append("g")
    .attr("class", "y-axis")
    .call(d3.axisLeft(y));

let tooltip = d3.select("body")
    .append("div")
    .attr("class", "node-tooltip")
    .style("position", "absolute")
    .style("width", "240px")
    .style("height", "4.5em")
    .style("color", "white")
    .style("background", "grey")
    .style("visibility", "hidden");

tooltip.append("text").attr("id", "name");
tooltip.append("br");
tooltip.append("text").attr("id", "type");
tooltip.append("br");
tooltip.append("text").attr("id", "territory");
tooltip.append("br");
tooltip.append("text").attr("id", "cp");

function updateTooltip(e, d) {
    tooltip.style("left", (e.pageX + 9) + "px")
        .style("top", (e.pageY - 43) + "px")
        .style("visibility", "visible");

    tooltip.select("#name").text(d.name);
    tooltip.select("#type").text("Type: " + d.type);
    tooltip.select("#territory").text("Territory: " + d.territory);
    tooltip.select("#cp").text("CP: " + d.cp);
}

let nodes = svg.append("g")
    .attr("class", "nodes")
    .selectAll(".node")
    .data(nodeData)
    .enter()
    .append("g")
    .attr("class", "node");

nodes.append("text")
    .attr("x", d => x(d.pos.x))
    .attr("y", d => y(d.pos.y))
    .style("fill", d => color(d.type))
    .attr("text-anchor", "middle")  // Center the text horizontally
    .attr("dy", "-0.7em")  // Position the text above the circle
    .style("user-select", "none")
    .text(({ name }) => name);

nodes.append("circle")
    .attr("r", 5)
    .attr("cx", d => x(d.pos.x))
    .attr("cy", d => y(d.pos.y))
    .style("fill", d => color(d.type))
    .on("mouseover", updateTooltip)
    .on("mousemove", updateTooltip)
    .on("mouseout", () => tooltip.style("visibility", "hidden"));

let link = d3.link(d3.curveBumpX);

let edges = svg.append("g")
    .attr("class", "edges")
    .selectAll(".edge")
    .data(edgeData)
    .enter()
    .append("g")
    .attr("class", "edge")
    .append("path")
    .attr("d", d => link({ source: [x(d.source.pos.x), y(d.source.pos.y)], target: [x(d.target.pos.x), y(d.target.pos.y)] }))
    .attr("fill", "none")
    .attr("stroke", "white");


let legend = svg.append("g")
    .attr("class", "legends")
    .selectAll(".lengends")
    .data(color.domain())
    .enter()
    .append("g")
    .attr("class", "legend")
    .attr("transform", (_, i) => `translate(0, ${i * 20})`);

legend.append("rect")
    .attr("x", width - 18)
    .attr("width", 18)
    .attr("height", 18)
    .style("fill", color);

legend.append("text")
    .attr("x", width - 24)
    .attr("y", 9)
    .attr("dy", ".35em")
    .style("text-anchor", "end")
    .style("fill", color)
    .text(d => d);
