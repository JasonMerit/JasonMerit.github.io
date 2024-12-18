window.onload = function init()
{   
    // Setup
    let canvas = document.getElementById( "gl-canvas" );
    let gl = WebGLUtils.setupWebGL( canvas );
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    // clear color
    gl.clearColor(0.1, 0.1, 0.1, 1.0);
    gl.useProgram(program);
    gl.program = program;
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);
    

    var ext = gl.getExtension("OES_element_index_uint");
    if (!ext){
        console.log('Warning: Unable to use extension')
    }


    gl.n = tetrahedron(gl, 5);
    var theta = 0.0;

    var vPosition = gl.getAttribLocation( program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    function initTexture(gl, callback) {
        // Texture file paths
        var texturePaths = [
            'textures/sun.jpg',
            'textures/earth.jpg',
        ];
    
        // Store texture objects to avoid garbage collection
        let textures = [];
        let loadedCount = 0;
    
        for (let i = 0; i < texturePaths.length; i++) {
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
            image.src = texturePaths[i];
        }
    }
    
    gl.v_TexIndexLoc = gl.getUniformLocation(program, 'v_TexIndex');
    gl.MLoc = gl.getUniformLocation(program, 'M');
    gl.VLoc = gl.getUniformLocation(program, 'V');
    gl.PLoc = gl.getUniformLocation(program, 'P');
    gl.MVPLoc = gl.getUniformLocation(program, 'MVP');
    gl.V = lookAt(vec3(0, 0, -4.5), vec3(0, 0, 0), vec3(0.0, 1.0, 0.0));
    gl.P = perspective(90.0, 1.0, 0.1, 10.0);
    initTexture(gl, () => {
        // Start drawing
        var tick = function () {
            theta += 1;
            draw(gl, theta);
            requestAnimationFrame(tick);
        };
        tick();
    });

}

function draw(gl, theta)
{
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    initPlanet(gl, vec3(0, 0, 0), vec3(1, 1, 1), theta, 0);
    initPlanet(gl, vec3(5.0, 0.0, 5.0), vec3(0.5, 0.5, 0.5), theta, 1);
}

//Place the remainig planets relative to the position of the sun.
function initPlanet(gl, translateVec, scaleVec, theta, planet) { // Deez balls
    
    gl.uniform1i(gl.v_TexIndexLoc, planet);

    let M = mat4();
    M = mult(M, translate(translateVec));
    M = mult(M, rotateY(-theta));
    M = mult(M, scalem(scaleVec));
        
    gl.uniformMatrix4fv(gl.MVPLoc, false, flatten(mult(gl.P, mult(gl.V, M))));
    gl.drawArrays(gl.TRIANGLES, 0, gl.n);
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