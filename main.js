var H = 500, W = 500;
var canvas = document.createElement('canvas');
canvas.height = H;
canvas.width  = W;
document.body.appendChild(canvas);
var context = canvas.getContext('2d');
var pdbFile = './3kw7.pdb'
var molecule = new Molecule(pdbFile);
for(var i = 0; i < 630; i++) {
    setTimeout(function() {
        var ts = new Date().getTime();
        molecule.drawPoints(context);
        molecule.rotateXY(0.05);
        molecule.rotateXZ(0.05);
        var te = new Date().getTime();
        //console.log(te - ts);
    }, 100 * i);
}

function getAtoms(raw_text) {
    var atom_lines = raw_text.match(/ATOM\s+\S+.*?\n/g);
    var i = 0;
    var atoms = atom_lines.map(function(line) {
        var atom = new (function Atom(){
        })();
        atom.record_name = line.slice( 0,  7).trim();
        atom.id          = line.slice( 7, 13).trim() - 0;
        atom.name        = line.slice(13, 17).trim();
        atom.location    = line.slice(17, 18).trim();
        atom.residue     = line.slice(18, 22).trim();
        atom.chain       = line.slice(22, 23).trim();
        atom.residue_id  = line.slice(23, 27).trim() - 0;
        atom.attr8       = line.slice(27, 31).trim();
        atom.p3          = new P3(
            line.slice(31, 39).trim() - 0,
            line.slice(39, 47).trim() - 0,
            line.slice(47, 55).trim() - 0
        );
        atom.occupancy   = line.slice(55, 61).trim() - 0;
        atom.temp_factor = line.slice(61, 73).trim() - 0;
        atom.segment     = line.slice(73, 77).trim();
        atom.element     = line.slice(77, 79).trim();
        atom.charge      = line.slice(79    ).trim();
        atom.line = line;
        return atom;
    });
    return atoms;
}

function P3(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
}

function square(x) { return x * x }
// Takes a sphere (p3, r) and a volume (p3 0, which is x/y/z min, and p3 1,
// which is x/y/z max, and returns whether or not they intersect.
function sphereTouchesVolume(s, r, v0, v1) {
    var d2 = square(s.r)
    if     (s.x < c.x      ) d2 -= square(s.x - c.x      );
    else if(s.x < c.x + c.s) d2 -= square(s.x - c.x + c.s);
    if     (s.y < c.y      ) d2 -= square(s.y - c.y      );
    else if(s.y < c.y + c.s) d2 -= square(s.y - c.y + c.s);
    if     (s.z < c.z      ) d2 -= square(s.z - c.z      );
    else if(s.z < c.z + c.s) d2 -= square(s.z - c.z + c.s);
    return d2 >= 0;
}


function Molecule(pdbFile) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', pdbFile, false);
    xhr.send();
    var raw_text = xhr.response;
    this.atoms = getAtoms(raw_text);
    return this;
}
Molecule.prototype.getBounds = function() {
    var p3_min = new P3( Infinity,  Infinity,  Infinity);
    var p3_max = new P3(-Infinity, -Infinity, -Infinity);
    for(var i = 0; i < this.atoms.length; i++) {
        var atom = this.atoms[i];
        if(atom.p3.x < p3_min.x) p3_min.x = atom.p3.x;
        if(atom.p3.x > p3_max.x) p3_max.x = atom.p3.x;
        if(atom.p3.y < p3_min.y) p3_min.y = atom.p3.y;
        if(atom.p3.y > p3_max.y) p3_max.y = atom.p3.y;
        if(atom.p3.z < p3_min.z) p3_min.z = atom.p3.z;
        if(atom.p3.z > p3_max.z) p3_max.z = atom.p3.z;
    }
    return {min: p3_min, max: p3_max};
}
Molecule.prototype.rotateXY = function(theta) {
    var cos_theta = Math.cos(theta);
    var sin_theta = Math.sin(theta);
    for(var i = 0; i < this.atoms.length; i++) {
        var atom = this.atoms[i];
        var x = atom.p3.x, y = atom.p3.y, z = atom.p3.z;
        atom.p3.x =   x * cos_theta + y * sin_theta;
        atom.p3.y = - x * sin_theta + y * cos_theta;
    }
    
}
Molecule.prototype.rotateXZ = function(theta) {
    var cos_theta = Math.cos(theta);
    var sin_theta = Math.sin(theta);
    for(var i = 0; i < this.atoms.length; i++) {
        var atom = this.atoms[i];
        var x = atom.p3.x, y = atom.p3.y, z = atom.p3.z;
        atom.p3.x =   x * cos_theta + z * sin_theta;
        atom.p3.z = - x * sin_theta + z * cos_theta;
    }
    
}
Molecule.prototype.rotateYZ = function(theta) {
    var cos_theta = Math.cos(theta);
    var sin_theta = Math.sin(theta);
    for(var i = 0; i < this.atoms.length; i++) {
        var atom = this.atoms[i];
        var x = atom.p3.x, y = atom.p3.y, z = atom.p3.z;
        atom.p3.z =   z * cos_theta + y * sin_theta;
        atom.p3.y = - z * sin_theta + y * cos_theta;
    }
}
Molecule.prototype.getCenter = function() {
    var center = new P3(0, 0, 0);
    for(var i = 0; i < this.atoms.length; i++) {
        var atom = this.atoms[i];
        center.x += atom.p3.x;
        center.y += atom.p3.y;
        center.z += atom.p3.z;
    }
    center.x /= i;
    center.y /= i;
    center.z /= i;
    return center;
}
Molecule.prototype.drawPoints = function(context) {
    var H = context.canvas.height;
    var W = context.canvas.width;
    var bounds = this.getBounds();
    context.fillStyle = "white";
    context.fillRect(0, 0, W, H);
    var imgData = context.getImageData(0, 0, W, H);
    var bmx = bounds.min.x, bmy = bounds.min.y;
    var sx = bounds.max.x - bounds.min.x;
    var sy = bounds.max.y - bounds.min.y;
    var sz = bounds.max.z - bounds.min.z;
    var center = this.getCenter();
    var scale = Math.min(W, H) / Math.sqrt(sx*sx + sy*sy + sz*sz);
    function p3ToPixel(p3) {
        return {
            x: 0 | W / 2 + scale * (p3.x - center.x),
            y: 0 | H / 2 + scale * (p3.y - center.y)
        };
    }
    for(var i = 0; i < this.atoms.length; i++) {
        var atom = this.atoms[i];
        var pixel = p3ToPixel(atom.p3);
        var ptr = 4 * (pixel.y * W + pixel.x);
        imgData.data[ptr + 0] = 0;
        imgData.data[ptr + 1] = 0;
        imgData.data[ptr + 2] = 0;
        imgData.data[ptr + 3] = 255;
    }
    context.putImageData(imgData, 0, 0);
}

