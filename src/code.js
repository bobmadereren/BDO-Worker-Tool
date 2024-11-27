import nodeData from './data/nodes.json' with {type: 'json'};
import investedData from './config/investedNodes.json' with {type: 'json'};
import * as d3 from 'd3';
import { Axe, Castle, createElement, createIcons, Factory, FishSymbol, Handshake, Landmark, Leaf, Package, Pickaxe, Shovel, TriangleAlert, UtilityPole, Wheat } from 'lucide';
import { shortestPath } from './graph/graph.ts';

// Replace implicit referance to a node through its ids with a pointer to the node
let nodeMap = new Map(nodeData.map(d => [d.id, d]));
nodeData.forEach(node => node.neighbors = node.neighbors.map(id => nodeMap.get(id)));
let investedNodes = new Set(investedData.map(id => nodeMap.get(id)));
let edgeData = nodeData.flatMap(node => node.neighbors.filter(neighbor => node.id < neighbor.id).map(neighbor => ({ source: node, target: neighbor })));

/**
 * Icons to use for different node types
 */
let icons = {
    'Connection': UtilityPole,
    'Town': Castle,
    'City': Castle,
    'Gateway': UtilityPole,
    'Farming': Wheat,
    'Trade': Handshake,
    'Gathering': Leaf,
    'Mining': Pickaxe,
    'Lumbering': Axe,
    'Danger Zone': TriangleAlert,
    'Investment Bank': Landmark,
    'Fish Drying Yard': FishSymbol,
    'Specialties': Package,
    'Production': Factory,
    'Excavation': Shovel,
}

// d3 margin convention
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

// Zoom
let zoom = d3.zoom()
    .translateExtent([[0, 0], [width + margin.left + margin.right, height + margin.top + margin.bottom]])
    .scaleExtent([1, 500])
    .on("zoom", draw);

// Node size scaling with zoom
let textSize = d3.scaleLog(zoom.scaleExtent(), [0, 20]);
let iconSize = d3.scaleLog(zoom.scaleExtent(), [10, 75]);

/**
 * Highlights the shortest path in terms of CP from a node to any node that has been invested in.
 */
function highlightShortestPath(_, node) {
    let { path, cost } = shortestPath(node, node => investedNodes.has(node), ({ neighbors }) => neighbors, ({ cp }) => cp);
    let pathSet = new Set(path);
    nodes.filter(d => pathSet.has(d))
        .attr("highlight", '');
}

// Create SVG
let svg = d3.select("body")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .style("display", "block")
    .style("margin", "0 auto")
    .style("cursor", "crosshair")
    .call(zoom)
    .append("g")
    .attr("width", width)
    .attr("height", height)
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

// Tootlip
function updateTooltip(e, node) {
    d3.select(".body")
        .append(document.createElement("node-tooltip"))
        .style("left", e.pageX + "px")
        .style("top", e.pageY + "px")
    //.classed("visible", true);

    /*
    tooltip.select("#icon").html(createElement(icons[d.type]));
    tooltip.select("#name").text(d.name);
    tooltip.select("#territory").text(d.territory);
    tooltip.select("#cp").text(d.cp);
    tooltip.select("#invest-sell").text("Use the side panel to invest or sell.");
    */
}

function hideTooltip() {
    d3.select("#node-tooltip").classed("visible", false);
}

function updateTotalCP() {
    let cp = [...investedNodes].reduce((sum, { cp }) => sum + cp, 0);
    d3.select('#total-cp').text("Total CP Spent: " + cp);
}

function invest({ target }, node) {
    investedNodes.add(node);

    d3.select(target)
        .classed('invested', true);

    updateTooltip(e, d);
    updateTotalCP();
}

function sell({ target }, node) {
    investedNodes.delete(d);

    d3.select(target)
        .classed('invested', false);

    updateTooltip(e, d);
    updateTotalCP();
}

// Create edges
let edges = svg.append("g")
    .attr("id", "edges")
    .selectAll(".edge")
    .data(edgeData)
    .enter()
    .append("path")
    .attr("class", "edge")
    .attr("invested", edge => investedNodes.has(edge.source) + investedNodes.has(edge.target));

// Create nodes
let nodes = svg.append("g")
    .attr("id", "nodes")
    .selectAll(".node")
    .data(nodeData)
    .enter()
    .append("g")
    .attr("class", "node")
    .on("click", showSidePanel)
    .on("mouseover.tooltip", updateTooltip)
    .on("mousemove", updateTooltip)
    .on("mouseout.tooltip", hideTooltip)
    .on("mouseover.path", highlightShortestPath)
    .on("mouseout.path", () => nodes.attr("highlight", undefined))
    .on('dblclick', (e, d) => {
        e.stopPropagation();
        showSidePanel(e, d);
    });

nodes.append("text")
    .text(({ name }) => name);

nodes.append(d => createElement(icons[d.type]))
    .attr("class", "icon");

// Create legend with toggle functionality
d3.select("#legends")
    .selectAll(".legend")
    .data(Object.keys(icons))
    .join(enter => {
        let div = enter.append("div")
            .attr("class", "legend active") // Start with all legends active
            .on("click", function (event, type) {
                const legendItem = d3.select(this);
                const isActive = legendItem.classed("active");

                // Toggle between active and inactive states
                legendItem
                    .classed("active", !isActive)
                    .classed("inactive", isActive);

                // Collect all active types
                const activeTypes = new Set(
                    d3.selectAll(".legend.active")
                        .data()
                );

                // Update nodes and edges visibility
                nodes.style('opacity', d =>
                    activeTypes.has(d.type) ? 1 : 0.1 // Show nodes of active types
                );

                edges.style('opacity', d =>
                    activeTypes.has(d.source.type) || activeTypes.has(d.target.type) ? 1 : 0.1 // Show edges with active nodes
                );
            });

        // Append icon and name
        div.append(d => createElement(icons[d]))
            .attr("class", "legend-icon");
        div.append("text").text(d => d);
    });


function draw({ transform }) {
    let x = x => transform.applyX(X(x));
    let y = y => transform.applyY(Y(y));
    let k = transform.k;

    nodes.selectAll("text")
        .attr("x", d => x(d.pos.x))
        .attr("y", d => y(d.pos.y) - iconSize(k))
        .style("font-size", textSize(k) + "px");

    nodes.selectAll('svg')
        .attr("width", iconSize(k))
        .attr("height", iconSize(k))
        .attr("x", d => x(d.pos.x) - iconSize(k) / 2)
        .attr("y", d => y(d.pos.y) - iconSize(k));

    edges.attr("d", d => line([[x(d.source.pos.x), y(d.source.pos.y)], [x(d.target.pos.x), y(d.target.pos.y)]]));
}

function showSidePanel(_, node) {
    let sidePanel = d3.select("#side-panel");
    sidePanel.classed("hidden", false);

    // Display node details
    d3.select("#side-panel-content").html(`
        <div><strong>Name:</strong> ${node.name}</div>
        <div><strong>Type:</strong> ${node.type}</div>
        <div><strong>Territory:</strong> ${node.territory}</div>
        <div><strong>Contribution Points:</strong> ${node.cp}</div>
        <div><strong>Yield:</strong> ${node.yield || 'N/A'}</div>
        <div><strong>Luck Yield:</strong> ${node.luckYield || 'N/A'}</div>
        <div><strong>Is Subnode:</strong> ${node.subNode ? 'Yes' : 'No'}</div>
        <div><strong>Is Monopoly Node:</strong> ${node.isMonopoly ? 'Yes' : 'No'}</div>
    `);

    const sidePanelContent = d3.select("#side-panel-content");

    // Check conditions and add appropriate button
    if (!investedNodes.has(node) && node.neighbors.some(neighbor => investedNodes.has(neighbor))) {
        // Add invest Button
        sidePanelContent.append("button")
            .attr("id", "invest-button")
            .style("background-color", "green")
            .style("color", "white")
            .text("invest node")
            .on("click", function (e) {
                e.stopPropagation();
                invest(e, node);
                showSidePanel(_, node); // Refresh side panel
            });
    }

    if (investedNodes.has(node)) {
        // Add Sell Button
        sidePanelContent.append("button")
            .attr("id", "sell-button")
            .style("background-color", "green")
            .style("color", "white")
            .text("Sell node")
            .on("click", function (e) {
                e.stopPropagation();
                sell(e, node);
                showSidePanel(_, node); // Refresh side panel
            });
    }
}

function hideSidePanel() {
    d3.select("#side-panel").classed("hidden", true);
}

// Hide panel when clicking outside nodes
d3.select("body").on("click", function (e) {
    if (!e.target.closest(".node") && !e.target.closest("#side-panel")) {
        hideSidePanel();
    }
});

// Initial render
svg.call(zoom.transform, d3.zoomIdentity);

// Initial CP display
updateTotalCP();

// Search and Filter Functionality
let searchInput = document.getElementById('node-search');
searchInput.addEventListener('input', function () {
    let query = searchInput.value.toLowerCase();
    nodes.style('opacity', d => (d.name.toLowerCase().includes(query) ? 1 : 0.1));
    edges.style('opacity', d => {
        let sourceMatch = d.source.name.toLowerCase().includes(query);
        let targetMatch = d.target.name.toLowerCase().includes(query);
        return sourceMatch || targetMatch ? 1 : 0.1;
    });
});