import { useThree, useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import gsap from 'gsap'

export function Timeline({ 
  playerPosRef, 
  camPosRef, 
  characterStateRef,
  fairyStateRef,
  basketRef
}: { 
  playerPosRef: React.MutableRefObject<THREE.Vector3>,
  camPosRef: React.MutableRefObject<THREE.Vector3>,
  characterStateRef: React.MutableRefObject<string>,
  fairyStateRef: React.MutableRefObject<string>,
  basketRef: React.MutableRefObject<boolean>
}) {
  const { camera } = useThree()
  const lookAtRef = useRef(new THREE.Vector3(0, 2, 0))

  useEffect(() => {
    // Initial Setup
    playerPosRef.current.set(0, -0.2, 0)
    camPosRef.current.set(0, 15, 30)
    lookAtRef.current.set(0, 2, 0)
    characterStateRef.current = 'idle'
    fairyStateRef.current = 'idle'
    basketRef.current = false // No basket initially
    
    camera.position.copy(camPosRef.current)
    camera.lookAt(lookAtRef.current)

    // Master Timeline (30 seconds total)
    const tl = gsap.timeline()
    
    // 0-6s: Walk gracefully to Castle Stairs (z = -30)
    tl.call(() => { characterStateRef.current = 'walk' }, [], 0)
    tl.to(playerPosRef.current, { z: -30, duration: 6, ease: "power1.inOut" }, 0)
    tl.to(camPosRef.current, { z: 10, y: 15, duration: 6, ease: "power1.inOut" }, 0)
    tl.to(lookAtRef.current, { z: -30, y: 5, duration: 6, ease: "power1.inOut" }, 0) // Look slightly up

    // 6-10s: Climb stairs to the door (z = -50, y = 8)
    tl.to(playerPosRef.current, { z: -50, y: 8, duration: 4, ease: "linear" }, 6)
    tl.to(camPosRef.current, { z: -10, y: 20, duration: 4, ease: "power1.inOut" }, 6)
    tl.to(lookAtRef.current, { z: -50, y: 15, duration: 4, ease: "power1.inOut" }, 6)

    // 10-14s: Enter Castle, wait inside, Camera pans up to Castle Spire
    tl.call(() => { characterStateRef.current = 'idle' }, [], 10)
    tl.to(playerPosRef.current, { z: -55, duration: 1 }, 10) // Step fully inside
    tl.to(camPosRef.current, { y: 35, z: 0, duration: 4, ease: "power2.inOut" }, 10)
    tl.to(lookAtRef.current, { z: -60, y: 40, duration: 4, ease: "power2.inOut" }, 10) // Look high at spire

    // 14s: Reappear with gifts at door
    tl.call(() => { 
      playerPosRef.current.z = -50; 
      basketRef.current = true; // Show basket with gifts
      characterStateRef.current = 'walk' 
    }, [], 14)
    
    // 14-17s: Walk down stairs
    tl.to(playerPosRef.current, { z: -30, y: 0, duration: 3, ease: "linear" }, 14)
    tl.to(camPosRef.current, { y: 15, z: 10, duration: 3, ease: "power1.inOut" }, 14)
    tl.to(lookAtRef.current, { z: -30, y: 5, duration: 3, ease: "power1.inOut" }, 14)

    // 17-21s: Walk back to Fairies gracefully
    tl.to(playerPosRef.current, { z: -10, duration: 4, ease: "power1.inOut" }, 17)
    tl.to(camPosRef.current, { y: 10, z: 20, duration: 4, ease: "power1.inOut" }, 17)
    tl.to(lookAtRef.current, { z: -10, y: 2, duration: 4, ease: "power1.inOut" }, 17)

    // 21-23s: Stop to give gifts
    tl.call(() => { characterStateRef.current = 'idle' }, [], 21)
    tl.to(camPosRef.current, { x: 15, z: 0, duration: 2, ease: "power1.inOut" }, 21)

    // 23-26s: Fairies get happy & give blessings
    tl.call(() => { fairyStateRef.current = 'blessing' }, [], 23)
    tl.to(camPosRef.current, { x: -15, y: 5, duration: 3, ease: "power1.inOut" }, 23)

    // 26-30s: Ending wide shot (Show full scene)
    tl.to(camPosRef.current, { x: 0, y: 30, z: 50, duration: 4, ease: "power2.inOut" }, 26)
    tl.to(lookAtRef.current, { z: -40, y: 20, duration: 4, ease: "power2.inOut" }, 26)

    return () => {
      tl.kill()
    }
  }, [camera, playerPosRef, camPosRef, characterStateRef, fairyStateRef, basketRef])

  // Continuous Camera LookAt
  useFrame(() => {
    camera.position.lerp(camPosRef.current, 0.05)
    camera.lookAt(lookAtRef.current)
  })

  return null
}
