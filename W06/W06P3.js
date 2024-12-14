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
            console.log(numTimesToSubdivide);
        };
        
    document.getElementById("SubdivideButton-").onclick =
        function() { 
            numTimesToSubdivide = Math.max(numTimesToSubdivide - 1, 1); 
            // Empty the pointsArray
            pointsArray = [];
            tetrahedron(va, vb, vc, vd, numTimesToSubdivide);
            gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);
            console.log(numTimesToSubdivide);
        };
    
    // Buffers
    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    let vColor = gl.getAttribLocation(program, "aColor");
    console.log(vColor)
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);
    
    // gl.vertexAttribPointer(lightPosition, 4, gl.FLOAT, false, 0, 0);
    // gl.enableVertexAttribArray(lightPosition);
    let v = vec4(0.0, -1.0, -1.0, 0.0);
    gl.uniform4fv(gl.getUniformLocation(program, "lightPos"), flatten(v));
    let k = vec4(0.6, 0.6, 0.6, 1.0);  // Ligh from all directions
    gl.uniform4fv(gl.getUniformLocation(program, "La"), flatten(k));
    let t = vec4(1.0, 1.0, 1.0, 1.0);  // Ligh from source 
    gl.uniform4fv(gl.getUniformLocation(program, "Le"), flatten(t));
    let kek = 1.0;
    gl.uniform1f(gl.getUniformLocation(program, "kd"), kek);

    
    // W6P3 Texturing earth
    var image = document.createElement('img');
    image.crossorigin = 'anonymous';
    image.onload = function () { 
        let texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(gl.getUniformLocation(gl.program, "texMap"), 0); // Set sampler2D to 0 };
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.generateMipmap(gl.TEXTURE_2D);
    }
    image.src = 'earth.jpg';


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

    // Empty the pointsArray
    pointsArray = [];
    tetrahedron(va, vb, vc, vd, numTimesToSubdivide);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    // Model
    let M = mat4();

    // View
    theta += 0.02;
    let r = 3.5;
    let V = lookAt(vec3(r*Math.sin(theta), 0.0, r*Math.cos(theta)), vec3(0, 0, 0.0), vec3(0.0, 1.0, 0.0));  // eye, at, look_up

    // Perspective projection
    let P = perspective(45.0, 1.0, 0.1, 10.0);  // fovy, aspect (w/h), near, far  (near far are clipping)

    
    let MVP = mult(mult(P, V), M);
    let mvp = gl.getUniformLocation(gl.program, "MVP");
    gl.uniformMatrix4fv(mvp, false, flatten(MVP));

    gl.drawArrays(gl.TRIANGLES, 0, pointsArray.length);

    requestAnimationFrame(() => {render(gl)})

    
}