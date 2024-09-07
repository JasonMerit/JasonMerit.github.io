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
var vBuffer;

var radius = 0.5;
var acc = -0.0001;
var speed = 0.0;
var offset = 0.0;
var uOffset;

window.onload = function init()
{
    var canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    

    // Circle
    points = [ vec2(0.0, 0.0) ];
    var n = 100;
    // Loop to create circle points
    for (var i = 0; i <= n; i++) {
        var angle = 2 * Math.PI * i / n;
        var x = radius * Math.cos(angle);
        var y = radius * Math.sin(angle);
        points.push(vec2(x, y));
    }

    vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    // Set shader uniforms
    uOffset = gl.getUniformLocation(program, "offset");
    
    render();
};


function render() {
    // Update shader uniforms
    speed += acc;
    offset += speed;
    if (offset < -radius) {
        offset = -radius;
        speed *= -1;
    }
    gl.uniform1f(uOffset, offset);

    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0)
    gl.clear( gl.COLOR_BUFFER_BIT );
    gl.drawArrays( gl.TRIANGLE_FAN, 0, points.length );
    
    requestAnimationFrame(render);
}
