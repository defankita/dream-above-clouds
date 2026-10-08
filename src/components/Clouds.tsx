import { extend, useFrame } from '@react-three/fiber'
import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { CloudMaterial } from '../shaders/CloudMaterial'

extend({ CloudMaterial })

export function Clouds({ playerPosRef }: { playerPosRef: React.MutableRefObject<THREE.Vector3> }) {
  const materialRef = useRef<any>(null)
  const instancedRef = useRef<THREE.InstancedMesh>(null)

  // Billowy Cloud Volumes (Background & Edges)
  const cloudCount = 400; // Reduced for performance
  const cloudData = useMemo(() => {
    const data = []
    for (let i = 0; i < cloudCount; i++) {
      // Distribute clouds around the edges, leaving a path in the middle (x approx 0)
      let x = (Math.random() - 0.5) * 400
      let z = (Math.random() * 400) - 300 // from z=100 to z=-300
      
      // Clear a path in the middle for the character
      if (Math.abs(x) < 20) {
        x += Math.sign(x || 1) * 20
      }
      
      let y = (Math.random() * 15) - 5
      
      // Scale varies
      let scale = Math.random() * 10 + 5
      
      // Distant clouds are huge
      if (Math.abs(x) > 100 || z < -150) {
        y += Math.random() * 20
        scale *= 3
      }

      data.push({ position: new THREE.Vector3(x, y, z), scale })
    }
    return data
  }, [cloudCount])

  const billowMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#ffffff',
    roughness: 1.0,
    metalness: 0.0,
    // disabled transparent to avoid clipping/sorting bugs
  }), [])

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uTime = state.clock.elapsedTime
      if (playerPosRef.current) {
        materialRef.current.uPlayerPos.copy(playerPosRef.current)
      }
    }
    
    // Animate billowy clouds slowly
    if (instancedRef.current) {
      const time = state.clock.elapsedTime * 0.1
      const dummy = new THREE.Object3D()
      cloudData.forEach((data, i) => {
        dummy.position.copy(data.position)
        dummy.position.y += Math.sin(time + i) * 2.0 // slow bobbing
        dummy.position.x += Math.cos(time + i) * 1.0
        
        const s = data.scale + Math.sin(time * 2 + i) * 1.0
        dummy.scale.set(s, s * 0.8, s)
        dummy.rotation.y = time * 0.2 + i
        
        dummy.updateMatrix()
        instancedRef.current!.setMatrixAt(i, dummy.matrix)
      })
      instancedRef.current.instanceMatrix.needsUpdate = true
    }
  })

  return (
    <group>
      {/* Base Cloud Path (Interactive) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 1.0, -100]} receiveShadow>
        <planeGeometry args={[1000, 1000, 512, 512]} />
        {/* @ts-ignore */}
        <cloudMaterial ref={materialRef} transparent depthWrite={true} uColor={new THREE.Color('#ffffff')} uHighlight={new THREE.Color('#ffffff')} uShadow={new THREE.Color('#dddddd')} />
      </mesh>
    </group>
  )
}
