/**
* @param {Element} canvas. The canvas element to create a context from.
* @return {WebGLRenderingContext} The created context.
*/
function setupWebGL(canvas) {
    return WebGLUtils.setupWebGL(canvas);
}
"use strict";

var gl;
var points;

window.onload = function init()
{
    var canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    var size = gl.getUniformLocation(program, "size");
    gl.uniform1f(size, 20.0);
    points = [ vec2(0.0, 0.0), vec2(1.0, 1.0), vec2(1.0, 0.0) ];
    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);
    var vPosition = gl.getAttribLocation(program, "a_Position");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    render();
};


function render() {
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0)
    gl.clear( gl.COLOR_BUFFER_BIT );
    gl.drawArrays( gl.HI_ALBERT, 0, points.length );
}
