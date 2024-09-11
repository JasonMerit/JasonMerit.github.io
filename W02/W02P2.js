/**
* @param {Element} canvas. The canvas element to create a context from.
* @return {WebGLRenderingContext} The created context.
*/
function setupWebGL(canvas) {
    return WebGLUtils.setupWebGL(canvas);
}
"use strict";

var gl;

var index;
var numPoints;

window.onload = function init()
{
    var canvas = document.getElementById( "w2p2" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0)
    gl.clear( gl.COLOR_BUFFER_BIT );


    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // Dynamic buffer position
    var max_verts = 100;
    index = 0; numPoints = 0;
    
    // Initialize vertex buffer
    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, max_verts*sizeof['vec2'], gl.STATIC_DRAW);  // sizeof gets the number of bits required
    var vPosition = gl.getAttribLocation(program, "v_position");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    // Initialize color buffer
    var cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, max_verts*sizeof['vec4'], gl.STATIC_DRAW);
    var vColor = gl.getAttribLocation(program, "a_color");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    // Colors
    const COLORS = [
        vec4(0.0, 0.0, 0.0, 0.8), // black
        vec4(0.8, 0.0, 0.0, 0.8), // red
        vec4(0.8, 0.8, 0.0, 0.8), // yellow
        vec4(0.0, 0.8, 0.0, 0.8), // green
        vec4(0.0, 0.0, 0.8, 0.8), // blue
        vec4(0.8, 0.0, 0.8, 0.8), // magenta
        vec4(0.0, 0.8, 0.8, 0.8),  // cyan
        vec4(0.3921, 0.5843, 0.9294, 1.0), // cornflower blue
    ];

    // Add new point on click
    var colorMenu = document.getElementById("colorMenu");
    canvas.addEventListener("click", function (ev) {
        // Get the position of the click by offsetting by the canvas position
        var bbox = ev.target.getBoundingClientRect();
        var p = vec2(2*(ev.clientX - bbox.left)/canvas.width - 1, 2*(canvas.height - ev.clientY + bbox.top - 1)/canvas.height - 1);
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, index*sizeof['vec2'], flatten(p));
        
        // Get and set the color from the menu
        gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
        var color = COLORS[colorMenu.selectedIndex];
        gl.bufferSubData(gl.ARRAY_BUFFER, index*sizeof['vec4'], flatten(color));

        numPoints = Math.max(numPoints, ++index); index %= max_verts;
        requestAnimationFrame(render);
    });

    // Clear canvas
    var clearMenu = document.getElementById("clearMenu");
    var clearButton = document.getElementById("clearButton");
    clearButton.addEventListener("click", function() {
        var bgcolor = COLORS[clearMenu.selectedIndex];
        gl.clearColor(bgcolor[0], bgcolor[1], bgcolor[2], bgcolor[3]);
        numPoints = 0; index = 0;
        requestAnimationFrame(render);
    });
    
};


function render() {
    gl.clear( gl.COLOR_BUFFER_BIT );
    gl.drawArrays( gl.POINTS, 0, numPoints);
}
