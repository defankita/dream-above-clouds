import { extend, useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { SkyMaterial } from '../shaders/SkyMaterial'
import { Stars } from '@react-three/drei'

extend({ SkyMaterial })

export function Environment() {
  const skyMaterialRef = useRef<any>(null)

  useFrame((state) => {
    if (skyMaterialRef.current) {
      skyMaterialRef.current.uTime = state.clock.elapsedTime
    }
  })

  return (
    <group>
      {/* Dynamic Sky */}
      <mesh scale={500}>
        <sphereGeometry args={[1, 64, 64]} />
        {/* @ts-ignore */}
        <skyMaterial ref={skyMaterialRef} side={THREE.BackSide} depthWrite={false} />
      </mesh>
      
      {/* Additional High-Quality Stars */}
      <Stars radius={300} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
      {/* Lighting */}
      <ambientLight intensity={0.5} color="#ffb6c1" />
      <directionalLight
        position={[50, 60, -100]}
        intensity={1.0}
        color="#ffffff"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={200}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
      />
      
      {/* Fill Light from Castle direction */}
      <pointLight position={[0, 15, -60]} intensity={1.5} color="#ff66aa" distance={200} decay={2} />
      
      {/* Front Fill for Character (Removed massive bright spot) */}
      <pointLight position={[0, 5, 10]} intensity={0.5} color="#ffccdd" distance={50} decay={2} />
    </group>
  )
}
