import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'

export function Fairies({ 
  count = 5,
  playerPosRef,
  fairyStateRef 
}: { 
  count?: number, 
  playerPosRef?: React.MutableRefObject<THREE.Vector3>,
  fairyStateRef?: React.MutableRefObject<string>
}) {
  // Meshes
  const bodyRef = useRef<THREE.InstancedMesh>(null)
  const headRef = useRef<THREE.InstancedMesh>(null)
  const dressRef = useRef<THREE.InstancedMesh>(null)
  const hairRef = useRef<THREE.InstancedMesh>(null)
  const wingsRef = useRef<THREE.InstancedMesh>(null)
  
  const wingTexture = useTexture('/fairy.jpg')
  
  const bodyMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#ffe0d0', // skin tone
    roughness: 0.4,
  }), [])
  
  const dressMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#aaddff', // ethereal blue dress
    roughness: 0.2,
    emissive: '#55aaff',
    emissiveIntensity: 0.5,
  }), [])

  const hairMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#ddbb88', // blonde straight hair
    roughness: 0.8,
  }), [])
  
  const wingMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: wingTexture }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec4 worldPos = instanceMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform sampler2D uTexture;
        varying vec2 vUv;
        void main() {
          vec4 color = texture2D(uTexture, vUv);
          float luma = dot(color.rgb, vec3(0.299, 0.587, 0.114));
          if (luma < 0.1) discard;
          gl_FragColor = vec4(color.rgb * 2.0, 1.0);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide
    })
  }, [wingTexture])
  
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const dummyWingLeft = useMemo(() => new THREE.Object3D(), [])
  const dummyWingRight = useMemo(() => new THREE.Object3D(), [])
  
  const fairiesData = useMemo(() => {
    return Array.from({ length: count }, () => ({
      offset: new THREE.Vector3(
        (Math.random() - 0.5) * 60,
        Math.random() * 10 + 2,
        (Math.random() - 0.5) * 60 - 40
      ),
      speed: Math.random() * 0.8 + 0.4,
      radius: Math.random() * 5 + 2,
      phase: Math.random() * Math.PI * 2
    }))
  }, [count])

  useFrame((state) => {
    if (!bodyRef.current || !wingsRef.current || !headRef.current || !dressRef.current || !hairRef.current) return
    
    const time = state.clock.elapsedTime
    const isBlessing = fairyStateRef?.current === 'blessing'
    
    fairiesData.forEach((data, i) => {
      let speedMult = isBlessing ? 4.0 : 1.0;
      
      let x = data.offset.x + Math.sin(time * data.speed * speedMult + data.phase) * data.radius
      let z = data.offset.z + Math.cos(time * data.speed * speedMult + data.phase) * data.radius
      let y = data.offset.y + Math.sin(time * data.speed * 2.0 * speedMult + data.phase) * 1.5
      
      if (playerPosRef && playerPosRef.current && i < count * 0.8) {
        const pPos = playerPosRef.current
        const dist = pPos.distanceTo(new THREE.Vector3(x, y, z))
        if (dist < 30 || isBlessing) {
          // If blessing, cluster extremely close (radius 1.0) around basket area (+0.5 on X)
          const targetRad = isBlessing ? 1.5 : 4
          const targetX = isBlessing ? pPos.x + 0.5 : pPos.x;
          const targetY = isBlessing ? pPos.y + 1.0 : pPos.y + 4.0; // Swoop down to basket height
          
          x = THREE.MathUtils.lerp(x, targetX + Math.sin(time * 3 * speedMult + i) * targetRad, 0.05)
          z = THREE.MathUtils.lerp(z, pPos.z + Math.cos(time * 3 * speedMult + i) * targetRad, 0.05)
          y = THREE.MathUtils.lerp(y, targetY + Math.sin(time * 5 * speedMult + i) * 1.0, 0.05)
        }
      }
      
      const rotY = Math.atan2(Math.cos(time * data.speed * speedMult + data.phase), -Math.sin(time * data.speed * speedMult + data.phase))
      
      let scale = 0.5 + Math.sin(time * 5 + i) * 0.1
      if (isBlessing) scale *= 1.2; // Don't scale up too much so they don't clip
      
      // Body (Capsule)
      dummy.position.set(x, y, z)
      dummy.rotation.set(0.2, rotY, 0)
      dummy.scale.set(scale, scale, scale)
      dummy.updateMatrix()
      bodyRef.current!.setMatrixAt(i, dummy.matrix)
      
      // Dress (Cone)
      dummy.position.set(x, y - scale * 0.1, z)
      dummy.rotation.set(0.2, rotY, 0)
      dummy.scale.set(scale, scale, scale)
      dummy.updateMatrix()
      dressRef.current!.setMatrixAt(i, dummy.matrix)

      // Head (Sphere)
      dummy.position.set(x, y + scale * 0.8, z + scale * 0.1)
      dummy.rotation.set(0, rotY, 0)
      dummy.scale.set(scale * 0.35, scale * 0.35, scale * 0.35)
      dummy.updateMatrix()
      headRef.current!.setMatrixAt(i, dummy.matrix)
      
      // Hair (Capsule dropping behind head for straight hair)
      dummy.position.set(x, y + scale * 0.6, z - scale * 0.1)
      dummy.rotation.set(-0.2, rotY, 0)
      dummy.scale.set(scale * 0.4, scale * 0.8, scale * 0.4)
      dummy.updateMatrix()
      hairRef.current!.setMatrixAt(i, dummy.matrix)
      
      // Wings
      const flap = Math.abs(Math.sin(time * 20 * speedMult + i)) * Math.PI * 0.3
      
      // Left Wing
      dummyWingLeft.position.set(x - scale * 0.2, y + scale * 0.3, z - scale * 0.2)
      dummyWingLeft.rotation.set(0, rotY, flap)
      dummyWingLeft.scale.set(scale * 1.5, scale * 1.5, scale * 1.5)
      dummyWingLeft.updateMatrix()
      wingsRef.current!.setMatrixAt(i * 2, dummyWingLeft.matrix)
      
      // Right Wing
      dummyWingRight.position.set(x + scale * 0.2, y + scale * 0.3, z - scale * 0.2)
      dummyWingRight.rotation.set(0, rotY, -flap)
      dummyWingRight.scale.set(scale * 1.5, scale * 1.5, scale * 1.5)
      dummyWingRight.updateMatrix()
      wingsRef.current!.setMatrixAt(i * 2 + 1, dummyWingRight.matrix)
    })
    
    bodyRef.current.instanceMatrix.needsUpdate = true
    headRef.current.instanceMatrix.needsUpdate = true
    dressRef.current.instanceMatrix.needsUpdate = true
    hairRef.current.instanceMatrix.needsUpdate = true
    wingsRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <group>
      {/* Tiny skin body so arms/legs peek out */}
      <instancedMesh ref={bodyRef} args={[undefined, undefined, count]} castShadow>
        <capsuleGeometry args={[0.15, 0.6, 8, 8]} />
        <primitive object={bodyMaterial} />
      </instancedMesh>
      
      <instancedMesh ref={dressRef} args={[undefined, undefined, count]} castShadow>
        <coneGeometry args={[0.35, 0.7, 16]} />
        <primitive object={dressMaterial} />
      </instancedMesh>
      
      <instancedMesh ref={headRef} args={[undefined, undefined, count]} castShadow>
        <sphereGeometry args={[1, 16, 16]} />
        <primitive object={bodyMaterial} />
      </instancedMesh>
      
      <instancedMesh ref={hairRef} args={[undefined, undefined, count]} castShadow>
        <capsuleGeometry args={[1, 1, 8, 8]} />
        <primitive object={hairMaterial} />
      </instancedMesh>
      
      {/* Multiply count by 2 since we render 2 wings per fairy */}
      <instancedMesh ref={wingsRef} args={[undefined, undefined, count * 2]}>
        <planeGeometry args={[1.5, 1.5]} />
        <primitive object={wingMaterial} />
      </instancedMesh>
      
      {/* Light emitted during blessing */}
      {fairyStateRef?.current === 'blessing' && playerPosRef?.current && (
        <pointLight position={[playerPosRef.current.x, playerPosRef.current.y + 1, playerPosRef.current.z]} intensity={2.0} distance={10} color="#ffddaa" />
      )}
    </group>
  )
}
