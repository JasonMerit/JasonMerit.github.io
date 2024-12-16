
var vertices = [];

var ground_texture;
var red_texture;

var M_p = mat4();
M_p[3][3] = 0;
M_p[3][1] = 1 / -(2 - (-1));
var theta = 0;

window.onload = function init(){
    let canvas = document.getElementById( "gl-canvas" );
    
    let gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
    
    
    let program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);
    gl.program = program;
    
    var ext = gl.getExtension("OES_element_index_uint");
    if (!ext) { console.log('Warning: Unable to use an extension'); }

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.frontFace(gl.CCW);

    // Buffers
    pointsArray = [
        vec4(-2.0, -1.0, -1.0,1), // Ground
        vec4(2.0, -1.0, -1.0,1),
        vec4(2.0, -1.0, -5.0,1),
        vec4(-2.0, -1.0, -5.0,1),

        vec4(0.25, -0.5, -1.25,1), // Flat quad
        vec4(0.75, -0.5, -1.25,1),
        vec4(0.75, -0.5, -1.75,1),
        vec4(0.25, -0.5, -1.75,1),

        vec4(-1.0, -1.0, -3.0,1), // Standing quad
        vec4(-1.0, 0.0, -3.0,1),
        vec4(-1.0, 0.0, -2.5,1),
        vec4(-1.0, -1.0, -2.5,1),
    ];

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation( program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    
    // Create and bind the element buffer
    var indices = [0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11];
    iBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(indices), gl.STATIC_DRAW);

    var texCoordsArray = [
        vec2(-1., 0.0),
        vec2(1., 0.0),
        vec2(1, 1.0),
        vec2(-1., 1.0),

        vec2(-1., 0.0),
        vec2(1., 0.0),
        vec2(1, 1.0),
        vec2(-1., 1.0),
        
        vec2(-1., 0.0),
        vec2(1., 0.0),
        vec2(1, 1.0),
        vec2(-1., 1.0),
    ];

    var tBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW);

    var vTexCoord = gl.getAttribLocation(program, "vTexCoord");
    gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vTexCoord);

    // Ground texture
    var image = document.createElement('img');
    image.crossorigin = 'anonymous';
    image.onload = function () { 
        ground_texture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, ground_texture);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.generateMipmap(gl.TEXTURE_2D);
    };
    image.src = 'xamp23.png';

    // Red texture
    red_texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, red_texture);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,1,1,0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 0, 0,255]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.generateMipmap(gl.TEXTURE_2D);

    // Perspective projection
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0)
    let P = perspective(90.0, 1.0, 0.1, 30.0);  // fovy, aspect (w/h), near, far  (near far are clipping)
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "P"), false, flatten(P));
    
    render(gl);
}


function render(gl){
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    // Ground
    gl.bindTexture(gl.TEXTURE_2D, ground_texture);
    gl.uniform1i(gl.getUniformLocation(gl.program, "texMap"), 0);
    gl.drawElements( gl.TRIANGLES, 6, gl.UNSIGNED_BYTE, 0);
    
    // Moving shadows
    gl.uniform1i(gl.getUniformLocation(gl.program, "texMap"), 1);
    gl.bindTexture(gl.TEXTURE_2D, red_texture);
    
    theta += 0.03;
    let light = vec3(2 * Math.sin(theta), 2, 2 * Math.cos(theta) - 2);
    let T_p = translate(light);
    let T_n = translate(negate(light)); // Negate the vec3 for the reverse translation
    M_s = mult(mult(T_p, M_p), T_n);
    
    gl.uniformMatrix4fv(gl.getUniformLocation(gl.program, "M_s"), false, flatten(M_s));
    gl.drawElements( gl.TRIANGLES, 12, gl.UNSIGNED_BYTE, 6);
    
    // Red quads
    gl.uniformMatrix4fv(gl.getUniformLocation(gl.program, "M_s"), false, flatten(mat4()));
    gl.drawElements( gl.TRIANGLES, 12, gl.UNSIGNED_BYTE, 6);

    window.requestAnimFrame(() => render(gl));
    }