/**
* @param {Element} canvas. The canvas element to create a context from.
* @return {WebGLRenderingContext} The created context.
*/
function setupWebGL(canvas) {
    return WebGLUtils.setupWebGL(canvas);
}
"use strict";

var gl;
var numPoints;

window.onload = function init()
{
    var canvas = document.getElementById( "w2p1" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0)
    gl.clear( gl.COLOR_BUFFER_BIT );


    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // Dynamic buffer position
    var max_verts = 100;
    var index = 0; numPoints = 0;
    
    // Initialize buffer
    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, max_verts*sizeof['vec2'], gl.STATIC_DRAW);  // sizeof gets the number of bits required

    // Bind to shader attribute
    var vPosition = gl.getAttribLocation(program, "v_position");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);


    canvas.addEventListener("click", function (ev) {
        // Get the position of the click by offsetting by the canvas position
        var bbox = ev.target.getBoundingClientRect();
        var p = vec2(2*(ev.clientX - bbox.left)/canvas.width - 1, 2*(canvas.height - ev.clientY + bbox.top - 1)/canvas.height - 1);
        
        gl.bufferSubData(gl.ARRAY_BUFFER, index*sizeof['vec2'], flatten(p));
        numPoints = Math.max(numPoints, ++index); index %= max_verts;
        requestAnimationFrame(render);
    });
    
};


function render() {
    gl.clear( gl.COLOR_BUFFER_BIT );
    gl.drawArrays( gl.POINTS, 0, numPoints);
}
