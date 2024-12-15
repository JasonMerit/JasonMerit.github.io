// Copy tetrahedron code from book [3]
// No delete buffer [4]
// Check wiki on code mistakes in book
// Middle sphere is correctly colored [8]
// Remember to also model multiply the normals[11]
// half vector is wi + w0 normalized angle to light and observation [14]
// To keep consistent across world and eye space, compute the normal matrix as N = (M^T)^-1, where M is just some matrix [15]

const va = vec4(0.0, 0.0, 1.0, 1);
const vb = vec4(0.0, 0.942809, -0.333333, 1);
const vc = vec4(-0.816497, -0.471405, -0.333333, 1);
const vd = vec4(0.816497, -0.471405, -0.333333, 1);
var pointsArray = [];
var numTimesToSubdivide = 5;
var theta = 0.0; // Camera rotation angle
var speed = 0.01; // Camera rotation speed


window.onload = function init() {
    let canvas = document.getElementById( "gl-canvas" );
    
    let gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
    
    
    let program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);
    gl.program = program;

    gl.enable( gl.CULL_FACE );  // Add culling for closed 3D objects, that only draws when facing the camera using positive dot product
    gl.enable( gl.DEPTH_TEST );  // Add depth test

    
    var ext = gl.getExtension('OES_element_index_uint');
    if (!ext) { console.log('Warning: Unable to use an extension'); }

    // User interactions
    document.getElementById("SubdivideButton+").onclick =
        function() { 
            numTimesToSubdivide = Math.min(numTimesToSubdivide + 1, 5); 
            // Empty the pointsArray
            pointsArray = [];
            tetrahedron(va, vb, vc, vd, numTimesToSubdivide);
            gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);
        };
        
    document.getElementById("SubdivideButton-").onclick =
        function() { 
            numTimesToSubdivide = Math.max(numTimesToSubdivide - 1, 0); 
            // Empty the pointsArray
            pointsArray = [];
            tetrahedron(va, vb, vc, vd, numTimesToSubdivide);
            gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);
        };
    document.getElementById("Spin").onclick =
        function() { 
            speed = speed == 0.0 ? 0.01 : 0.0;
        };

    
    
    // Source lighting
    gl.uniform4fv(gl.getUniformLocation(program, "lightPos"), [0.0, 0.0, -1.0, 0.0]);

    // Diffuse reflection coefficient (Kd)
    gl.uniform1f(gl.getUniformLocation(program, "diffuse_coef"), 0.9);
    document.getElementById("Kd").oninput = 
        function(event) { gl.uniform1f(gl.getUniformLocation(program, "diffuse_coef"), event.srcElement.value); }
    
    // Specular coefficient (Ks)
    gl.uniform1f(gl.getUniformLocation(program, "spec"), 1.0);
    document.getElementById("Ks").oninput = 
        function(event) { gl.uniform1f(gl.getUniformLocation(program, "spec"), event.srcElement.value); }
    
    // Shininess coefficient (s)
    gl.uniform1f(gl.getUniformLocation(program, "shininess"), 100);
    document.getElementById("s").oninput = 
        function(event) { gl.uniform1f(gl.getUniformLocation(program, "shininess"), event.srcElement.value); }
    
    // Light emission (Le)
    gl.uniform4fv(gl.getUniformLocation(program, "emission"), [1.0, 1.0, 1.0, 1.0]);
    document.getElementById("Le").oninput = 
        function(event) { 
            let val = event.srcElement.value;
            gl.uniform4fv(gl.getUniformLocation(program, "emission"), [val, val, val, 1.0]); }
    
    // Ambient light intensity (La)
    gl.uniform4fv(gl.getUniformLocation(program, "ambient"), [0.1, 0.1, 0.1, 1.0]);
    document.getElementById("La").oninput = 
        function(event) { 
            let val = event.srcElement.value;
            gl.uniform4fv(gl.getUniformLocation(program, "ambient"), [val, val, val, 1.0]); }
    
    // Buffers
    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    // Create sphere using Tetrahedron
    tetrahedron(va, vb, vc, vd, numTimesToSubdivide);
    render(gl);
    
}   

function tetrahedron(a, b, c, d, n) {
    divideTriangle(a, b, c, n);
    divideTriangle(d, c, b, n);
    divideTriangle(a, d, b, n);
    divideTriangle(a, c, d, n);
}

// Midpoint subdivision
function divideTriangle(a, b, c, count) {
    if (count > 0) {
        var ab = normalize(mix(a, b, 0.5), true);
        var ac = normalize(mix(a, c, 0.5), true);
        var bc = normalize(mix(b, c, 0.5), true);
        divideTriangle(a, ab, ac, count - 1);
        divideTriangle(ab, b, bc, count - 1);
        divideTriangle(bc, c, ac, count - 1);
        divideTriangle(ab, bc, ac, count - 1);
    } 
    else { triangle(a, b, c); }
}

function triangle(a, b, c) {
    pointsArray.push(a);
    pointsArray.push(b);
    pointsArray.push(c);
}

function render(gl) {

    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0)
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);  // Add depth buffer bit
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);


    // View
    theta += speed;
    let r = 3.5;
    let eye = vec3(r * Math.sin(theta), 0.0, r * Math.cos(theta));
    let V = lookAt(eye, vec3(0, 0, 0.0), vec3(0.0, 1.0, 0.0));  // eye, at, look_up
    gl.uniform3fv(gl.getUniformLocation(gl.program, "observer"), normalize(eye));

    // Perspective projection
    let P = perspective(45.0, 1.0, 0.1, 10.0);  // fovy, aspect (w/h), near, far  (near far are clipping)
    
    let mvp = gl.getUniformLocation(gl.program, "MVP");
    gl.uniformMatrix4fv(mvp, false, flatten(mult(P, V)));

    let v = gl.getUniformLocation(gl.program, "V");
    gl.uniformMatrix4fv(v, false, flatten(V));

    gl.drawArrays(gl.TRIANGLES, 0, pointsArray.length);

    requestAnimationFrame(() => {render(gl)})

    
}