import { MinPriorityQueue } from '@datastructures-js/priority-queue';
import nodeData from './nodes.json' with {type: 'json'};
import ownedArray from './owned.json' with {type: 'json'};
import * as d3 from 'd3';
import { createElement, icons, UtilityPole } from 'lucide';

// Adjust position of total CP dynamically
document.getElementById('total-cp').style.right = `${100}px`; // Adjust if needed
document.getElementById('total-cp').style.top = `${20}px`; // Adjust to align with the legend

let owned = new Set(ownedArray);

/**
 * Shortest path from a node to any owned node.
 * @param {Number} id Id of the source node.
 * @return {Array} an array containing the ids of for nodes in the path starting from the source node, ending in an owned node.
 */
function shortestPath(id) {
    let graph = new Map(nodeData.map(({ id, cp, neighbors }) => [id, { id, cp, neighbors }]));

    let path = function (v) {
        if (v.prev == undefined) return [v.id];
        let result = path(v.prev);
        result.push(v.id);
        return result;
    };

    let q = new MinPriorityQueue(v => v.d);

    let s = graph.get(id);
    s.d = s.cp;
    q.enqueue(s);

    while (!q.isEmpty()) {
        let v = q.dequeue();
        if (owned.has(v.id)) return path(v);
        for (let u of v.neighbors.map(id => graph.get(id)).filter(({ d }) => d == undefined)) {
            u.d = v.d + u.cp;
            u.prev = v;
            q.enqueue(u);
        }
    }

    return [];
}

function highlightShortestPath(_, d) {
    let path = shortestPath(d.id);
    for (let id of path) {
        d3.select("#i" + id)
            .select('image')
            .style("opacity", 0.5);
    }
}

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
        .select('image') // Update the node's image
        .style('opacity', 1); // Example: Change opacity to indicate ownership

    // Optional: Update the tooltip
    updateTooltip(e, d);

    // Update the total CP display
    document.getElementById('total-cp').textContent = `Total CP Spent: ${calculateTotalCP()}`;

    alert(`House bought at ${d.name}!`);
}

function calculateTotalCP() {
    let totalCP = 0;
    owned.forEach(nodeId => {
        const node = nodeMap.get(nodeId);
        if (node && node.cp) {
            totalCP += node.cp;
        }
    });
    return totalCP;
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

// Flag to track node name visibility
let nodeNamesVisible = true;

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
    .attr("id", ({ id }) => "i" + id)
    .attr("class", "node");

nodes.append("text")
    .style("fill", d => color(d.type))
    .attr("text-anchor", "middle")
    .attr("dy", "-0.7em")
    .style("user-select", "none")
    .style("opacity", 1) // Ensure default opacity is set
    .text(({ name }) => name);

nodes.append(() => createElement(UtilityPole))
    .attr("class", "icon")
    /*
    .attr("xlink:href", d => {
        // Provide different image paths based on the type of node
        switch (d.type) {
            case 'Connection':
                return 'images/Connection.png';
            case 'Town':
                return 'images/Town.png';
            case 'City':
                return 'images/City.png';
            case 'Gateway':
                return 'images/Gateway.png';
            case 'Farming':
                return 'images/Farming.png';
            case 'Trade':
                return 'images/Trade.png';
            case 'Gathering':
                return 'images/Gathering.png';
            case 'Mining':
                return 'images/Mining.png';
            case 'Lumbering':
                return 'images/Lumbering.png';
            case 'Danger Zone':
                return 'images/Danger Zone.png';
            case 'Investment Bank':
                // Check subtype to differentiate between Monopoly and CP
                if (d.subtype === 'Monopoly') {
                    return 'images/InvestmentBankMonopoly.png';
                } else if (d.subtype === 'CP') {
                    return 'images/InvestmentBankCP.png';
                }
                return 'images/InvestmentBank.png'; // Default for undefined subtype
            case 'Fish Drying Yard':
                return 'images/FishDryingYard.png';
            case 'Specialties':
                return 'images/Specialties.png';
            case 'Production':
                return 'images/Production.png';
            case 'Excavation':
                return 'images/Excavation.png';
            default:
                return 'images/default.png'; // Fallback for unknown types
        }
    })
    */
    //.attr("width", 1500)
    //.attr("height", 200)
    .on("mouseover.tooltip", updateTooltip)
    .on("mouseover.path", highlightShortestPath)
    .on("mousemove", updateTooltip)
    .on("mouseout", hideTooltip)
    .on('dblclick', (e, d) => {
        e.stopPropagation(); // Prevent zoom on double-click
        buy(e, d);
    });



// Draw legend
let legend = svg.append("g")
    .attr("class", "legends")
    .selectAll(".legend")
    .data(types) // Use the unique types from the dataset
    .enter()
    .append("g")
    .attr("class", "legend")
    .attr("transform", (_, i) => `translate(${width - 2500}, ${i * 40})`); // Position legend to the left

legend.append("image")
    .attr("xlink:href", d => {
        switch (d) {
            case 'Connection':
                return 'images/Connection.png';
            case 'Town':
                return 'images/Town.png';
            case 'City':
                return 'images/City.png';
            case 'Gateway':
                return 'images/Gateway.png';
            case 'Farming':
                return 'images/Farming.png';
            case 'Trade':
                return 'images/Trade.png';
            case 'Gathering':
                return 'images/Gathering.png';
            case 'Mining':
                return 'images/Mining.png';
            case 'Lumbering':
                return 'images/Lumbering.png';
            case 'Danger Zone':
                return 'images/Danger Zone.png';
            case 'Investment Bank':
                // Use specific images for subtypes in the legend
                if (d.subtype === 'Monopoly') {
                    return 'images/InvestmentBankMonopoly.png';
                } else if (d.subtype === 'CP') {
                    return 'images/InvestmentBankCP.png';
                }
                return 'images/InvestmentBank.png';
            case 'Fish Drying Yard':
                return 'images/FishDryingYard.png';
            case 'Specialties':
                return 'images/Specialties.png';
            case 'Production':
                return 'images/Production.png';
            case 'Excavation':
                return 'images/Excavation.png';
            default:
                return 'images/default.png'; // Optional fallback
        }
    })
    .attr("width", 18)  // Adjust size as needed
    .attr("height", 18)
    .attr("x", 0)
    .attr("y", -9);


// Add text labels for the legend
legend.append("text")
    .attr("x", 25)
    .attr("y", 0)
    .style("text-anchor", "start")
    .style("font-size", "14px")
    .style("font-weight", "bold")
    .style("fill", "#FFFFFF") // Adjust text color if necessary
    .text(d => d);

let textSize = d3.scaleLog([1, 500], [0, 20]);
let iconSize = d3.scaleLog([1, 500], [10, 75]);

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

function showSidePanel(d) {
    let sidePanel = d3.select("#side-panel");
    sidePanel.classed("hidden", false);

    // Display node details, including yield, luckYield, subnode status, and monopoly status
    d3.select("#side-panel-content").html(`
        <div><strong>Name:</strong> ${d.name}</div>
        <div><strong>Type:</strong> ${d.type}</div>
        <div><strong>Territory:</strong> ${d.territory}</div>
        <div><strong>Contribution Points:</strong> ${d.cp}</div>
        <div><strong>Yield:</strong> ${d.yield || 'N/A'}</div>
        <div><strong>Luck Yield:</strong> ${d.luckYield || 'N/A'}</div>
        <div><strong>Is Subnode:</strong> ${d.subNode ? 'Yes' : 'No'}</div>
        <div><strong>Is Monopoly Node:</strong> ${d.isMonopoly ? 'Yes' : 'No'}</div>
        <button id="buy-button">Buy House</button>
    `);

    // Add functionality for buying a house from the side panel
    d3.select("#buy-button").on("click", function (e) {
        e.stopPropagation(); // Prevent any unwanted propagation of the click event

        if (d.neighbors.some(neighborId => owned.has(neighborId))) {
            buy(e, d); // Trigger the buy function to complete the purchase
            d3.select("#buy-button").property("disabled", true);
            showSidePanel(d); // Refresh side panel to update details
        } else {
            alert("You cannot buy this house. Make sure a neighboring node is owned.");
        }
    });
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

// Initial CP display
document.getElementById('total-cp').textContent = `Total CP Spent: ${calculateTotalCP()}`;
