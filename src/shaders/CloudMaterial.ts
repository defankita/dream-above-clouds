import { shaderMaterial } from '@react-three/drei'
import * as THREE from 'three'

// 3D Simplex noise
const noise = `
// Description : Array and textureless GLSL 2D/3D/4D simplex noise functions.
//      Author : Ian McEwan, Ashima Arts.
//  Maintainer : stegu
//     Lastmod : 20110822 (ijm)
//     License : Copyright (C) 2011 Ashima Arts. All rights reserved.
//               Distributed under the MIT License. See LICENSE file.
//               https://github.com/ashima/webgl-noise
//               https://github.com/stegu/webgl-noise

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 = v - i + dot(i, C.xxx) ;

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289(i);
  vec4 p = permute( permute( permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

  float n_ = 0.142857142857; // 1.0/7.0
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
}

float fbm(vec3 x) {
  float v = 0.0;
  float a = 0.5;
  vec3 shift = vec3(100.0);
  for (int i = 0; i < 4; ++i) {
    v += a * snoise(x);
    x = x * 2.0 + shift;
    a *= 0.5;
  }
  return v;
}
`

export const CloudMaterial = shaderMaterial(
  {
    uTime: 0,
    uColor: new THREE.Color('#bbbbcc'),
    uHighlight: new THREE.Color('#ffffff'),
    uShadow: new THREE.Color('#888899'),
    uFootprintMap: null,
    uPlayerPos: new THREE.Vector3(),
    uResolution: new THREE.Vector2(1024, 1024),
    uMapArea: 20.0, // Size of the footprint projection area
  },
  // vertex shader
  /* glsl */`
    ${noise}
    
    uniform float uTime;
    uniform sampler2D uFootprintMap;
    uniform vec3 uPlayerPos;
    uniform float uMapArea;
    
    varying vec2 vUv;
    varying float vNoise;
    varying vec3 vWorldPos;
    varying vec3 vNormal;
    varying float vFootprintDisp;
    
    void main() {
      vUv = uv;
      vNormal = normalMatrix * normal;
      
      // Calculate world position
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPos = worldPosition.xyz;
      
      // Base cloud noise displacement
      float n = fbm(worldPosition.xyz * 0.3 + vec3(0.0, uTime * 0.05, uTime * 0.1));
      float displacement = n * 1.5;
      
      // Analytical footprint compression (bend clouds under player)
      float footDist = distance(worldPosition.xz, uPlayerPos.xz);
      float footDisp = 0.0;
      if (footDist < 5.0) {
        // Smoothly compress clouds in a 5-unit radius around player
        float compression = 1.0 - smoothstep(0.0, 5.0, footDist);
        footDisp = compression * 1.5; 
      }
      
      vNoise = n;
      vFootprintDisp = footDisp;
      
      // Apply displacement
      vec3 displacedPos = position + normal * (displacement - footDisp);
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(displacedPos, 1.0);
    }
  `,
  // fragment shader
  /* glsl */`
    uniform vec3 uColor;
    uniform vec3 uHighlight;
    uniform vec3 uShadow;
    uniform float uTime;
    
    varying vec2 vUv;
    varying float vNoise;
    varying vec3 vWorldPos;
    varying vec3 vNormal;
    varying float vFootprintDisp;
    
    void main() {
      // Basic rim lighting and subsurface-like scattering
      // We mix colors based on noise and height to simulate depth
      float heightMask = smoothstep(-1.0, 1.0, vNoise);
      
      vec3 finalColor = mix(uShadow, uColor, heightMask);
      finalColor = mix(finalColor, uHighlight, smoothstep(0.4, 0.8, vNoise));
      
      // (Footprint glow removed per user request)
      
      // Add a slight alpha fade at the lowest parts to blend into the darkness
      float alpha = smoothstep(-0.5, 0.0, vNoise + 0.5);
      
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
)
