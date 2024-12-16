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

var quad = [
    vec4(-1.0, -1.0, 0.999, 1.0), // Bottom-left
    vec4( 1.0, -1.0, 0.999, 1.0), // Bottom-right
    vec4(-1.0,  1.0, 0.999, 1.0),  // Top-right


    vec4(-1.0, 1.0, 0.999, 1.0), // Top-left
    vec4(1.0, -1.0, 0.999, 1.0), // Top-left
    vec4(1.0, 1.0, 0.999, 1.0)   // Top-left
 ];


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



    // Buffers
    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    // Sphere and quad
    tetrahedron(va, vb, vc, vd, numTimesToSubdivide);
    pointsArray.push(  
        vec4(-1.0, -1.0, 0.999, 1.0), // Bottom-left
        vec4( 1.0, -1.0, 0.999, 1.0), // Bottom-right
        vec4(-1.0,  1.0, 0.999, 1.0),  // Top-right
    
        vec4(-1.0, 1.0, 0.999, 1.0), // Top-left
        vec4(1.0, -1.0, 0.999, 1.0), // Top-left
        vec4(1.0, 1.0, 0.999, 1.0)) ;// Top-left)
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);
    
    // Texture
    initTexture(gl);    
        
    render(gl);
}   

g_tex_ready = 0;

function initTexture(gl)
{
    var cubemap = ['textures/cm_left.png', // POSITIVE_X
    'textures/cm_right.png', // NEGATIVE_X
    'textures/cm_top.png', // POSITIVE_Y
    'textures/cm_bottom.png', // NEGATIVE_Y
    'textures/cm_back.png', // POSITIVE_Z
    'textures/cm_front.png']; // NEGATIVE_Z

    gl.activeTexture(gl.TEXTURE0);
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    for(var i = 0; i < 6; ++i) {
        var image = document.createElement('img');
        image.crossorigin = 'anonymous';
        image.textarget = gl.TEXTURE_CUBE_MAP_POSITIVE_X + i;

        image.onload = function(event)
        {
            var image = event.target;
            gl.activeTexture(gl.TEXTURE0);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.texImage2D(image.textarget, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
            ++g_tex_ready;
        };
        image.src = cubemap[i];
    }
    gl.uniform1i(gl.getUniformLocation(gl.program, "texMap"), 0);

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

    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);  // Add depth buffer bit

    // View
    theta += 0.01;
    let V = lookAt(vec3(3.5*Math.sin(theta), 0.0, 3.5*Math.cos(theta)), vec3(0, 0, 0.0), vec3(0.0, 1.0, 0.0));  // eye, at, look_up

    // Perspective projection
    let P = perspective(90.0, 1.0, 0.1, 100.0);  // fovy, aspect (w/h), near, far  (near far are clipping)

    sendMVP(gl, mat4(), V, P);
    gl.drawArrays(gl.TRIANGLES, 0, pointsArray.length);  // Draw sphere

    // Background quad
    let i_w = inverse(V);
    i_w[0][3] = 0.0;
    i_w[1][3] = 0.0;
    i_w[2][3] = 0.0;
    i_w[3][3] = 0.0;
    
    i_w[3][0] = 0.0;
    i_w[3][1] = 0.0;
    i_w[3][2] = 0.0;

    let M = mult(i_w, inverse(P));

    sendMVP(gl, M, mat4(), mat4());
    gl.drawArrays(gl.TRIANGLES, pointsArray.length - 6, 6);  // Draw quad
    
    requestAnimationFrame(() => {render(gl)})    
}

function sendMVP(gl, M, V, P) {
    gl.uniformMatrix4fv(gl.getUniformLocation(gl.program, "M"), false, flatten(M)); 
    gl.uniformMatrix4fv(gl.getUniformLocation(gl.program, "V"), false, flatten(V));
    gl.uniformMatrix4fv(gl.getUniformLocation(gl.program, "P"), false, flatten(P));
}