import { shaderMaterial } from '@react-three/drei'
import * as THREE from 'three'

export const SkyMaterial = shaderMaterial(
  {
    uTime: 0,
    uColorTop: new THREE.Color('#0f0b29'), // Deep starry night blue
    uColorBottom: new THREE.Color('#ffc1cc'), // Soft pink/lavender near clouds
    uMoonPos: new THREE.Vector3(50, 60, -100),
  },
  // vertex shader
  /* glsl */`
    varying vec3 vWorldPosition;
    varying vec2 vUv;
    void main() {
      vUv = uv;
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
  `,
  // fragment shader
  /* glsl */`
    uniform vec3 uColorTop;
    uniform vec3 uColorBottom;
    uniform vec3 uMoonPos;
    uniform float uTime;
    
    varying vec3 vWorldPosition;
    varying vec2 vUv;
    
    // Hash function for stars
    float hash(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }
    
    void main() {
      vec3 dir = normalize(vWorldPosition);
      
      // Sky gradient (more exponential to keep top dark)
      float h = smoothstep(0.0, 0.7, dir.y);
      vec3 skyColor = mix(uColorBottom, uColorTop, pow(h, 0.7));
      
      // Crescent Moon
      vec3 moonDir = normalize(uMoonPos);
      // Offset direction for the cut-out to create a crescent
      vec3 moonCutoutDir = normalize(uMoonPos + vec3(-8.0, 4.0, 0.0));
      
      float moonDist = distance(dir, moonDir);
      float cutoutDist = distance(dir, moonCutoutDir);
      
      // Moon glow
      float moonGlow = exp(-moonDist * 5.0) * 0.8;
      skyColor += vec3(1.0, 0.8, 0.9) * moonGlow;
      
      // Moon core (crescent shape)
      float moonCore = smoothstep(0.08, 0.07, moonDist);
      float cutout = smoothstep(0.07, 0.08, cutoutDist);
      
      float crescent = moonCore * cutout;
      skyColor = mix(skyColor, vec3(1.0, 0.95, 0.9), crescent * 1.5);
      
      // Basic stars (higher density, different sizes)
      float starVal = hash(dir.xy * 250.0);
      if (starVal > 0.985) {
        float twinkle = sin(uTime * 1.5 + starVal * 100.0) * 0.5 + 0.5;
        skyColor += vec3(1.0, 0.9, 1.0) * twinkle * (starVal - 0.985) * 150.0;
      }
      
      gl_FragColor = vec4(skyColor, 1.0);
    }
  `
)
