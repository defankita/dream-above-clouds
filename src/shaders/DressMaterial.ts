import { shaderMaterial } from '@react-three/drei'
import * as THREE from 'three'

export const DressMaterial = shaderMaterial(
  {
    uTime: 0,
    uColorDark: new THREE.Color('#0a1128'), // deep night blue
    uColorLight: new THREE.Color('#4c6b99'), // starlight blue/silver
  },
  // vertex shader
  /* glsl */`
    varying vec2 vUv;
    varying vec3 vWorldPosition;
    varying vec3 vNormal;
    void main() {
      vUv = uv;
      vNormal = normalMatrix * normal;
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
  `,
  // fragment shader
  /* glsl */`
    uniform vec3 uColorDark;
    uniform vec3 uColorLight;
    uniform float uTime;
    
    varying vec2 vUv;
    varying vec3 vWorldPosition;
    varying vec3 vNormal;
    
    float hash(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }
    
    void main() {
      // Base gradient (darker at bottom, lighter at top)
      vec3 color = mix(uColorDark, uColorLight, vUv.y);
      
      // Starry sparkles based on world position so they stay fixed on the fabric
      float starVal = hash(floor(vWorldPosition.xy * 30.0) + floor(vWorldPosition.z * 30.0));
      if (starVal > 0.95) {
        float twinkle = sin(uTime * 3.0 + starVal * 100.0) * 0.5 + 0.5;
        float viewFactor = dot(normalize(vNormal), vec3(0.0, 0.0, 1.0));
        color += vec3(0.9, 0.95, 1.0) * twinkle * max(0.0, viewFactor) * 2.0;
      }
      
      gl_FragColor = vec4(color, 1.0);
    }
  `
)
