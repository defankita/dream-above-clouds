import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

export function Castle({ position = [0, 0, -60] }: { position?: [number, number, number] }) {
  const castleRef = useRef<THREE.Group>(null)
  
  // Magical bright pink/magenta materials
  const wallMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#ff77aa',
    roughness: 0.6,
    metalness: 0.1,
  }), [])

  const roofMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#ff4488',
    roughness: 0.7,
    metalness: 0.3,
  }), [])

  const windowMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#ffffff',
    emissive: '#ffdd77', // Warm golden glow for windows
    emissiveIntensity: 3.0,
    toneMapped: false,
  }), [])

  useFrame((state) => {
    if (castleRef.current) {
      // Subtle magical hovering
      castleRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.4) * 2.0
    }
  })

  const createTower = (x: number, z: number, height: number, radius: number, isMain: boolean = false) => (
    <group position={[x, 0, z]}>
      {/* Base */}
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow material={wallMaterial}>
        <cylinderGeometry args={[radius, radius + 1, height, 16]} />
      </mesh>
      {/* Roof */}
      <mesh position={[0, height + radius * 1.5, 0]} castShadow material={roofMaterial}>
        <coneGeometry args={[radius + 0.5, radius * 3, 16]} />
      </mesh>
      {/* Mini spires on roof */}
      {isMain && [0, 1, 2, 3].map(i => {
        const angle = (i / 4) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(angle) * radius * 0.8, height + 1, Math.sin(angle) * radius * 0.8]} material={roofMaterial}>
            <coneGeometry args={[0.5, 4, 8]} />
          </mesh>
        )
      })}
      {/* Windows */}
      <mesh position={[0, height * 0.7, radius * 0.9]} material={windowMaterial}>
        <boxGeometry args={[radius * 0.4, radius * 0.8, radius * 0.4]} />
      </mesh>
    </group>
  );

  // Generate stairs from cloud level (y=1) up to the door (y=8)
  const stairCount = 10;
  const stairs = Array.from({ length: stairCount }).map((_, i) => {
    // Door front is at z=14, y=8. Clouds are at y=1. 
    // Stairs go from z=14 out to z=28.
    const stairY = 1 + (i / stairCount) * 7;
    const stairZ = 28 - (i / stairCount) * 14;
    return (
      <mesh key={`stair-${i}`} position={[0, stairY, stairZ]} receiveShadow castShadow material={wallMaterial}>
        <boxGeometry args={[12, 1, 3]} />
      </mesh>
    );
  });

  return (
    <group position={position} ref={castleRef}>
      {/* Main Central Palace Building */}
      <mesh position={[0, 15, 0]} castShadow receiveShadow material={wallMaterial}>
        <boxGeometry args={[30, 30, 20]} />
      </mesh>
      
      {/* Main Roofs */}
      <mesh position={[-8, 35, 0]} material={roofMaterial}>
        <coneGeometry args={[8, 15, 4]} />
      </mesh>
      <mesh position={[8, 35, 0]} material={roofMaterial}>
        <coneGeometry args={[8, 15, 4]} />
      </mesh>

      {/* Main Entrance (Centered full cylinder pushed into the wall) */}
      <mesh position={[0, 8, 8]} material={windowMaterial} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[6, 6, 16, 32]} />
      </mesh>
      
      {/* Stairs */}
      {stairs}

      {/* Clock Face (Glowing ring) */}
      <mesh position={[0, 22, 10.5]} material={windowMaterial}>
        <torusGeometry args={[3, 0.5, 16, 32]} />
      </mesh>

      {/* Intricate Towers */}
      {createTower(0, -5, 45, 6, true)} {/* Giant Central Spire */}
      {createTower(-15, 5, 30, 4)}
      {createTower(15, 5, 30, 4)}
      {createTower(-22, -2, 20, 3)}
      {createTower(22, -2, 20, 3)}
      {createTower(-10, 15, 25, 3)}
      {createTower(10, 15, 25, 3)}
      
      {/* Solid Rectangular Foundation */}
      <mesh position={[0, -5, 0]} material={wallMaterial} castShadow receiveShadow>
        <boxGeometry args={[35, 10, 25]} />
      </mesh>
      
      {/* Massive Volumetric God Ray / Bloom Source behind castle */}
      <mesh position={[0, 30, -10]} material={windowMaterial}>
        <sphereGeometry args={[10, 16, 16]} />
      </mesh>
    </group>
  )
}
