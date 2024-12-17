var g_objDoc = null; // The information of OBJ file
var g_drawingInfo = null; // The information for drawing 3D model

var currentAngle = [0.0, 0.0]; // [x-axis, y-axis] degrees

var MVP = mat4(); // Model view projection matrix
var q_rot = new Quaternion();  // Cumulative rotation quaternion
var q_inc = new Quaternion();  // Incremental rotation quaternion

var LOL = 0;
var KEK = 1;
var DOG = 10;

window.onload = function init()
{   

  var canvas = document.getElementById("gl-canvas");
  
  let gl = WebGLUtils.setupWebGL( canvas );
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
  gl.cullFace(gl.BACK);
  gl.frontFace(gl.CCW);
  
  program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);
  gl.program = program;
  
  var ext = gl.getExtension("OES_element_index_uint");
  if (!ext){
      console.log('Warning: Unable to use extension')
    }
    
  
  // Get the storage locations of attribute and uniform variables
  program.a_Position = gl.getAttribLocation(program, 'vPosition');
  program.a_Normal = gl.getAttribLocation(program, 'a_Normal');
  program.a_Color = gl.getAttribLocation(program, 'a_Color');
  
  // Prepare empty buffer objects for vertex coordinates, colors, and normals
  let model = initVertexBuffers(gl, program);
  
  // Start reading the OBJ file
  readOBJFile('data/FarmDog.OBJ', gl, model, 40, true);


  // Diffuse reflection coefficient (Kd)
  gl.uniform1f(gl.getUniformLocation(program, "diffuse_coef"), 0.9);
  document.getElementById("Kd").oninput = 
      function(event) { gl.uniform1f(gl.getUniformLocation(program, "diffuse_coef"), event.srcElement.value); }
  
  // Specular coefficient (Ks)
  gl.uniform1f(gl.getUniformLocation(program, "spec"), 1.0);
  document.getElementById("Ks").oninput = 
      function(event) { gl.uniform1f(gl.getUniformLocation(program, "spec"), event.srcElement.value); }
  
  // Shininess coefficient (s)
  gl.uniform1f(gl.getUniformLocation(program, "shininess"), 100);
  document.getElementById("s").oninput = 
      function(event) { gl.uniform1f(gl.getUniformLocation(program, "shininess"), event.srcElement.value); }
  
  // Light emission (Le)
  gl.uniform4fv(gl.getUniformLocation(program, "emission"), [0.3, 0.3, 0.3, 1.0]);
  document.getElementById("Le").oninput = 
      function(event) { 
          let val = event.srcElement.value;
          gl.uniform4fv(gl.getUniformLocation(program, "emission"), [val, val, val, 1.0]); }
  
  // Ambient light intensity (La)
  gl.uniform4fv(gl.getUniformLocation(program, "ambient"), [0.7, 0.7, 0.7, 1.0]);
  document.getElementById("La").oninput = 
      function(event) { 
          let val = event.srcElement.value;
          gl.uniform4fv(gl.getUniformLocation(program, "ambient"), [val, val, val, 1.0]); }
  
  document.getElementById("LOL").oninput = function(event) { LOL = event.srcElement.value; }
  document.getElementById("KEK").oninput = function(event) { KEK = event.srcElement.value; }
  document.getElementById("DOG").oninput = function(event) { DOG = event.srcElement.value; }

  // Register the event handler
  initEventHandlers(canvas);
  render(gl, model);  
}



function render(gl, model){
  var up = q_rot.apply(vec3(0, 1, 50));
  var rot_eye = q_rot.apply(vec3(0, 1.0, 2.0));
  let P = perspective(80, 1, 0.1, 100);
  let V = lookAt(q_rot.apply(up), vec3(0, 0, 0), q_rot.apply(rot_eye));
  MVP = mult(P, V);
  gl.uniformMatrix4fv(gl.getUniformLocation(program, "MVP"), false, flatten(MVP));

  gl.clearColor(0.3921,0.5843,0.9224,1.0);
  if (!g_objDoc) return;
  g_drawingInfo = onReadComplete(gl,model,g_objDoc);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.drawElements(gl.TRIANGLES, g_drawingInfo.indices.length,gl.UNSIGNED_INT, 0);
  
  requestAnimationFrame(() => {render(gl, model)});
}


function initEventHandlers(canvas) {
  var dragging = false;         // Dragging or not
  var lastX = -1, lastY = -1;   // Last position of the mouse
  var current_action = 0;       // Actions: 0 - none, 1 - orbit, 2 - dolly, 3 - pan

  canvas.onmousedown = function (ev) {   // Mouse is pressed
    
    ev.preventDefault();
    var x = ev.clientX, y = ev.clientY;
    // Start dragging if a mouse is in <canvas>
    var rect = ev.target.getBoundingClientRect();
    if (rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom) {
      lastX = x; lastY = y;
      dragging = true;
      current_action = ev.button + 1;
    }
  };

  canvas.oncontextmenu = function (ev) { ev.preventDefault(); };

  canvas.onmouseup = function (ev) {
    var x = ev.clientX, y = ev.clientY;
    if (x === lastX && y === lastY) {
      q_inc.setIdentity();
    }
    dragging = false;
    current_action = 0;
  }; // Mouse is released

  canvas.onmousemove = function (ev) { // Mouse is moved
    var x = ev.clientX, y = ev.clientY;
    if (dragging) {
      var rect = ev.target.getBoundingClientRect();
      var s_x = ((x - rect.left) / rect.width - 0.5) * 2;
      var s_y = (0.5 - (y - rect.top) / rect.height) * 2;
      var s_last_x = ((lastX - rect.left) / rect.width - 0.5) * 2;
      var s_last_y = (0.5 - (lastY - rect.top) / rect.height) * 2;
      var v1 = vec3(s_x, s_y, project_to_sphere(s_x, s_y));
      var v2 = vec3(s_last_x, s_last_y, project_to_sphere(s_last_x, s_last_y));
      q_inc = q_inc.make_rot_vec2vec(normalize(v1), normalize(v2));
      q_rot = q_rot.multiply(q_inc);
    }
    lastX = x, lastY = y;
  };
}
///////////////////////////////////////////
// DRAW
///////////////////////////////////////////






// Project an x,y pair onto a sphere of radius r OR a hyperbolic sheet
// if we are away from the center of the sphere.
function project_to_sphere(x, y) {
  var r = 2;
  var d = Math.sqrt(x * x + y * y);
  var t = r * Math.sqrt(2);
  var z;
  if (d < r) // Inside sphere
    z = Math.sqrt(r * r - d * d);
  else if (d < t)
    z = 0;
  else       // On hyperbola
    z = t * t / d;
  return z;
}

// Create a buffer object and perform the initial configuration
function initVertexBuffers(gl, program) {
  var o = new Object();
  o.vertexBuffer = createEmptyArrayBuffer(gl, program.a_Position, 3, gl.FLOAT);
  o.normalBuffer = createEmptyArrayBuffer(gl, program.a_Normal, 3, gl.FLOAT);
  o.colorBuffer = createEmptyArrayBuffer(gl, program.a_Color, 4, gl.FLOAT);
  o.indexBuffer = gl.createBuffer();
  
  return o;
}

// Create a buffer object, assign it to attribute variables, and enable the assignment
function createEmptyArrayBuffer(gl, a_attribute, num, type) {
  var buffer = gl.createBuffer(); // Create a buffer object
  
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
  gl.enableVertexAttribArray(a_attribute); // Enable the assignment
  
  return buffer;
}

// Read a file
function readOBJFile(fileName, gl, model, scale, reverse) {
  var request = new XMLHttpRequest();
  
  request.onreadystatechange = function() {
    if (request.readyState === 4 && request.status !== 404) {
      onReadOBJFile(request.responseText, fileName, gl, model, scale, reverse);
      render(gl, model);
    }
  }
  request.open('GET', fileName, true); // Create a request to get file
  request.send(); // Send the request
}

// OBJ file has been read
function onReadOBJFile(fileString, fileName, gl, o, scale, reverse) {
  var objDoc = new OBJDoc(fileName); // Create an OBJDoc object
  var result = objDoc.parse(fileString, scale, reverse);
  if (!result) {
    g_objDoc = null; g_drawingInfo = null;
    console.log("OBJ file parsing error.");
    return;
  }
  g_objDoc = objDoc;
}

// OBJ File has been read completely
function onReadComplete(gl, model, objDoc) {
  // Acquire the vertex coordinates and colors from OBJ file
  var drawingInfo = objDoc.getDrawingInfo();

  // Write data into the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, model.vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.vertices, gl.STATIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, model.normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.normals, gl.STATIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, model.colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.colors, gl.STATIC_DRAW);

  // Write the indices to the buffer object
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, drawingInfo.indices, gl.STATIC_DRAW);

  return drawingInfo;
}

//------------------------------------------------------------------------------
// OBJParser
//------------------------------------------------------------------------------

// OBJDoc object
// Constructor
var OBJDoc = function (fileName) {
  this.fileName = fileName;
  this.mtls = new Array(0);      // Initialize the property for MTL
  this.objects = new Array(0);   // Initialize the property for Object
  this.vertices = new Array(0);  // Initialize the property for Vertex
  this.normals = new Array(0);   // Initialize the property for Normal
}

// Parsing the OBJ file
OBJDoc.prototype.parse = function (fileString, scale, reverse) {
  var lines = fileString.split('\n');  // Break up into lines and store them as array
  lines.push(null); // Append null
  var index = 0;    // Initialize index of line

  var currentObject = new OBJObject("");
  this.objects.push(currentObject);
  var currentMaterialName = "";

  // Parse line by line
  var line;         // A string in the line to be parsed
  var sp = new StringParser();  // Create StringParser
  while ((line = lines[index++]) != null) {
    sp.init(line);                  // init StringParser
    var command = sp.getWord();     // Get command
    if (command == null) continue;  // check null command

    switch (command) {
      case '#':
        continue;  // Skip comments
      case 'mtllib':     // Read Material chunk
        var path = this.parseMtllib(sp, this.fileName);
        var mtl = new MTLDoc();   // Create MTL instance
        this.mtls.push(mtl);
        var request = new XMLHttpRequest();
        request.onreadystatechange = function () {
          if (request.readyState == 4) {
            if (request.status != 404) {
              onReadMTLFile(request.responseText, mtl);
            } else {
              mtl.complete = true;
            }
          }
        }
        request.open('GET', path, true);  // Create a request to acquire the file
        request.send();                   // Send the request
        continue; // Go to the next line
      case 'o':
      case 'g':   // Read Object name
        if (currentObject.numIndices == 0) {
          currentObject = this.parseObjectName(sp);
          this.objects[0] = currentObject;
        }
        else {
          var object = this.parseObjectName(sp);
          this.objects.push(object);
          currentObject = object;
        }
        continue; // Go to the next line
      case 'v':   // Read vertex
        var vertex = this.parseVertex(sp, scale);
        this.vertices.push(vertex);
        continue; // Go to the next line
      case 'vn':   // Read normal
        var normal = this.parseNormal(sp);
        this.normals.push(normal);
        continue; // Go to the next line
      case 'usemtl': // Read Material name
        currentMaterialName = this.parseUsemtl(sp);
        continue; // Go to the next line
      case 'f': // Read face
        var face = this.parseFace(sp, currentMaterialName, this.vertices, reverse);
        currentObject.addFace(face);
        continue; // Go to the next line
    }
  }

  return true;
}

OBJDoc.prototype.parseMtllib = function (sp, fileName) {
  // Get directory path
  var i = fileName.lastIndexOf("/");
  var dirPath = "";
  if (i > 0) dirPath = fileName.substr(0, i + 1);

  return dirPath + sp.getWord();   // Get path
}

OBJDoc.prototype.parseObjectName = function (sp) {
  var name = sp.getWord();
  return (new OBJObject(name));
}

OBJDoc.prototype.parseVertex = function (sp, scale) {
  var x = sp.getFloat() * scale;
  var y = sp.getFloat() * scale;
  var z = sp.getFloat() * scale;
  return (new Vertex(x, y, z));
}

OBJDoc.prototype.parseNormal = function (sp) {
  var x = sp.getFloat();
  var y = sp.getFloat();
  var z = sp.getFloat();
  return (new Normal(x, y, z));
}

OBJDoc.prototype.parseUsemtl = function (sp) {
  return sp.getWord();
}

OBJDoc.prototype.parseFace = function (sp, materialName, vertices, reverse) {
  var face = new Face(materialName);
  // get indices
  for (; ;) {
    var word = sp.getWord();
    if (word == null) break;
    var subWords = word.split('/');
    if (subWords.length >= 1) {
      var vi = parseInt(subWords[0]) - 1;
      if (!isNaN(vi))
        face.vIndices.push(vi);
    }
    if (subWords.length >= 3) {
      var ni = parseInt(subWords[2]) - 1;
      face.nIndices.push(ni);
    } else {
      face.nIndices.push(-1);
    }
  }

  // calc normal
  var v0 = [
    vertices[face.vIndices[0]].x,
    vertices[face.vIndices[0]].y,
    vertices[face.vIndices[0]].z];
  var v1 = [
    vertices[face.vIndices[1]].x,
    vertices[face.vIndices[1]].y,
    vertices[face.vIndices[1]].z];
  var v2 = [
    vertices[face.vIndices[2]].x,
    vertices[face.vIndices[2]].y,
    vertices[face.vIndices[2]].z];

  // 面の法線を計算してnormalに設定
  var normal = calcNormal(v0, v1, v2);
  // 法線が正しく求められたか調べる
  if (normal == null) {
    if (face.vIndices.length >= 4) { // 面が四角形なら別の3点の組み合わせで法線計算
      var v3 = [
        vertices[face.vIndices[3]].x,
        vertices[face.vIndices[3]].y,
        vertices[face.vIndices[3]].z];
      normal = calcNormal(v1, v2, v3);
    }
    if (normal == null) {         // 法線が求められなかったのでY軸方向の法線とする
      normal = [0.0, 1.0, 0.0];
    }
  }
  if (reverse) {
    normal[0] = -normal[0];
    normal[1] = -normal[1];
    normal[2] = -normal[2];
  }
  face.normal = new Normal(normal[0], normal[1], normal[2]);

  // Devide to triangles if face contains over 3 points.
  if (face.vIndices.length > 3) {
    var n = face.vIndices.length - 2;
    var newVIndices = new Array(n * 3);
    var newNIndices = new Array(n * 3);
    for (var i = 0; i < n; i++) {
      newVIndices[i * 3 + 0] = face.vIndices[0];
      newVIndices[i * 3 + 1] = face.vIndices[i + 1];
      newVIndices[i * 3 + 2] = face.vIndices[i + 2];
      newNIndices[i * 3 + 0] = face.nIndices[0];
      newNIndices[i * 3 + 1] = face.nIndices[i + 1];
      newNIndices[i * 3 + 2] = face.nIndices[i + 2];
    }
    face.vIndices = newVIndices;
    face.nIndices = newNIndices;
  }
  face.numIndices = face.vIndices.length;

  return face;
}

// Analyze the material file
function onReadMTLFile(fileString, mtl) {
  var lines = fileString.split('\n');  // Break up into lines and store them as array
  lines.push(null);           // Append null
  var index = 0;              // Initialize index of line

  // Parse line by line
  var line;      // A string in the line to be parsed
  var name = ""; // Material name
  var sp = new StringParser();  // Create StringParser
  while ((line = lines[index++]) != null) {
    sp.init(line);                  // init StringParser
    var command = sp.getWord();     // Get command
    if (command == null) continue;  // check null command

    switch (command) {
      case '#':
        continue;    // Skip comments
      case 'newmtl': // Read Material chunk
        name = mtl.parseNewmtl(sp);    // Get name
        continue; // Go to the next line
      case 'Kd':   // Read normal
        if (name == "") continue; // Go to the next line because of Error
        var material = mtl.parseRGB(sp, name);
        mtl.materials.push(material);
        name = "";
        continue; // Go to the next line
    }
  }
  mtl.complete = true;
}

// Check Materials
OBJDoc.prototype.isMTLComplete = function () {
  if (this.mtls.length == 0) return true;
  for (var i = 0; i < this.mtls.length; i++) {
    if (!this.mtls[i].complete) return false;
  }
  return true;
}

// Find color by material name
OBJDoc.prototype.findColor = function (name) {
  for (var i = 0; i < this.mtls.length; i++) {
    for (var j = 0; j < this.mtls[i].materials.length; j++) {
      if (this.mtls[i].materials[j].name == name) {
        return (this.mtls[i].materials[j].color)
      }
    }
  }
  return (new Color(0.8, 0.8, 0.8, 1));
}

//------------------------------------------------------------------------------
// Retrieve the information for drawing 3D model
OBJDoc.prototype.getDrawingInfo = function () {
  // Create an arrays for vertex coordinates, normals, colors, and indices
  var numVertices = 0;
  var numIndices = 0;
  for (var i = 0; i < this.objects.length; i++) {
    numIndices += this.objects[i].numIndices;
  }
  var numVertices = this.vertices.length;
  var vertices = new Float32Array(numVertices * 3);
  var normals = new Float32Array(numVertices * 3);
  var colors = new Float32Array(numVertices * 4);
  var indices = new Uint32Array(numIndices);

  // Set vertex, normal and color
  var index_indices = 0;
  for (var i = 0; i < this.objects.length; i++) {
    var object = this.objects[i];
    for (var j = 0; j < object.faces.length; j++) {
      var face = object.faces[j];
      var color = this.findColor(face.materialName);
      var faceNormal = face.normal;
      for (var k = 0; k < face.vIndices.length; k++) {
        // Set index
        var vIdx = face.vIndices[k];
        indices[index_indices] = vIdx;
        // Copy vertex
        var vertex = this.vertices[vIdx];
        vertices[vIdx * 3 + 0] = vertex.x;
        vertices[vIdx * 3 + 1] = vertex.y;
        vertices[vIdx * 3 + 2] = vertex.z;
        // Copy color
        colors[vIdx * 4 + 0] = color.r;
        colors[vIdx * 4 + 1] = color.g;
        colors[vIdx * 4 + 2] = color.b;
        colors[vIdx * 4 + 3] = color.a;
        // Copy normal
        var nIdx = face.nIndices[k];
        if (nIdx >= 0) {
          var normal = this.normals[nIdx];
          normals[vIdx * 3 + 0] = normal.x;
          normals[vIdx * 3 + 1] = normal.y;
          normals[vIdx * 3 + 2] = normal.z;
        } else {
          normals[vIdx * 3 + 0] = faceNormal.x;
          normals[vIdx * 3 + 1] = faceNormal.y;
          normals[vIdx * 3 + 2] = faceNormal.z;
        }
        index_indices++;
      }
    }
  }

  return new DrawingInfo(vertices, normals, colors, indices);
}

//------------------------------------------------------------------------------
// MTLDoc Object
//------------------------------------------------------------------------------
var MTLDoc = function () {
  this.complete = false; // MTL is configured correctly
  this.materials = new Array(0);
}

MTLDoc.prototype.parseNewmtl = function (sp) {
  return sp.getWord();         // Get name
}

MTLDoc.prototype.parseRGB = function (sp, name) {
  var r = sp.getFloat();
  var g = sp.getFloat();
  var b = sp.getFloat();
  return (new Material(name, r, g, b, 1));
}

//------------------------------------------------------------------------------
// Material Object
//------------------------------------------------------------------------------
var Material = function (name, r, g, b, a) {
  this.name = name;
  this.color = new Color(r, g, b, a);
}

//------------------------------------------------------------------------------
// Vertex Object
//------------------------------------------------------------------------------
var Vertex = function (x, y, z) {
  this.x = x;
  this.y = y;
  this.z = z;
}

//------------------------------------------------------------------------------
// Normal Object
//------------------------------------------------------------------------------
var Normal = function (x, y, z) {
  this.x = x;
  this.y = y;
  this.z = z;
}

//------------------------------------------------------------------------------
// Color Object
//------------------------------------------------------------------------------
var Color = function (r, g, b, a) {
  this.r = r;
  this.g = g;
  this.b = b;
  this.a = a;
}

//------------------------------------------------------------------------------
// OBJObject Object
//------------------------------------------------------------------------------
var OBJObject = function (name) {
  this.name = name;
  this.faces = new Array(0);
  this.numIndices = 0;
}

OBJObject.prototype.addFace = function (face) {
  this.faces.push(face);
  this.numIndices += face.numIndices;
}

//------------------------------------------------------------------------------
// Face Object
//------------------------------------------------------------------------------
var Face = function (materialName) {
  this.materialName = materialName;
  if (materialName == null) this.materialName = "";
  this.vIndices = new Array(0);
  this.nIndices = new Array(0);
}

//------------------------------------------------------------------------------
// DrawInfo Object
//------------------------------------------------------------------------------
var DrawingInfo = function (vertices, normals, colors, indices) {
  this.vertices = vertices;
  this.normals = normals;
  this.colors = colors;
  this.indices = indices;
}

//------------------------------------------------------------------------------
// Constructor
var StringParser = function (str) {
  this.str;   // Store the string specified by the argument
  this.index; // Position in the string to be processed
  this.init(str);
}
// Initialize StringParser object
StringParser.prototype.init = function (str) {
  this.str = str;
  this.index = 0;
}

// Skip delimiters
StringParser.prototype.skipDelimiters = function () {
  for (var i = this.index, len = this.str.length; i < len; i++) {
    var c = this.str.charAt(i);
    // Skip TAB, Space, '(', ')
    if (c == '\t' || c == ' ' || c == '(' || c == ')' || c == '"') continue;
    break;
  }
  this.index = i;
}

// Skip to the next word
StringParser.prototype.skipToNextWord = function () {
  this.skipDelimiters();
  var n = getWordLength(this.str, this.index);
  this.index += (n + 1);
}

// Get word
StringParser.prototype.getWord = function () {
  this.skipDelimiters();
  var n = getWordLength(this.str, this.index);
  if (n == 0) return null;
  var word = this.str.substr(this.index, n);
  this.index += (n + 1);

  return word;
}

// Get integer
StringParser.prototype.getInt = function () {
  return parseInt(this.getWord());
}

// Get floating number
StringParser.prototype.getFloat = function () {
  return parseFloat(this.getWord());
}

// Get the length of word
function getWordLength(str, start) {
  var n = 0;
  for (var i = start, len = str.length; i < len; i++) {
    var c = str.charAt(i);
    if (c == '\t' || c == ' ' || c == '(' || c == ')' || c == '"')
      break;
  }
  return i - start;
}

//------------------------------------------------------------------------------
// Common function
//------------------------------------------------------------------------------
function calcNormal(p0, p1, p2) {
  // v0: a vector from p1 to p0, v1; a vector from p1 to p2
  var v0 = new Float32Array(3);
  var v1 = new Float32Array(3);
  for (var i = 0; i < 3; i++) {
    v0[i] = p0[i] - p1[i];
    v1[i] = p2[i] - p1[i];
  }

  // The cross product of v0 and v1
  var c = new Float32Array(3);
  c[0] = v0[1] * v1[2] - v0[2] * v1[1];
  c[1] = v0[2] * v1[0] - v0[0] * v1[2];
  c[2] = v0[0] * v1[1] - v0[1] * v1[0];

  var x = c[0], y = c[1], z = c[2], g = Math.sqrt(x * x + y * y + z * z);
  if (g) {
    if (g == 1)
      return c;
  } else {
    c[0] = 0; c[1] = 0; c[2] = 0;
    return c;
  }
  g = 1 / g;
  c[0] = x * g; c[1] = y * g; c[2] = z * g;
  return c;
}

