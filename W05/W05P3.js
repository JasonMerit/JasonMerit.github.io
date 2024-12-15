// Copy tetrahedron code from book [3]
// No delete buffer [4]
// Check wiki on code mistakes in book
// Middle sphere is correctly colored [8]
// Remember to also model multiply the normals[11]
// half vector is wi + w0 normalized angle to light and observation [14]
// To keep consistent across world and eye space, compute the normal matrix as N = (M^T)^-1, where M is just some matrix [15]


var pointsArray = [];
var numTimesToSubdivide = 1;


window.onload = function init() {
    let canvas = document.getElementById( "gl-canvas" );
    
    let gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
    
    
    let program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);
    gl.program = program;

    
    var ext = gl.getExtension('OES_element_index_uint');
    if (!ext) { console.log('Warning: Unable to use an extension'); }

    
    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    render(gl);
    
}   


function render(gl) {
    gl.enable( gl.Cull_FACE );  // Add culling for closed 3D objects, that only draws when facing the camera using positive dot product
    gl.enable(gl.DEPTH_TEST);  // Add depth test
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0)
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);  // Add depth buffer bit

    var va = vec4(0.0, 0.0, 1.0, 1);
    var vb = vec4(0.0, 0.942809, -0.333333, 1);
    var vc = vec4(-0.816497, -0.471405, -0.333333, 1);
    var vd = vec4(0.816497, -0.471405, -0.333333, 1);
    
    // Empty the pointsArray
    pointsArray = [];
    tetrahedron(va, vb, vc, vd, numTimesToSubdivide);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    // Model
    let M = mat4();

    // View
    let V = lookAt(vec3(0, 0, -4.5), vec3(0, 0, 0.0), vec3(0.0, 1.0, 0.0));  // eye, at, look_up

    // Perspective projection
    let P = perspective(45.0, 1.0, 0.1, 10.0);  // fovy, aspect (w/h), near, far  (near far are clipping)

    
    // First cube one-point
    let MVP = mult(mult(P, V), M);
    let mvp = gl.getUniformLocation(gl.program, "MVP");
    gl.uniformMatrix4fv(mvp, false, flatten(MVP));

    gl.drawArrays(gl.TRIANGLES, 0, pointsArray.length);

    
}