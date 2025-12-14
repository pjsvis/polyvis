export function dotProduct(a, b) {
    if (!a || !b) return 0;
    
    // Handle JSON parsing if necessary (SQLite returns JSON strings or blobs sometimes)
    // But typically via bun:sqlite it might be a FloatWrapper or typed array.
    // In sql.js (browser), it's often a Uint8Array or Array.
    
    let vecA = a;
    let vecB = b;

    if (typeof a === 'string') vecA = JSON.parse(a);
    if (typeof b === 'string') vecB = JSON.parse(b);

    if (vecA.length !== vecB.length) return 0;

    let dot = 0;
    for (let i = 0; i < vecA.length; i++) {
        dot += vecA[i] * vecB[i];
    }
    return dot;
}
