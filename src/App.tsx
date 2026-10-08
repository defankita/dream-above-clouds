import { Canvas } from '@react-three/fiber'
import { Suspense, useRef } from 'react'
import { OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom, DepthOfField, Vignette, Noise } from '@react-three/postprocessing'
import * as THREE from 'three'
import { Clouds } from './components/Clouds'
import { Environment } from './components/Environment'
import { Castle } from './components/Castle'
import { Character } from './components/Character'
import { Fairies } from './components/Fairies'
import { Timeline } from './components/Timeline'

export default function App() {
  const playerPosRef = useRef(new THREE.Vector3(0, 0, 0))
  const camPosRef = useRef(new THREE.Vector3(0, 15, 30))
  const characterStateRef = useRef('idle')
  const fairyStateRef = useRef('idle')
  const basketRef = useRef(false)

  return (
    <Canvas
      shadows
      camera={{ position: [0, 2, 10], fov: 45, near: 0.1, far: 1000 }}
      gl={{ antialias: false, powerPreference: 'high-performance' }}
    >
      <color attach="background" args={['#050510']} />
      <Suspense fallback={null}>
        <Environment />
        <Clouds playerPosRef={playerPosRef} />
        <Castle />
        <Fairies count={5} playerPosRef={playerPosRef} fairyStateRef={fairyStateRef} />
        <Character playerPosRef={playerPosRef} characterStateRef={characterStateRef} basketRef={basketRef} />
        
        <Timeline 
          playerPosRef={playerPosRef} 
          camPosRef={camPosRef} 
          characterStateRef={characterStateRef} 
          fairyStateRef={fairyStateRef}
          basketRef={basketRef}
        />
        
        <OrbitControls target={[0, 0, 0]} maxPolarAngle={Math.PI / 2 - 0.05} enabled={false} />
      </Suspense>
      
      <EffectComposer disableNormalPass>
        <DepthOfField focusDistance={0.02} focalLength={0.1} bokehScale={2} height={480} />
        <Bloom luminanceThreshold={0.5} luminanceSmoothing={0.9} height={300} intensity={1.5} />
        <Noise opacity={0.03} />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>
    </Canvas>
  )
}
