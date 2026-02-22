// Smooth the traced SVG path by converting L segments to cubic Bezier curves
// using Catmull-Rom spline interpolation

const d = `M95.6,10 L102.9,14.4 L105.9,21.7 L105.9,37.9 L102.9,40.8 L101.5,54 L105.9,55.5 L105.9,62.8 L108.8,62.8 L122.0,77.5 L125.0,90.7 L129.4,96.6 L129.4,102.5 L133.8,105.4 L136.7,114.2 L141.1,118.6 L142.6,126 L148.4,133.3 L152.8,149.4 L158.7,159.7 L157.2,167.1 L161.7,172.9 L160.2,177.3 L163.1,180.3 L163.1,190.6 L169.0,197.9 L169.0,214 L166.1,217 L152.8,205.2 L149.9,197.9 L149.9,186.1 L147.0,181.7 L148.4,175.9 L144.0,168.5 L145.5,164.1 L139.6,152.4 L138.2,142.1 L129.4,130.4 L123.5,130.4 L120.6,137.7 L120.6,148 L117.6,149.4 L117.6,159.7 L120.6,162.7 L125.0,162.7 L125.0,165.6 L127.9,167.1 L125.0,208.2 L122.0,211.1 L110.3,211.1 L108.8,222.8 L111.7,231.7 L119.1,239 L133.8,246.3 L141.1,255.1 L149.9,255.1 L154.3,262.5 L171.9,272.8 L183.7,272.8 L182.2,306.5 L177.8,319.7 L170.5,321.2 L169.0,315.3 L171.9,312.4 L171.9,308 L161.7,288.9 L152.8,287.4 L147.0,280.1 L139.6,277.2 L133.8,271.3 L129.4,271.3 L98.5,253.7 L94.1,249.3 L86.8,227.2 L79.4,225.8 L79.4,230.2 L73.6,234.6 L70.6,241.9 L70.6,288.9 L69.2,300.6 L66.2,302.1 L72.1,324.1 L72.1,327.1 L69.2,328.5 L20.7,328.5 L17.8,325.6 L17.8,321.2 L39.8,315.3 L42.8,312.4 L42.8,305 L45.7,303.6 L45.7,262.5 L48.6,230.2 L51.6,227.2 L58.9,206.7 L57.4,181.7 L60.4,180.3 L58.9,170 L66.2,159.7 L73.6,156.8 L73.6,153.9 L70.6,152.4 L70.6,142.1 L75.0,136.2 L75.0,123 L78.0,117.2 L78.0,92.2 L83.9,80.5 L83.9,73.1 L80.9,70.2 L85.3,65.8 L85.3,61.4 L76.5,57 L73.6,46.7 L69.2,42.3 L72.1,39.4 L72.1,27.6 L76.5,20.3 L76.5,15.9 L88.3,10 L94.1,10`;

// Parse points
const pts = [];
const matches = d.matchAll(/(\d+\.?\d*),(\d+\.?\d*)/g);
for (const m of matches) {
    pts.push({ x: parseFloat(m[1]), y: parseFloat(m[2]) });
}

console.log(`Parsed ${pts.length} points`);

// Catmull-Rom to cubic Bezier conversion (closed curve)
const n = pts.length;
const tension = 0.35; // lower = smoother curves

function catmullRomToBezier(p0, p1, p2, p3) {
    const t = tension;
    return {
        cp1x: p1.x + (p2.x - p0.x) * t / 6,
        cp1y: p1.y + (p2.y - p0.y) * t / 6,
        cp2x: p2.x - (p3.x - p1.x) * t / 6,
        cp2y: p2.y - (p3.y - p1.y) * t / 6,
    };
}

let path = `M${pts[0].x},${pts[0].y}`;
for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const { cp1x, cp1y, cp2x, cp2y } = catmullRomToBezier(p0, p1, p2, p3);
    path += ` C${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x},${p2.y}`;
}
path += ` Z`;

console.log(`\nSmoothed path (${path.length} chars):\n`);
console.log(path);
