import { useRef, useMemo } from 'react'
import { useFrame, extend } from '@react-three/fiber'
import * as THREE from 'three'
import { DressMaterial } from '../shaders/DressMaterial'

extend({ DressMaterial })

export function Character({ 
  playerPosRef,
  characterStateRef,
  basketRef
}: { 
  playerPosRef: React.MutableRefObject<THREE.Vector3>,
  characterStateRef: React.MutableRefObject<string>,
  basketRef: React.MutableRefObject<boolean>
}) {
  const group = useRef<THREE.Group>(null)
  
  // Hierarchical references
  const head = useRef<THREE.Group>(null)
  const leftArm = useRef<THREE.Group>(null)
  const rightArm = useRef<THREE.Group>(null)
  const leftLeg = useRef<THREE.Group>(null)
  const rightLeg = useRef<THREE.Group>(null)
  const dressMatRef = useRef<any>(null)
  const bodiceMatRef = useRef<any>(null)
  const basketGroupRef = useRef<THREE.Group>(null)
  
  // Materials
  const skinMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#d29b7a', // warmer, realistic skin tone blending reference image
    roughness: 0.4,
  }), [])
  
  const hairMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#1a1012', // deep dark brunette
    roughness: 0.7,
  }), [])

  // Create curly hair volume using many spheres
  const hairSpheres = useMemo(() => {
    const spheres = [];
    for(let i=0; i<30; i++) {
      spheres.push({
        x: (Math.random() - 0.5) * 0.9,
        y: (Math.random() - 0.2) * 1.0,
        z: (Math.random() - 0.5) * 0.5 - 0.3, // strictly pushed back, max z is -0.05
        scale: Math.random() * 0.2 + 0.15 // slightly smaller spheres
      });
    }
    return spheres;
  }, []);

  const timeRef = useRef(0)

  useFrame((state, delta) => {
    if (!group.current) return
    
    // Position
    group.current.position.x = THREE.MathUtils.lerp(group.current.position.x, playerPosRef.current.x, 0.1)
    group.current.position.z = THREE.MathUtils.lerp(group.current.position.z, playerPosRef.current.z, 0.1)
    
    // Look direction
    const velocity = playerPosRef.current.clone().setY(0).sub(group.current.position.clone().setY(0))
    if (velocity.length() > 0.01) {
      const targetRotation = Math.atan2(velocity.x, velocity.z)
      const currentRotation = group.current.rotation.y
      
      // Handle shortest path rotation
      let diff = targetRotation - currentRotation;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      group.current.rotation.y += diff * 0.1;
    }

    const currentState = characterStateRef.current
    
    if (currentState === 'walk') {
      timeRef.current += delta * 6.0
      const t = timeRef.current
      
      if (leftLeg.current && rightLeg.current) {
        leftLeg.current.rotation.x = Math.sin(t) * 0.6
        rightLeg.current.rotation.x = Math.sin(t + Math.PI) * 0.6
      }
      if (leftArm.current && rightArm.current) {
        leftArm.current.rotation.x = Math.sin(t + Math.PI) * 0.4
        leftArm.current.rotation.z = 0.3
        
        rightArm.current.rotation.x = basketRef?.current ? -0.2 + Math.sin(t) * 0.1 : Math.sin(t) * 0.4
        rightArm.current.rotation.z = basketRef?.current ? -0.4 : -0.3
      }
      
      group.current.position.y = -0.2 + playerPosRef.current.y + Math.abs(Math.sin(t * 2)) * 0.15
      
    } else { // idle
      timeRef.current += delta * 1.0
      const t = timeRef.current
      
      if (leftLeg.current && rightLeg.current) {
        leftLeg.current.rotation.x = THREE.MathUtils.lerp(leftLeg.current.rotation.x, 0, 0.1)
        rightLeg.current.rotation.x = THREE.MathUtils.lerp(rightLeg.current.rotation.x, 0, 0.1)
      }
      if (leftArm.current && rightArm.current) {
        leftArm.current.rotation.x = THREE.MathUtils.lerp(leftArm.current.rotation.x, Math.sin(t) * 0.05, 0.1)
        leftArm.current.rotation.z = THREE.MathUtils.lerp(leftArm.current.rotation.z, 0.3, 0.1)
        
        rightArm.current.rotation.x = THREE.MathUtils.lerp(rightArm.current.rotation.x, basketRef?.current ? -0.2 : Math.sin(t+Math.PI)*0.05, 0.1)
        rightArm.current.rotation.z = THREE.MathUtils.lerp(rightArm.current.rotation.z, basketRef?.current ? -0.4 : -0.3, 0.1)
      }
      
      group.current.position.y = -0.2 + playerPosRef.current.y + Math.sin(t) * 0.05
    }
    
    // Update Shaders
    if (dressMatRef.current) dressMatRef.current.uTime = state.clock.elapsedTime;
    if (bodiceMatRef.current) bodiceMatRef.current.uTime = state.clock.elapsedTime;
    
    // Basket Visibility
    if (basketGroupRef.current) {
      const targetScale = basketRef?.current ? 1 : 0;
      basketGroupRef.current.scale.setScalar(THREE.MathUtils.lerp(basketGroupRef.current.scale.x, targetScale, 0.2))
    }
  })

  return (
    <group ref={group}>
      {/* Torso Bodice */}
      <mesh position={[0, 3.5, 0]} castShadow>
        <capsuleGeometry args={[0.26, 1.0, 16, 16]} />
        {/* @ts-ignore */}
        <dressMaterial ref={bodiceMatRef} />
      </mesh>
      
      {/* Deep Blue Starry Dress */}
      <mesh position={[0, 2.0, 0]} castShadow receiveShadow>
        {/* Large flared skirt */}
        <coneGeometry args={[1.8, 3.5, 32, 1, true]} />
        {/* @ts-ignore */}
        <dressMaterial ref={dressMatRef} side={THREE.DoubleSide} />
      </mesh>

      {/* Head & Hair */}
      <group position={[0, 4.5, 0]} ref={head}>
        {/* Beautiful Face */}
        <group position={[0, 0, 0.1]}>
          <mesh castShadow>
            <sphereGeometry args={[0.28, 32, 32]} />
            <primitive object={skinMaterial} />
          </mesh>
          {/* Eyes (dark brown/black) */}
          <mesh position={[-0.1, 0.04, 0.26]}>
            <sphereGeometry args={[0.035, 16, 16]} />
            <meshBasicMaterial color="#110a08" />
          </mesh>
          <mesh position={[0.1, 0.04, 0.26]}>
            <sphereGeometry args={[0.035, 16, 16]} />
            <meshBasicMaterial color="#110a08" />
          </mesh>
          {/* Lips (soft pink) */}
          <mesh position={[0, -0.08, 0.27]} rotation={[0, 0, 0]} scale={[1, 0.4, 0.5]}>
            <sphereGeometry args={[0.06, 16, 16]} />
            <meshStandardMaterial color="#c25f5a" roughness={0.4} />
          </mesh>
        </group>
        
        {/* Voluminous Curly Hair Mass */}
        <group position={[0, 0.1, -0.1]}>
          {hairSpheres.map((s, i) => (
            <mesh key={i} castShadow position={[s.x, s.y, s.z]} scale={s.scale}>
              <sphereGeometry args={[1, 16, 16]} />
              <primitive object={hairMaterial} />
            </mesh>
          ))}
          {/* Crown jewel/tiara hint */}
          <mesh position={[0, 0.35, 0.2]}>
            <coneGeometry args={[0.05, 0.15, 8]} />
            <meshStandardMaterial color="#aaddff" emissive="#55aaff" emissiveIntensity={2.0} />
          </mesh>
        </group>
      </group>

      {/* Arms */}
      <group position={[-0.35, 4.0, 0]}>
        <group ref={leftArm}>
          {/* Skin arm */}
          <mesh position={[0, -0.6, 0]} castShadow>
            <capsuleGeometry args={[0.06, 1.2, 8, 8]} />
            <primitive object={skinMaterial} />
          </mesh>
        </group>
      </group>
      <group position={[0.35, 4.0, 0]}>
        <group ref={rightArm}>
          {/* Skin arm */}
          <mesh position={[0, -0.6, 0]} castShadow>
            <capsuleGeometry args={[0.06, 1.2, 8, 8]} />
            <primitive object={skinMaterial} />
          </mesh>
          
          {/* Basket of Gifts (Toggled by ref) */}
          <group position={[0, -1.2, 0.3]} rotation={[0.2, 0, 0]} ref={basketGroupRef} scale={0}>
            {/* Basket Base */}
            <mesh castShadow>
              <cylinderGeometry args={[0.4, 0.3, 0.4, 16]} />
              <meshStandardMaterial color="#8B4513" roughness={0.9} />
            </mesh>
            {/* Handle */}
            <mesh position={[0, 0.3, 0]}>
              <torusGeometry args={[0.4, 0.05, 8, 16, Math.PI]} />
              <meshStandardMaterial color="#8B4513" roughness={0.9} />
            </mesh>
            {/* Glowing Gifts */}
            <mesh position={[-0.1, 0.2, -0.1]}>
              <boxGeometry args={[0.2, 0.2, 0.2]} />
              <meshStandardMaterial color="#ffffff" emissive="#55aaff" emissiveIntensity={2.0} />
            </mesh>
            <mesh position={[0.15, 0.15, 0.1]}>
              <boxGeometry args={[0.15, 0.15, 0.15]} />
              <meshStandardMaterial color="#ffffff" emissive="#ffaaee" emissiveIntensity={2.0} />
            </mesh>
            <mesh position={[-0.05, 0.15, 0.15]}>
              <sphereGeometry args={[0.1, 8, 8]} />
              <meshStandardMaterial color="#ffffff" emissive="#ffff88" emissiveIntensity={2.0} />
            </mesh>
            <pointLight position={[0, 0.5, 0]} intensity={2.0} distance={5} color="#ffddff" />
          </group>
        </group>
      </group>

      {/* Legs (Hidden under dress but needed for walk cycle motion if visible at bottom) */}
      <group position={[-0.15, 2.5, 0]}>
        <group ref={leftLeg}>
          <mesh position={[0, -1.2, 0]} castShadow>
            <capsuleGeometry args={[0.08, 2.4, 8, 8]} />
            <primitive object={skinMaterial} />
          </mesh>
        </group>
      </group>
      <group position={[0.15, 2.5, 0]}>
        <group ref={rightLeg}>
          <mesh position={[0, -1.2, 0]} castShadow>
            <capsuleGeometry args={[0.08, 2.4, 8, 8]} />
            <primitive object={skinMaterial} />
          </mesh>
        </group>
      </group>
    </group>
  )
}
