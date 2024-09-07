window.onload = function init() {
    var canvas = document.getElementById("c")
    var gl = WebGLUtils.setupWebGL(canvas)
    gl.viewport( 0, 0, canvas.width, canvas.height )
    if (!gl) {
    alert("WebGL isn't available")
        }
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0)
    gl.clear(gl.COLOR_BUFFER_BIT)
}