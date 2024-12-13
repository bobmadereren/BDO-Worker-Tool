
/**
 * All dependants of a node.
 * 
 * A node ```B``` is dependent on a node ```A``` if ```B = A``` or if ```B``` is not connected to a root in ```Graph - A```.
 * @param {T} node The node for which to find dependants.
 * @param {(node:T) => Iterable<T>} neighbors Neighbors of a node.
 * @param {(node:T) => Boolean} root Whether a node is a root or not.
 * @returns {Set<T>}
 */
function dependants(node, neighbors, root) {

    let dependants = [node];
    let sources = [...neighbors(node)];

    while (sources.length > 0) {
        let [source] = sources;
        let marked = new Set();
        let stack = [source];

        while (stack.length > 0) {
            let n = stack.pop();
            if (marked.has(n)) continue;
            marked.add(n);

            for (let neighbor of neighbors(n))
                if (neighbor != node)
                    stack.push(neighbor);
        }

        sources = sources.filter(source => !marked.has(source));

        if (![...marked].some(root)) dependants.push(...marked);
    }

    return dependants;
}

export { dependants };
