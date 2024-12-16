var theta = 0.0;

var numTimesToSubdivide = 5;
var g_tex_ready = 0;

var pointsArray = [];

function triangle(a, b, c) {
    pointsArray.push(a);
    pointsArray.push(b);
    pointsArray.push(c);
}

function divideTriangle(a, b, c, count) {
    if ( count > 0 ) {
        var ab = mix( a, b, 0.5);
        var ac = mix( a, c, 0.5);
        var bc = mix( b, c, 0.5);

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

function tetrahedron(a, b, c, d, n) {
    divideTriangle(a, b, c, n);
    divideTriangle(d, c, b, n);
    divideTriangle(a, d, b, n);
    divideTriangle(a, c, d, n);
}


window.onload = function init()
{   
    // Setup
    let canvas = document.getElementById( "gl-canvas" );
    let gl = WebGLUtils.setupWebGL( canvas );
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);
    gl.program = program;
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);
    

    var ext = gl.getExtension("OES_element_index_uint");
    if (!ext){
        console.log('Warning: Unable to use extension')
    }

    var va = vec4(0.0, 0.0, 1.0,1);
    var vb = vec4(0.0, 0.942809, -0.333333, 1);
    var vc = vec4(-0.816497, -0.471405, -0.333333, 1);
    var vd = vec4(0.816497, -0.471405, -0.333333,1);

    tetrahedron(va, vb, vc, vd, numTimesToSubdivide);

    pointsArray.push(  
    vec4(-1.0, -1.0, 0.999, 1.0), // Bottom-left
    vec4( 1.0, -1.0, 0.999, 1.0), // Bottom-right
    vec4(-1.0,  1.0, 0.999, 1.0),  // Top-right


    vec4(-1.0, 1.0, 0.999, 1.0), // Top-left
    vec4(1.0, -1.0, 0.999, 1.0), // Top-left
    vec4(1.0, 1.0, 0.999, 1.0)) ;// Top-left)

    vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation( program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    g_tex_ready = 0;
    function initTexture()
    {
        var cubemap = ['textures/cm_left.png', // POSITIVE_X
        'textures/cm_right.png', // NEGATIVE_X
        'textures/cm_top.png', // POSITIVE_Y
        'textures/cm_bottom.png', // NEGATIVE_Y
        'textures/cm_back.png', // POSITIVE_Z
        'textures/cm_front.png']; // NEGATIVE_Z

        gl.activeTexture(gl.TEXTURE0);
        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

        for(var i = 0; i < 6; ++i) {
            var image = document.createElement('img');
            image.crossorigin = 'anonymous';
            image.textarget = gl.TEXTURE_CUBE_MAP_POSITIVE_X + i;

            image.onload = function(event)
            {
                var image = event.target;
                gl.activeTexture(gl.TEXTURE0);
                gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
                gl.texImage2D(image.textarget, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
                ++g_tex_ready;
            };
            image.src = cubemap[i];
        }
        gl.uniform1i(gl.getUniformLocation(program, "texMap"), 0);

    }

    // W6P3 Texturing earth - Normal map
    var image = document.createElement('img');
    image.crossorigin = 'anonymous';
    image.onload = function () { 
        gl.activeTexture(gl.TEXTURE1);
        let texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(gl.getUniformLocation(gl.program, "texBumpy"), 1); // Set sampler2D to 1 };
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.generateMipmap(gl.TEXTURE_2D);
        ++g_tex_ready;
    }
    image.src = 'textures/normalmap.png';

    initTexture();
    render(gl);
    
}

function render(gl)
{
    window.requestAnimFrame(() => render(gl));
    if (g_tex_ready < 7){ return; }
    
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // View
    theta += 0.01;
    let eye = vec3(3.5*Math.sin(theta), 0.0, 3.5*Math.cos(theta))
    gl.uniform3fv(gl.getUniformLocation(gl.program, "eye"), flatten(eye));
    let V = lookAt(eye, vec3(0, 0, 0.0), vec3(0.0, 1.0, 0.0));  // eye, at, look_up

    // Perspective projection
    let P = perspective(90.0, 1.0, 0.1, 10.0);  // fovy, aspect (w/h), near, far  (near far are clipping)

    send(gl, mat4(), V, P, 1.0);
    gl.drawArrays(gl.TRIANGLES, 0, pointsArray.length - 6);

    // Background quad
    let i_w = inverse(V);
    i_w[0][3] = i_w[1][3] = i_w[2][3] = 0.0;
    i_w = mult(i_w, inverse(P));

    send(gl, i_w, mat4(), mat4(), 0.0);
    gl.drawArrays(gl.TRIANGLES, pointsArray.length -6, 6);

}

function send(gl, M, V, P, reflect) {
    gl.uniformMatrix4fv(gl.getUniformLocation(gl.program, "M"), false, flatten(M)); 
    gl.uniformMatrix4fv(gl.getUniformLocation(gl.program, "V"), false, flatten(V));
    gl.uniformMatrix4fv(gl.getUniformLocation(gl.program, "P"), false, flatten(P));
    gl.uniform1f(gl.getUniformLocation(gl.program, "reflective"), reflect);
}