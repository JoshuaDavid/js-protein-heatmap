var canvas = document.createElement('canvas');
var context = canvas.getContext('2d');

function getAtoms() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET','./3kw7.pdb', false);
    xhr.send();
    var raw_pdb = xhr.response;
    var atom_lines = raw_pdb.match(/ATOM\s.*?\n/g);
    var atoms = atom_lines.map(function(line) {
        var atom = new (function Atom(){})();
        atom.record_name = line.slice( 0,  7).trim();
        atom.id          = line.slice( 7, 13).trim() - 0;
        atom.name        = line.slice(13, 17).trim();
        atom.location    = line.slice(17, 18).trim();
        atom.residue     = line.slice(18, 22).trim();
        atom.chain       = line.slice(22, 23).trim();
        atom.residue_id  = line.slice(23, 27).trim() - 0;
        atom.attr8       = line.slice(27, 31).trim();
        atom.x           = line.slice(31, 39).trim() - 0;
        atom.y           = line.slice(39, 47).trim() - 0;
        atom.z           = line.slice(47, 55).trim() - 0;
        atom.occupancy   = line.slice(55, 61).trim() - 0;
        atom.temp_factor = line.slice(61, 73).trim() - 0;
        atom.segment     = line.slice(73, 77).trim();
        atom.element     = line.slice(77, 79).trim();
        atom.charge      = line.slice(79    ).trim();
        return atom;
    });
    return atoms;
}

function P3(x, y, z) {
    var p3 = new (function P3(){})();
    p3.x = x;
    p3.y = y;
    p3.z = z;
    return p3;
}

function square(x) {
    return x * x
}
// Takes c[ube]   (x, y, z, s[ize])
// and   s[phere] (x, y, z, r[adius])
// Returns boolean (intersects)
function doCubeAndSphereIntersect(c, s) {
    var d2 = square(s.r)
    if     (s.x < c.x      ) d2 -= square(s.x - c.x      );
    else if(s.x < c.x + c.s) d2 -= square(s.x - c.x + c.s);
    if     (s.y < c.y      ) d2 -= square(s.y - c.y      );
    else if(s.y < c.y + c.s) d2 -= square(s.y - c.y + c.s);
    if     (s.z < c.z      ) d2 -= square(s.z - c.z      );
    else if(s.z < c.z + c.s) d2 -= square(s.z - c.z + c.s);
    return d2 >= 0;
}


