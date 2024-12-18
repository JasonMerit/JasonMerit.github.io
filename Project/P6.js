window.onload = function init()
{   
    // Setup
    let canvas = document.getElementById( "gl-canvas" );
    let gl = WebGLUtils.setupWebGL( canvas );
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    // clear color
    gl.clearColor(0.05, 0.05, 0.05, 1.0);
    gl.useProgram(program);
    gl.program = program;
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);
    

    var ext = gl.getExtension("OES_element_index_uint");
    if (!ext){
        console.log('Warning: Unable to use extension')
    }

    gl.n = tetrahedron(gl, 5);

    var vPosition = gl.getAttribLocation( program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    function initTexture(gl, callback) {
        // Texture file paths
        let folder = 'textures/';
        let format = '.jpg';
        let planets = ['sun', 'mercury', 'venus', 'earth', 'mars', 
                        'jupiter', 'saturn', 'uranus', 'neptune'];
            
        // Store texture objects to avoid garbage collection
        let textures = [];
        let loadedCount = 0;
    
        for (let i = 0; i < planets.length; i++) {
            let texture = gl.createTexture(); // Create texture object
            textures.push(texture);
    
            let image = new Image();
            image.crossOrigin = 'anonymous'; // Correct crossOrigin
            image.onload = function () {
                gl.activeTexture(gl[`TEXTURE${i}`]); // Activate texture unit i
                gl.bindTexture(gl.TEXTURE_2D, texture); // Bind texture to unit
    
                // Flip Y-coordinate for WebGL
                gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    
                // Upload texture image to GPU
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    
                // Set texture parameters
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    
                // Link sampler to texture unit
                gl.uniform1i(gl.getUniformLocation(gl.program, `u_Texture${i}`), i);

                loadedCount++;

                // Check if all textures are loaded
                if (loadedCount === textures.length) {
                    callback(); // Call the callback when all textures are loaded
                }
            };
    
            // Trigger image loading
            image.src = folder + planets[i] + format;
        }
    }

    ////////////////////
    // Object selection
    ////////////////////
    gl.u_Clicked = gl.getUniformLocation(program, 'u_Clicked');
    let pixel2planet = {
        25: 'sun', 51: 'mercury', 76: 'venus', 102: 'earth', 127: 'mars',
        153: 'jupiter', 178: 'saturn', 204: 'uranus', 229: 'neptune'
    }
    let pixel2object = {
        25: 0, 51: 1, 76: 2, 102: 3, 127: 4, 
        153: 5, 178: 6, 204: 7, 229: 8
    }

    // Register the event handler
    canvas.onmousedown = function(ev) {
      var x = ev.clientX, y = ev.clientY;
      var rect = ev.target.getBoundingClientRect();
      if (rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom) {
        // Check if it is on object
        var x_in_canvas = x - rect.left, y_in_canvas = rect.bottom - y;
        var picked = check(gl, time, x_in_canvas, y_in_canvas);
        if (picked in pixel2planet) { 
            console.log(pixel2planet[picked]);
            gl.selectedObject = pixel2object[picked];
        } else {
            gl.selectedObject = 0;
        }
      }
    }

    // On scroll event
    canvas.onwheel = function(ev) {
        gl.zoom = Math.max(-14, Math.min(-2, gl.zoom - ev.deltaY / 100));
    }

    var time = 0.0;
    gl.v_TexIndexLoc = gl.getUniformLocation(program, 'v_TexIndex');
    gl.MVPLoc = gl.getUniformLocation(program, 'MVP');
    gl.target = vec3(0, 0, 0);
    gl.zoom = -4;
    gl.V = lookAt(vec3(0, 5, gl.zoom), vec3(0, 0, 0), vec3(0.0, 1.0, 0.0));
    gl.P = perspective(80.0, 1.0, 0.1, 100.0);
    initTexture(gl, () => {
        // Start drawing
        var tick = function () {
            time += 1;
            draw(gl, time);
            requestAnimationFrame(tick);
        };
        tick();
    });
}

function draw(gl, time)
{
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
    gl.V = lookAt(
        vec3(0, 5, gl.zoom),
        mix(vec3(0, 0, 0), gl.target, 0.7), 
        vec3(0.0, 1.0, 0.0)
    );
    
    body(gl, time, 0, 1, 1, 1, 0);             // Sun
    body(gl, time, 2, 0.05, 0.240846, 1, 1);   // Mercury
    body(gl, time, -2.5, 0.075, 0.615, 6, 2);  // Venus
    body(gl, time, 3.5, 0.08, 1, 12, 3);       // Earth
    body(gl, time, -4, 0.04, 1.881, 25, 4);    // Mars
    body(gl, time, 5.2, 0.4, 11.86, 10, 5);    // Jupiter
    body(gl, time, -9, 0.525, 29.46, 11, 6);   // Saturn
    body(gl, time, 6.7, 0.225, 84.01, 17, 7);  // Uranus
    body(gl, time, -13.5, 0.22, 164.8, 16, 8); // Neptune
    
}

// Place the remainig planets relative to the position of the sun.
function body(gl, time, trans, scale, orbit, day, planet) { // Deez balls
    let M = mat4();
    M = mult(M, rotateY(-time / orbit));            // Rotate around the suns center
    M = mult(M, translate(vec3(trans, 0.0, 0.0)));  // Translate to the "orbital distance"
    M = mult(M, rotateY(time * day / 4));           // Rotate around itself
    scale /= gl.getUniform(gl.program, gl.u_Clicked) == 1 ? scale : 1; // Grace
    M = mult(M, scalem(vec3(scale, scale, scale)));
    // Extract position from the M matrix
    if (planet == gl.selectedObject) {
        gl.target = vec3(M[0][3], M[1][3], M[2][3]);
    }

    // planet = planet == gl.selectedObject ? -1 : planet;  // Highlight selected planet  
    gl.uniform1i(gl.v_TexIndexLoc, planet);
    gl.uniformMatrix4fv(gl.MVPLoc, false, flatten(mult(gl.P, mult(gl.V, M))));
    gl.drawArrays(gl.TRIANGLES, 0, gl.n);
}

function check(gl, time, x, y) {
    // 1) Draw the cube with red
    gl.uniform1i(gl.u_Clicked, 1);  
    draw(gl, time);
    
    // 2) Read pixel at the clicked position
    var pixels = new Uint8Array(4);  // Array for storing the pixel value
    gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

    // 3) Draw the cube again without color
    gl.uniform1i(gl.u_Clicked, 0);  // Draw cube back
    draw(gl, time);

    // 4) Return true if pixel value is red
    return pixels[0];
}

function tetrahedron(gl, n) {
    var pointsArray = [];

    let a = vec4(0.0, 0.0, 1.0,1);
    let b = vec4(0.0, 0.942809, -0.333333, 1);
    let c = vec4(-0.816497, -0.471405, -0.333333, 1);
    let d = vec4(0.816497, -0.471405, -0.333333,1);

    function triangle(a, b, c) {
        pointsArray.push(a);
        pointsArray.push(b);
        pointsArray.push(c);
    }
    
    function divideTriangle(a, b, c, count) {
        if ( count > 0 ) {
            let ab = mix( a, b, 0.5);
            let ac = mix( a, c, 0.5);
            let bc = mix( b, c, 0.5);
    
            ab = normalize(ab, true);
            ac = normalize(ac, true);
            bc = normalize(bc, true);
    
            divideTriangle( a, ab, ac, count - 1 );
            divideTriangle( ab, b, bc, count - 1 );
            divideTriangle( bc, c, ac, count - 1 );
            divideTriangle( ab, bc, ac, count - 1 );
        }
        else { triangle( a, b, c ); }
    }
    
    divideTriangle(a, b, c, n);
    divideTriangle(d, c, b, n);
    divideTriangle(a, d, b, n);
    divideTriangle(a, c, d, n);

    let vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    return pointsArray.length;
}