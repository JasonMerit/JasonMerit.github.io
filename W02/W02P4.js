/**
* @param {Element} canvas. The canvas element to create a context from.
* @return {WebGLRenderingContext} The created context.
*/
function setupWebGL(canvas) {
    return WebGLUtils.setupWebGL(canvas);
}
"use strict";

window.onload = function init()
{
    let canvas = document.getElementById( "w2p4" );
    
    let gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0)
    gl.clear( gl.COLOR_BUFFER_BIT );


    let program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // Dynamic buffer position
    let max_verts = 1000;
    let index = 0; let numPoints = 0;
    let drawState = 1;
    
    // Initialize vertex buffer
    let vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, max_verts*sizeof['vec2'], gl.STATIC_DRAW);  // sizeof gets the number of bits required
    let vPosition = gl.getAttribLocation(program, "v_position");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    // Initialize color buffer
    let cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, max_verts*sizeof['vec4'], gl.STATIC_DRAW);
    let vColor = gl.getAttribLocation(program, "a_color");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    // Colors
    const COLORS = [
        vec4(0.2, 0.2, 0.2, 1.0), // black
        vec4(0.8, 0.0, 0.0, 1.0), // red
        vec4(0.8, 0.8, 0.0, 1.0), // yellow
        vec4(0.0, 0.8, 0.0, 1.0), // green
        vec4(0.0, 0.0, 0.8, 1.0), // blue
        vec4(0.8, 0.0, 0.8, 1.0), // magenta
        vec4(0.0, 0.8, 0.8, 1.0),  // cyan
        vec4(0.3921, 0.5843, 0.9294, 1.0), // cornflower blue
    ];

    // Triangle state
    let trianglePoints = [];
    let triangleColors = [];

    // Add new point on click
    let colorMenu = document.getElementById("colorMenu");
    canvas.addEventListener("click", function (ev) {
        
        // Get the position of the click by offsetting by the canvas position and the color
        let bbox = ev.target.getBoundingClientRect();
        let p = vec2(2*(ev.clientX - bbox.left)/canvas.width - 1, 2*(canvas.height - ev.clientY + bbox.top - 1)/canvas.height - 1);
        let c = COLORS[colorMenu.selectedIndex];
        
        var delta = 6;  // Default to point
        let positions = [];
        let colors = []
        if (drawState == 0) {  // Point
            add_point(positions, p, 0.04);
            colors = Array(delta).fill(c);
        }
        else if (drawState == 1) {  // Triangle
            trianglePoints.push(p);
            triangleColors.push(c);
            
            if (trianglePoints.length == 3) {  // Need 3 points to make a triangle
                // Add triangle and reset
                add_triangle(positions, trianglePoints);
                colors = triangleColors;
                trianglePoints = [];
                triangleColors = [];

                numPoints -= 12;  // Remove last two points
                index -= 12;
                delta = 3;  // Triangle has 3 vertices

            }
            else {  // Add point to the triangle
                add_point(positions, p, 0.04);
                colors = Array(delta).fill(c);
            }
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, index*sizeof['vec2'], flatten(positions));
        gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, index*sizeof['vec4'], flatten(colors));
        
        index += delta; index %= max_verts;
        numPoints = Math.max(numPoints, index);
        requestAnimationFrame(() => {render(gl, numPoints)});
    });

    // Draw mode
    let drawMode = document.getElementById("drawMode");
    drawMode.addEventListener("click", function() {
        drawState = drawMode.selectedIndex
    });
    
    // Clear canvas
    let clearMenu = document.getElementById("clearMenu");
    let clearButton = document.getElementById("clearButton");
    clearButton.addEventListener("click", function() {
        let bgcolor = COLORS[clearMenu.selectedIndex];
        gl.clearColor(bgcolor[0], bgcolor[1], bgcolor[2], bgcolor[3]);
        numPoints = 0; index = 0;
        trianglePoints = [];
        triangleColors = [];
        requestAnimationFrame(() => {render(gl, numPoints)});
    });
    
};

function add_point(array, point, size) {
    const offset = size/2;
    let point_coords = [ vec2(point[0] - offset, point[1] - offset), vec2(point[0] + offset, point[1] - offset),
    vec2(point[0] - offset, point[1] + offset), vec2(point[0] - offset, point[1] + offset),
    vec2(point[0] + offset, point[1] - offset), vec2(point[0] + offset, point[1] + offset) ];
    array.push.apply(array, point_coords);
};

function add_triangle(array, points) {
    array.push(points[0], points[1], points[2]);
};


function render(gl, numPoints) {
    gl.clear( gl.COLOR_BUFFER_BIT );
    gl.drawArrays( gl.TRIANGLES, 0, numPoints);
}
