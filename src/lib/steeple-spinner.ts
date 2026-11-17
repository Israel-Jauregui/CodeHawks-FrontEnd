// The Hacklonega stress ball, small and always turning. This is the sphere from that site
// (src/lib/steeple-sphere.ts there) with the squeezing, throwing and physics taken out:
// a real spherical mesh, the steeple artwork on the front, the landscape alone on the back,
// and the same soft lighting. Hand-written WebGL, no 3D library.

const vertexSource = `
  attribute vec3 aPosition;
  uniform mat3 uInverse;
  varying mediump vec3 vLocal;
  varying mediump vec3 vNormal;
  void main() {
    vNormal = aPosition;
    // The inverse rotation maps the flat artwork onto the turning sphere.
    vLocal = uInverse * aPosition;
    gl_Position = vec4(aPosition.xy, -aPosition.z * .5, 1.0);
  }
`;

const fragmentSource = `
  precision mediump float;
  uniform sampler2D uFront;
  uniform sampler2D uBack;
  varying mediump vec3 vLocal;
  varying mediump vec3 vNormal;
  void main() {
    vec3 local = normalize(vLocal);
    vec2 uv = local.xy * .5 + .5;
    vec4 ink = mix(texture2D(uBack, uv), texture2D(uFront, uv), smoothstep(-.025, .025, local.z));
    vec3 base = mix(vec3(.0549, .1412, .3804), ink.rgb, ink.a);
    vec3 normal = normalize(vNormal);
    vec3 light = normalize(vec3(-.5, .65, 1.2));
    float diffuse = max(dot(normal, light), 0.0);
    float sheen = pow(max(dot(normal, normalize(light + vec3(0., 0., 1.))), 0.0), 28.0);
    float rim = pow(1.0 - max(normal.z, 0.0), 3.0);
    vec3 color = base * (.62 + .38 * diffuse) + vec3(.12, .15, .2) * sheen;
    color += vec3(.04, .08, .16) * rim;
    gl_FragColor = vec4(color, 1.0);
  }
`;

function sphereMesh() {
  const positions: number[] = [];
  const indices: number[] = [];
  const rows = 32, columns = 48;
  for (let row = 0; row <= rows; row++) {
    const latitude = row / rows * Math.PI;
    for (let column = 0; column <= columns; column++) {
      const longitude = column / columns * Math.PI * 2;
      positions.push(Math.sin(latitude) * Math.cos(longitude), Math.cos(latitude), Math.sin(latitude) * Math.sin(longitude));
      if (row < rows && column < columns) {
        const a = row * (columns + 1) + column, b = a + columns + 1;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
  }
  return { positions: new Float32Array(positions), indices: new Uint16Array(indices) };
}

// The textures are ordinary files on this site, so the Content Security Policy needs no
// exception for them (the original built them in memory, which needed `blob:`).
function load(url: string, signal: AbortSignal): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not load ${url}`));
    signal.addEventListener('abort', () => { image.src = ''; reject(new DOMException('Aborted', 'AbortError')); }, { once: true });
    image.src = url;
  });
}

// The ball leans like a globe and turns about that leaning axis.
const TILT = -.3;

// Column-major inverse of Rz(TILT) * Ry(angle): Ry(-angle) * Rz(-TILT).
function inverseRotation(angle: number) {
  const c = Math.cos(angle), s = Math.sin(angle), ct = Math.cos(TILT), st = Math.sin(TILT);
  return new Float32Array([
    c * ct, -st, s * ct,
    c * st, ct, s * st,
    -s, 0, c,
  ]);
}

export type Spinner = { draw: (angle: number) => void; resize: (size: number) => void; dispose: () => void };

export async function createSpinner(canvas: HTMLCanvasElement, frontUrl: string, backUrl: string, signal: AbortSignal): Promise<Spinner> {
  const gl = canvas.getContext('webgl', { alpha: true, antialias: true, depth: true, stencil: false, powerPreference: 'low-power' });
  if (!gl) throw new Error('No WebGL');
  // Everything made here is freed with the context when the canvas goes away. The context is
  // deliberately not force-lost on dispose: in development React mounts a component twice, and
  // the second mount gets this same context back from the canvas.
  const made: { programs: WebGLProgram[]; shaders: WebGLShader[]; buffers: WebGLBuffer[]; textures: WebGLTexture[] } = { programs: [], shaders: [], buffers: [], textures: [] };
  const dispose = () => {
    made.shaders.forEach(shader => gl.deleteShader(shader));
    made.buffers.forEach(buffer => gl.deleteBuffer(buffer));
    made.textures.forEach(texture => gl.deleteTexture(texture));
    made.programs.forEach(program => gl.deleteProgram(program));
  };
  try {
    const [front, back] = await Promise.all([load(frontUrl, signal), load(backUrl, signal)]);
    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type)!;
      made.shaders.push(shader);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error('Cannot compile sphere shader');
      return shader;
    };
    const program = gl.createProgram()!;
    made.programs.push(program);
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexSource));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentSource));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Cannot link sphere program');
    gl.useProgram(program);

    const mesh = sphereMesh();
    for (const [target, data] of [[gl.ARRAY_BUFFER, mesh.positions], [gl.ELEMENT_ARRAY_BUFFER, mesh.indices]] as const) {
      const buffer = gl.createBuffer()!;
      made.buffers.push(buffer);
      gl.bindBuffer(target, buffer);
      gl.bufferData(target, data, gl.STATIC_DRAW);
    }
    const position = gl.getAttribLocation(program, 'aPosition');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 3, gl.FLOAT, false, 0, 0);

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    for (const [unit, image] of [front, back].entries()) {
      gl.activeTexture(gl.TEXTURE0 + unit);
      const texture = gl.createTexture()!;
      made.textures.push(texture);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      // The ball is drawn far smaller than its 256px artwork; mipmaps keep it from shimmering as it turns.
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }
    gl.uniform1i(gl.getUniformLocation(program, 'uFront'), 0);
    gl.uniform1i(gl.getUniformLocation(program, 'uBack'), 1);
    const inverse = gl.getUniformLocation(program, 'uInverse');
    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0, 0, 0, 0);
    if (gl.getError() !== gl.NO_ERROR) throw new Error('Sphere setup failed');

    return {
      draw(angle) {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.uniformMatrix3fv(inverse, false, inverseRotation(angle));
        gl.drawElements(gl.TRIANGLES, mesh.indices.length, gl.UNSIGNED_SHORT, 0);
      },
      resize(size) {
        if (canvas.width === size) return;
        canvas.width = canvas.height = size;
        gl.viewport(0, 0, size, size);
      },
      dispose,
    };
  } catch (error) {
    dispose();
    throw error;
  }
}
