window.onload = function init() {
    let canvas = document.getElementById( "gl-canvas" );
    
    let gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
    
    
    let program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);
    gl.program = program;

    
    var ext = gl.getExtension('OES_element_index_uint');
    if (!ext) { console.log('Warning: Unable to use an extension'); }

    // Create a cube
    //    v5----- v6
    //    /|      /|
    //   v1------v2|
    //   | |     | |
    //   | |v4---|-|v7
    //   |/      |/
    //   v0------v3
    
    var vertices = [  // With W=1 on 4th column
        vec4(0.0, 0.0, 1.0, 1.0),
        vec4(0.0, 1.0, 1.0, 1.0),
        vec4(1.0, 1.0, 1.0, 1.0),
        vec4(1.0, 0.0, 1.0, 1.0),
        vec4(0.0, 0.0, 0.0, 1.0),
        vec4(0.0, 1.0, 0.0, 1.0),
        vec4(1.0, 1.0, 0.0, 1.0),
        vec4(1.0, 0.0, 0.0, 1.0),
    ];
    
    // Wireframe indices
    var wire_indices = new Uint32Array([
        0, 1, 1, 2, 2, 3, 3, 0, // front
        2, 3, 3, 7, 7, 6, 6, 2, // right
        0, 3, 3, 7, 7, 4, 4, 0, // down
        1, 2, 2, 6, 6, 5, 5, 1, // up
        4, 5, 5, 6, 6, 7, 7, 4, // back
        0, 1, 1, 5, 5, 4, 4, 0, // left
    ]);
    
    // Triangle mesh indices
    // var indices = new Uint32Array([
    //     1, 0, 3, 3, 2, 1, // front
    //     2, 3, 7, 7, 6, 2, // right
    //     3, 0, 4, 4, 7, 3, // down
    //     6, 5, 1, 1, 2, 6, // up
    //     4, 5, 6, 6, 7, 4, // back
    //     5, 4, 0, 0, 1, 5, // left
    // ]);
    
    // var iBuffer = gl.createBuffer();
    // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
    // gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(wire_indices), gl.STATIC_DRAW);
    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
    // Perspective projection
    // let P = ortho(-1.0, 1.0, -1.0, 1.0, -1.0, 1.0);  // left, right, down, top, front, back
    let P = perspective(45.0, 1.0, 0.1, 10.0);  // fovy, aspect (w/h), near, far  (near far are clipping)

    // View
    let V = lookAt(vec3(0.5, 0.5, -4.5), vec3(0.5, 0.5, 0.0), vec3(0.0, 1.0, 0.0));  // eye, at, look_up
    
    render(gl, wire_indices.length, V, P);
    
}   

function render(gl, num_points, V, P) {
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0)
    gl.clear( gl.COLOR_BUFFER_BIT );

    // Model
    let M = mat4();
    
    // First cube one-point
    let MVP = mult(mult(P, V), M);
    let mvp = gl.getUniformLocation(gl.program, "MVP");
    gl.uniformMatrix4fv(mvp, false, flatten(MVP));

    gl.drawElements(gl.LINES, num_points, gl.UNSIGNED_INT, 0);

    // Second cube two-point by x-Translation
    M = translate(1.2, 0.0, 0.0);
    MVP = mult(mult(P, V), M);
    gl.uniformMatrix4fv(mvp, false, flatten(MVP));

    gl.drawElements(gl.LINES, num_points, gl.UNSIGNED_INT, 0);

    // Third cube three-point by x- and y-Translation
    M = translate(1.2, -1.2, 0.0);
    MVP = mult(mult(P, V), M);
    gl.uniformMatrix4fv(mvp, false, flatten(MVP));

    gl.drawElements(gl.LINES, num_points, gl.UNSIGNED_INT, 0);  // drawElements allows reuse of vertices using the index buffer
    
}