
window.onload = function init() {
    let canvas = document.getElementById( "gl-canvas" );
    
    let gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
    
    
    let program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program); gl.program = program;
    gl.enable(gl.CULL_FACE); 
    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0.1, 0.1, 0.1, 1.0)

    gl.n = initVertexBuffers(gl); // Write vertices to vertex shader
    gl.mvpLoc = gl.getUniformLocation(program, 'MVP');
    var theta = 60.0; // The rotation angle
    var speed = 0.0; // The rotation speed
    
    document.getElementById("Theta").oninput = function(event) { 
      theta = event.srcElement.value;
      speed = 0;
    }

    window.addEventListener("keydown", function(event) {
      if (event.code === "Space") {
        speed = speed == 0.0 ? 1.0 : 0.0;
        event.preventDefault(); // Prevent default scrolling behavior
      }
    });
  
    
    /////////////////
    // Project code
    ////////////////
    gl.u_PickedFace = gl.getUniformLocation(program, 'u_PickedFace');
    gl.uniform1i(gl.u_PickedFace, -1);
    gl.u_IsPicking = gl.getUniformLocation(program, 'u_IsPicking');
    gl.uniform1i(gl.u_IsPicking, 0);


    // Register the event handler
    canvas.onmousedown = function(ev) {
      console.log("click");
      var x = ev.clientX, y = ev.clientY;
      var rect = ev.target.getBoundingClientRect();
      if (rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom) {
        // Check if it is on object
        var x_in_canvas = x - rect.left, y_in_canvas = rect.bottom - y;
        var face = checkFace(gl, x_in_canvas, y_in_canvas, theta);
        gl.uniform1i(gl.u_PickedFace, face);
        draw(gl, theta);
      }
    }
    
  
  // Start drawing
  var tick = function () {
    theta += speed;
    draw(gl, theta);
    requestAnimationFrame(tick);
  };
  tick();    
}   

function checkFace(gl, x, y, theta) {
  var pixels = new Uint8Array(4);  // Array for storing the pixel value

  gl.uniform1i(gl.u_IsPicking, 1);  // Pass true to u_IsPicking
  gl.uniform1i(gl.u_PickedFace, -1); // Write surface number into alpha

  draw(gl, theta);
  // Read the pixels at (x, y). pixels[3] is the surface number
  gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
  gl.uniform1i(gl.u_IsPicking, 0);  // Pass false to u_IsPicking
  return pixels[0];
}

function check(gl, x, y, theta) {
    // 1) Draw the cube with red
    gl.uniform1f(gl.u_Clicked, 1.0);  
    draw(gl, theta);
    
    // 2) Read pixel at the clicked position
    var pixels = new Uint8Array(4);  // Array for storing the pixel value
    gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

    // 3) Draw the cube again without color
    gl.uniform1f(gl.u_Clicked, 0.0);  // Draw cube back
    draw(gl, theta);

    // 4) Return true if pixel value is red
    return pixels[0] == 255;
}

function draw(gl, theta) {
    let y = 0.5 * Math.sin(radians(theta));
    
    // Model
    let M = mat4();

    // Order of transformations is important: Scale, Translate, Rotate
    M = mult(M, scalem(0.5, 0.5, 0.5));  // x, y, z
    M = mult(M, translate(0.0, y, 0.0));  // x, y, z
    M = mult(M, rotate(theta, 1, 1, 0));  // angle, x, y, z
    
    // View
    let V = lookAt(vec3(0, 0, -4.5), vec3(0, 0, 0.0), vec3(0.0, 1.0, 0.0));  // eye, at, look_up
    
    // Perspective projection
    let P = perspective(45.0, 1.0, 0.1, 10.0);  // fovy, aspect (w/h), near, far  (near far are clipping)
     
    let MVP = mult(mult(P, V), M);
    gl.uniformMatrix4fv(gl.mvpLoc, false, flatten(MVP));
    
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);  // Add depth buffer bit
    gl.drawElements(gl.TRIANGLES, gl.n, gl.UNSIGNED_BYTE, 0);
}


function initVertexBuffers(gl) {
    // Create a cube
    //    v6----- v5
    //   /|      /|
    //  v1------v0|
    //  | |     | |
    //  | |v7---|-|v4
    //  |/      |/
    //  v2------v3
  
    var vertices = new Float32Array([   // Vertex coordinates
       1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0,    // v0-v1-v2-v3 front
       1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0,    // v0-v3-v4-v5 right
       1.0, 1.0, 1.0, 1.0, 1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0,    // v0-v5-v6-v1 up
      -1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, 1.0,    // v1-v6-v7-v2 left
      -1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0,    // v7-v4-v3-v2 down
       1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0     // v4-v7-v6-v5 back
    ]);

    var faces = new Uint8Array([   // Surface number
      1, 1, 1, 1, 1, 1,  // v0-v1-v2-v3 front
      2, 2, 2, 2, 2, 2,  // v0-v3-v4-v5 right
      3, 3, 3, 3, 3, 3,  // v0-v5-v6-v1 up
      4, 4, 4, 4, 4, 4,  // v1-v6-v7-v2 left
      5, 5, 5, 5, 5, 5,  // v7-v4-v3-v2 down
      6, 6, 6, 6, 6, 6   // v4-v7-v6-v5 back
    ]);
  
    var colors = new Float32Array([     // Colors
      0.5, 0.5, 0.0, 0.5, 0.5, 0.0, 0.5, 0.5, 0.0, 0.5, 0.5, 0.0,  // v0-v1-v2-v3 front
      1.0, 0.5, 0.5, 1.0, 0.5, 0.5, 1.0, 0.5, 0.5, 1.0, 0.5, 0.5,  // v0-v3-v4-v5 right
      0.5, 1.0, 0.5, 0.5, 1.0, 0.5, 0.5, 1.0, 0.5, 0.5, 1.0, 0.5,  // v0-v5-v6-v1 up
      0.0, 0.5, 0.5, 0.0, 0.5, 0.5, 0.0, 0.5, 0.5, 0.0, 0.5, 0.5,  // v1-v6-v7-v2 left
      0.5, 0.0, 0.5, 0.5, 0.0, 0.5, 0.5, 0.0, 0.5, 0.5, 0.0, 0.5,  // v7-v4-v3-v2 down
      0.5, 0.5, 1.0, 0.5, 0.5, 1.0, 0.5, 0.5, 1.0, 0.5, 0.5, 1.0,   // v4-v7-v6-v5 back
    ]);
  
    var indices = new Uint8Array([       // Indices of the vertices
       0, 1, 2, 0, 2, 3,    // front
       4, 5, 6, 4, 6, 7,    // right
       8, 9, 10, 8, 10, 11,    // up
      12, 13, 14, 12, 14, 15,    // left
      16, 17, 18, 16, 18, 19,    // down
      20, 21, 22, 20, 22, 23     // back
    ]);
  
    // Create a buffer object
    var indexBuffer = gl.createBuffer();
    if (!indexBuffer)
      return -1;
  
    // Write the vertex coordinates, faces and color to the buffer object
    if (!initArrayBuffer(gl, vertices, 3, gl.FLOAT, 'a_Position'))
      return -1;

    if (!initArrayBuffer(gl, faces, 1, gl.UNSIGNED_BYTE, 'a_Face'))
      return -1;
  
    if (!initArrayBuffer(gl, colors, 3, gl.FLOAT, 'a_Color'))
      return -1;
  
    // Write the indices to the buffer object
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
  
    return indices.length;
  }
  
  function initArrayBuffer(gl, data, num, type, attribute) {
    // Create a buffer object
    var buffer = gl.createBuffer();
    if (!buffer) {
      console.log('Failed to create the buffer object');
      return false;
    }
    // Write date into the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    // Assign the buffer object to the attribute variable
    var a_attribute = gl.getAttribLocation(gl.program, attribute);
    if (a_attribute < 0) {
      console.log('Failed to get the storage location of ' + attribute);
      return false;
    }
    gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
    // Enable the assignment of the buffer object to the attribute variable
    gl.enableVertexAttribArray(a_attribute);
  
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  
    return true;
  }
  