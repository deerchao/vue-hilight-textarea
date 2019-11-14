function selectionEquals(a, b) {
    if (a === b) return true;
    if (!a || !b) return false;

    return (
        a.start === b.start && a.end === b.end && a.direction === b.direction
    );
}

function normalizeSelection(s) {
    if (!s)
        return { direction: "forward", start: 0, end: 0 };

    if (s.start === undefined)
        s.start = 0;

    if (s.end === undefined)
        s.end = 0;

    if (s.direction !== 'forward' && s.direction !== 'backward')
        s.direction = 'forward';

    return s;
}

export { selectionEquals, normalizeSelection };
