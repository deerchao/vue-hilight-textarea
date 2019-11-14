export default {
    createNode: function () {
        return createNode();
    },
    cloneNode: function (node) {
        const dest = createNode();
        cloneNode(node, dest);
        return dest;
    },
    collectRanges: function (node) {
        const buffer = [];
        collectRanges(node, buffer, 0);
        return buffer;
    },
    addRanges: function (node, values, sorted) {
        addRanges(node, values, sorted || false);
    },
    addRange: function (node, value) {
        addRange(node, value);
    },
    compareRanges: function (a, b) {
        return compareRanges(a, b);
    },
    createRange: function (value) {
        return createRange(value);
    }
};


function createNode(value) {
    return { value: value || null, children: [] };
}

function createRange(value) {
    if ('length' in value && 'end' in value)
        return { ...value };
    if ('length' in value)
        return {
            start: value.start,
            end: value.start + value.length,
            length: value.length,
            tag: value.tag || {}
        };
    return {
        start: value.start,
        end: value.end,
        length: value.end - value.start,
        tag: value.tag || {}
    };
}

function findParentNode(node, value) {
    // children must be ordered
    for (let i = 0; i < node.children.length; i++) {
        const c = node.children[i];
        if (!c.value)
            continue;
        if (c.value.start <= value.start && c.value.end >= value.end) {
            if (c.children.length === 0) return c;
            for (let j = 0; j < c.children.length; j++) {
                const n = findParentNode(c.children[j], value);
                if (n) return n;
            }
            return c;
        }
    }
    if (
        !node.value ||
        (node.value.start <= value.start && node.value.end >= value.end)
    )
        return node;

    return null;
}

function addRanges(node, values, sorted) {
    if (!sorted)
        values.sort(compareRanges);

    for (let i = 0; i < values.length; i++)
        addRange(node, values[i]);
}

function addRange(node, value) {
    const parent = findParentNode(node, value);
    if (!parent)
        return;
    for (let i = 0; i < parent.children.length; i++) {
        const sibling = parent.children[i];
        if (!sibling.value)
            continue;

        // sibling is before current node
        if (sibling.value.end <= value.start) continue;

        if (sibling.value.start >= value.end) {
            // sibling is after current node
            parent.children.splice(i, 0, createNode(value));
        } else if (
            sibling.value.start >= value.start &&
            sibling.value.end <= value.end
        ) {
            // current node cotains sibling, should happen with selections only
            let firstPart = createRange({
                start: value.start,
                end: sibling.value.start,
                tag: value.tag
            })
            let secondPart = createRange({
                start: sibling.value.start,
                length: sibling.value.length,
                tag: value.tag
            });
            let thirdPart = createRange({
                start: sibling.value.end,
                end: value.end,
                tag: value.tag
            });
            if (firstPart.length > 0) addRange(parent, firstPart);
            addRange(sibling, secondPart);
            if (thirdPart.length > 0) addRange(parent, thirdPart);
        } else if (
            sibling.value.start <= value.start &&
            sibling.value.end >= value.end
        ) {
            // sibling contains current node, should happen with selections only
            const part = {
                value: value,
                children: sibling.children
            };
            sibling.children = [part];
        } else if (sibling.value.start <= value.start) {
            // sibling's tail overlaps with current node
            let firstPart = createRange({
                start: value.start,
                end: sibling.value.end,
                tag: value.tag
            });
            let secondPart = createRange({
                start: sibling.value.end,
                end: value.end,
                tag: value.tag
            });
            if (firstPart.length > 0) addRange(sibling, firstPart);
            if (secondPart.length > 0) addRange(parent, secondPart);
        } else if (sibling.value.end >= value.end) {
            // sibling's head overlaps with current node
            let firstPart = createRange({
                start: value.start,
                end: sibling.value.start,
                tag: value.tag
            });
            let secondPart = createRange({
                start: sibling.value.start,
                end: value.end,
                tag: value.tag
            });
            if (firstPart.length > 0) addRange(parent, firstPart);
            if (secondPart.length > 0) addRange(sibling, secondPart);
        } else {
            throw new Error('Unknown relationship with sibling and current node');
        }
        return;
    }
    parent.children.push(createNode(value));
}

function collectRanges(node, buffer, index) {
    if (node.value !== null) {
        const value = {
            ...node.value,
        };
        value.tag = value.tag || {};
        value.tag = {...value.tag};
        value.tag.nodeIndex = index;
        buffer.push(value);
    }
    for (let i = 0; i < node.children.length; i++)
        collectRanges(node.children[i], buffer, i);
}

function cloneNode(source, dest) {
    dest.value = source.value ? createRange(source.value) : null;
    dest.children = [];
    for (let i = 0; i < source.children.length; i++) {
        const target = createNode();
        cloneNode(source.children[i], target);
        dest.children.push(target);
    }
}

function compareRanges(a, b) {
    if (a.start < b.start) return -1;
    if (a.start > b.start) return 1;
    // longer segments first
    if (a.length > b.length) return -1;
    if (a.length < b.length) return 1;
    return 0;
}
