/**
* @param {Element} canvas. The canvas element to create a context from.
* @return {WebGLRenderingContext} The created context.
*/
function setupWebGL(canvas) {
    return WebGLUtils.setupWebGL(canvas);
}
"use strict";

var gl;
var vBuffer;
var numPoints;

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

    


    // vBuffer = gl.createBuffer();
    // gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    // gl.bufferData(gl.ARRAY_BUFFER, flatten(max), gl.STATIC_DRAW);
    // var vPosition = gl.getAttribLocation(program, "vPosition");
    // gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    // gl.enableVertexAttribArray(vPosition);

    // Set shader uniforms

    // Drawing points upon click
    var max_verts = 1000;
    var index = 0; numPoints = 0;
    var clickBuffer = gl.createBuffer();

    // Initialize buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, clickBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, max_verts*sizeof['vec2'], gl.STATIC_DRAW);  // sizeof gets the number of bits required

    // Binder to shader attribute
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
    
    // Click event
    canvas.addEventListener("click", function (ev) {
        var ps = []
        var bbox = ev.target.getBoundingClientRect();
        var p = vec2(2*(ev.clientX - bbox.left)/canvas.width - 1, 2*(canvas.height - ev.clientY + bbox.top - 1)/canvas.height - 1);
        add_point(ps, p, 0.1);
        gl.bufferSubData(gl.ARRAY_BUFFER, index*sizeof['vec2'], flatten(ps));
        index += 6;
        numPoints = Math.max(numPoints, index); index %= max_verts;

    });

    // Colors and shit
    // var clearMenu = document.getElementById("clearMenu");
    // var clearButton = document.getElementById("clearButton");
    // clearButton.addEventListener("click", function(event) {
    //     var bgcolor = colors[clearMenu.selectedIndex];
    //     gl.clearColor(bgcolor[0], bgcolor[1], bgcolor[2], bgcolor[3]);
    // });

    // render();
    function animate() {render(); requestAnimationFrame(animate)}
    animate();
};

function add_point(array, point, size) {
    const offset = size/2;
    var point_coords = [ vec2(point[0] - offset, point[1] - offset), vec2(point[0] + offset, point[1] - offset),
    vec2(point[0] - offset, point[1] + offset), vec2(point[0] - offset, point[1] + offset),
    vec2(point[0] + offset, point[1] - offset), vec2(point[0] + offset, point[1] + offset) ];
    array.push.apply(array, point_coords);  // Also add to color buffer
};

function render() {
    // Update shader uniforms
    // speed += acc;
    // offset += speed;
    // if (offset < -radius) {
    //     offset = -radius;
    //     speed *= -1;
    // }
    // gl.uniform1f(uOffset, offset);

    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0)
    gl.clear( gl.COLOR_BUFFER_BIT );
    gl.drawArrays( gl.TRIANGLES, 0, numPoints);
}
