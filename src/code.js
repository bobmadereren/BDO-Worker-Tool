import nodeData from './data/nodes.json' with {type: 'json'};
import investedData from './config/investedNodes.json' with {type: 'json'};
import * as d3 from 'd3';
import { Axe, Castle, createElement, createIcons, Factory, FishSymbol, Handshake, Landmark, Leaf, Package, Pickaxe, Shovel, TriangleAlert, UtilityPole, Wheat } from 'lucide';
import { shortestPath } from './graph/graph.js';
import { dependants } from './graph/graph.js';

// Replace implicit referance to a node through its ids with a pointer to the node
let nodeMap = new Map(nodeData.map(d => [d.id, d]));
nodeData.forEach(node => node.neighbors = node.neighbors.map(id => nodeMap.get(id)));
let investedNodes = new Set(investedData.map(id => nodeMap.get(id)));
let edgeData = nodeData.flatMap(node => node.neighbors.filter(neighbor => node.id < neighbor.id).map(neighbor => ({ source: node, target: neighbor })));
nodeMap = null;

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

// Define the transformation sending the world to the svg
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
let tooltip = d3.select("body")
    .append("div")
    .attr("class", "node-tooltip");

function updateTooltip(node) {
    tooltip.selectAll("div").remove();

    tooltip.append("div").node().append(node.name, createElement(icons[node.type]));
    tooltip.append("div").text(node.territory);
    tooltip.append("div").text("CP: " + node.cp);
}

function positionTooltip(e) {
    tooltip
        .style("left", e.pageX + "px")
        .style("top", e.pageY + "px");
}

function showTooltip() {
    tooltip.classed("visible", true);
}

function hideTooltip() {
    tooltip.classed("visible", false);
}

// Highlight
function highlightShortestPath(node) {
    let path = shortestPath(node, node => investedNodes.has(node), node => node.neighbors, node => node.cp);
    let pathSet = new Set(path);

    nodes.classed("highlight", node => pathSet.has(node));
    edges.classed("highlight", ({ source, target }) => pathSet.has(source) && pathSet.has(target));
}

function highlightDependants(node) {
    let deps = dependants(node, node => node.neighbors.filter(node => investedNodes.has(node)), node => node.cp == 0);
    let depsSet = new Set(deps);

    nodes.classed("highlight", node => depsSet.has(node));
    edges.classed("highlight", edge => depsSet.has(edge.source) && depsSet.has(edge.target));
}

function lowlight() {
    nodes.classed("highlight", false);
    edges.classed("highlight", false);
}

// Total CP
let totalCP = d3.select("body")
    .append("div")
    .attr("id", "total-cp");

function updateTotalCP() {
    let cp = [...investedNodes].reduce((sum, { cp }) => sum + cp, 0);
    totalCP.text("Total CP Spent: " + cp);
}

// Buy / Sell
function invest(node) {
    let path = shortestPath(node, node => investedNodes.has(node), node => node.neighbors, node => node.cp);

    for (let node of path)
        investedNodes.add(node);

    nodes.classed("invested", node => investedNodes.has(node));
    edges.classed("source-invested", edge => investedNodes.has(edge.source));
    edges.classed("target-invested", edge => investedNodes.has(edge.target));

    highlightDependants(node);
    updateTotalCP();
}

function sell(node) {
    let deps = dependants(node, node => node.neighbors.filter(node => investedNodes.has(node)), node => node.cp == 0);

    for (let node of deps)
        investedNodes.delete(node);

    nodes.classed("invested", node => investedNodes.has(node));
    edges.classed("source-invested", edge => investedNodes.has(edge.source));
    edges.classed("target-invested", edge => investedNodes.has(edge.target));

    highlightShortestPath(node);
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
    .classed("source-invested", edge => investedNodes.has(edge.source))
    .classed("target-invested", edge => investedNodes.has(edge.target));

// Create nodes
let nodes = svg.append("g")
    .attr("id", "nodes")
    .selectAll(".node")
    .data(nodeData)
    .enter()
    .append("g")
    .attr("class", "node")
    .classed("invested", node => investedNodes.has(node))
    .on("mouseenter.tooltip", (e, node) => {
        updateTooltip(node);
        positionTooltip(e);
        showTooltip();
    })
    .on("mousemove.tooltip", positionTooltip)
    .on("mouseleave.tooltip", hideTooltip)
    .on("mouseenter.path", (_, node) => investedNodes.has(node) ? highlightDependants(node) : highlightShortestPath(node))
    .on("mouseleave.path", lowlight)
    .on('click', (e, node) => e.ctrlKey || e.metaKey ? investedNodes.has(node) ? sell(node) : invest(node) : showSidePanel(node));

nodes.append("text")
    .text(({ name }) => name);

nodes.append(d => createElement(icons[d.type]))
    .attr("class", "icon");

// Create legend
let legends = d3.select("body")
    .append("div")
    .attr("id", "legends")
    .selectAll(".legend")
    .data(Object.keys(icons))
    .enter()
    .append("label")
    .attr("class", "legend");

legends.append("input")
    .attr("type", "checkbox")
    .property("hidden", true)
    .on("click", legendFilter)
    .property("checked", true);

legends.append(type => createElement(icons[type]));
legends.append("text").text(type => type);

// Filter
function legendFilter(e, type) {

    nodes.filter(node => node.type == type)
        .classed("filtered", !e.target.checked);

    edges.filter(edge => edge.source.type == type)
        .classed("source-filtered", !e.target.checked);

    edges.filter(edge => edge.target.type == type)
        .classed("target-filtered", !e.target.checked);

}

// Draw
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

// Side Panel
let sidePanel = d3.select("body")
    .append("div")
    .attr("id", "side-panel");

sidePanel.append("h3")
    .text("Node Details");

let sidePanelContent = sidePanel.append("div")
    .attr("id", "side-panel-content");

function showSidePanel(node) {
    sidePanel.classed("hidden", false);

    sidePanelContent.html(`
        <div><strong>Name:</strong> ${node.name}</div>
        <div><strong>Type:</strong> ${node.type}</div>
        <div><strong>Territory:</strong> ${node.territory}</div>
        <div><strong>Contribution Points:</strong> ${node.cp}</div>
        <div><strong>Yield:</strong> ${node.yield || 'N/A'}</div>
        <div><strong>Luck Yield:</strong> ${node.luckYield || 'N/A'}</div>
        <div><strong>Is Subnode:</strong> ${node.subNode ? 'Yes' : 'No'}</div>
        <div><strong>Is Monopoly Node:</strong> ${node.isMonopoly ? 'Yes' : 'No'}</div>
    `);

    sidePanelContent.append("button")
        .attr("id", "invest-button")
        .text(investedNodes.has(node) ? "Sell" : "Invest")
        .on("click", () => investedNodes.has(node) ? sell(node) : invest(node));

}

function hideSidePanel() {
    sidePanel.classed("hidden", true);
}

// Initial render
svg.call(zoom.transform, d3.zoomIdentity);

// Initial CP display
updateTotalCP();

// Search and Filter Functionality
function searchFilter(e) {
    let search = new RegExp(e.target.value, 'i');
    
    nodes.classed('search-filtered', node => !search.test(node.name));
    edges.classed('source-search-filtered', edge => !search.test(edge.source.name));
    edges.classed('target-search-filtered', edge => !search.test(edge.target.name));
}

let searchInput = d3.select("body")
    .append("div")
    .attr("id", "controls")
    .append("input")
    .attr("type", "text")
    .attr("id", "node-search")
    .attr("placeholder", "Search nodes...")
    .on("input", searchFilter);
