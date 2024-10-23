// Frame buffer for 2D as opposed to Vertex buffer for 1D
// Texture elements are refered to as texels [2]
// Generating images [4]
// Use power of 2 for texture size [6]
// Set sampler2D to 0, otherwise for multitexturing [8]
// To consverve the sign lost by diviosn when computing u use atan(z, x) [12]




var pointsArray = [];
var numTimesToSubdivide = 1;



window.onload = function init() {
    let canvas = document.getElementById( "gl-canvas" );
    
    let gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
    
    
    let program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);
    gl.program = program;

    
    var ext = gl.getExtension('OES_element_index_uint');
    if (!ext) { console.log('Warning: Unable to use an extension'); }
    
    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    // Rect with vertices (−4, −1, −1), (4, −1, −1), (4, −1, −21), (−4, −1, −21)
    // And texture coordinates (−1.5, 0), (2.5, 0), (2.5, 10), (−1.5, 10)
    pointsArray = [
        vec4(-4, -1, -1, 1), 
        vec4(4, -1, -1, 1),  
        vec4(4, -1, -21, 1),  
        vec4(-4, -1, -1, 1), 
        vec4(4, -1, -21, 1), 
        vec4(-4, -1, -21, 1), 
    ];
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    // Texture coordinates
    let texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    
    let tex_coords = [
        vec2(-1.5, 0),
        vec2(2.5, 0),
        vec2(2.5, 10),
        vec2(-1.5, 0),
        vec2(2.5, 10),
        vec2(-1.5, 10),
    ]
    gl.bufferData(gl.ARRAY_BUFFER, flatten(tex_coords), gl.STATIC_DRAW);

    var kek = gl.getAttribLocation(program, "vTexCord");
    gl.vertexAttribPointer(kek, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(kek);

    // Texture
    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    let sampler = gl.getUniformLocation(gl.program, "texMap");  // Set sampler2D to 0
    gl.uniform1i(sampler, 0);

    
    // Checkboard
    let texSize = 64;
    let numRows = 8;
    let numCols = 8;

    let myTexels = new Uint8Array(4*texSize*texSize); // 4 for RGBA image, texSize is the resolution

    for(var i = 0; i < texSize; ++i)
        for(var j = 0; j < texSize; ++j) {
        var patchx = Math.floor(i/(texSize/numRows));
        var patchy = Math.floor(j/(texSize/numCols));
        var c = (patchx%2 !== patchy%2 ? 255 : 0);
        var idx = 4*(i*texSize + j);
        myTexels[idx] = myTexels[idx + 1] = myTexels[idx + 2] = c;
        myTexels[idx + 3] = 255;
        }
    
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, myTexels);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    
    render(gl);
}   

function render(gl) {
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0)
    gl.clear( gl.COLOR_BUFFER_BIT );

    // Model
    let M = mat4();

    // View
    //let V = lookAt(vec3(0, 0, -4.5), vec3(0, 0, 0.0), vec3(0.0, 1.0, 0.0));  // eye, at, look_up
    let V = mat4();

    // Perspective projection
    let P = perspective(90.0, 1.0, 0.1, 30.0);  // fovy, aspect (w/h), near, far  (near far are clipping)

    
    // First cube one-point
    let MVP = mult(mult(P, V), M);
    let mvp = gl.getUniformLocation(gl.program, "MVP");
    gl.uniformMatrix4fv(mvp, false, flatten(MVP));

    gl.drawArrays(gl.TRIANGLES, 0, pointsArray.length);

    
}