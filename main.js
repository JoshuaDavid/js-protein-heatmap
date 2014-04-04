/*
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
//*/

function getAtoms(raw_text) {
    var atom_lines = raw_text.match(/ATOM\s+\S+.*?\n/g);
    // Radii of common atoms, in angstroms
    var radii = {
        'H' : 0.25,
        'C' : 0.70,
        'N' : 0.65,
        'O' : 0.60,
        'P' : 1.00,
        'S' : 1.00
    }
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
        atom.radius 
        return atom;
    });
    return atoms;
}

function P3(x, y, z) {
    if(this === window) return new P3(x, y, z);
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
}

function square(x) { return x * x }
/**
 *  Take a point, and a volume defined by min x, y, z and max x, y, z and return
 *  the distance between that point and the closest vertex, edge, or surface of
 *  that volume squared (squared for performance reasons, as sqrt is expensive)
 */
function pointVolumeDistance2(p, v0, v1) {
    var d2 = 0;
    if     (p.x < v0.x) d2 += square(v0.x - p.x);
    else if(p.x > v1.x) d2 += square(v1.x - p.x);
    if     (p.x < v0.x) d2 += square(v0.x - p.x);
    else if(p.x > v1.x) d2 += square(v1.x - p.x);
    if     (p.x < v0.x) d2 += square(v0.x - p.x);
    else if(p.x > v1.x) d2 += square(v1.x - p.x);
    return d2;
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
// Absolute minimal drawing method -- each atom is a black pixel. Very fast (~30ms)
Molecule.prototype.drawPoints = function(context) {
    var H = context.canvas.height;
    var W = context.canvas.width;
    var bounds = this.getBounds();
    context.fillStyle = "white";
    context.fillRect(0, 0, W, H);
    var imgData = context.getImageData(0, 0, W, H);
    var s = new P3(bounds.max.x - bounds.min.x, bounds.max.y - bounds.min.y, bounds.max.z - bounds.min.z);
    var center = this.getCenter();
    var scale = Math.min(W, H) / Math.sqrt(s.x*s.x + s.y*s.y + s.z*s.z);
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
Molecule.prototype.getBoundary = function(probeSize) {
    var bounds = this.getBounds();
    var ts = new Date().getTime();
    var atoms = this.atoms;
    /**
     * Create three 3d grids of voxels. The first will say what the closest atom
     * to that voxel is. The second will say what the distance from that atom
     * to that voxel is. If the distance is 0, that means that the atom is inside
     * of the voxel. The third grid says which atoms are inside of that voxel.
     */
    // Yes, I do deserve to be shot for the function name. I don't know what to call it
    // yet, though, because at this point I'm not entirely sure I know what it will be doing.
    function subdivide(atoms, bounds) {
        var s = new P3(bounds.max.x - bounds.min.x, bounds.max.y - bounds.min.y, bounds.max.z - bounds.min.z);
        var closestAtoms = [];
        var distances2   = [];
        var atomsInside  = [];
        for(var i = 0; i < this.atoms.length; i++) {
            var atom = this.atoms[i];
            var k = 2;
            for(var iz = 0; iz < k; iz++) {
                var z = bounds.min.z + iz * s.z;
                for(var iy = 0; iy < k; iy++) {
                    var y = bounds.min.y + iy * s.y;
                    for(var ix = 0; ix < k; ix++) {
                        var x = bounds.min.x + ix * s.x / k;
                        var d2 = square(z - atom.z) + square(y - atom.y) + square(x - atom.x);
                        if(distances2[iz][iy][ix] > d2) {
                            distances2[iz][iy][ix] = d2;
                            closestAtoms[iz][iy][ix] = i;
                        }
                    }
                }
            }
        }
        return distances2;
    }
}
