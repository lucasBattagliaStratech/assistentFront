import React, { Suspense, useEffect, /*useRef,*/ useState, useMemo, useRef } from 'react'
import { Canvas, useFrame, useLoader, extend, useThree } from '@react-three/fiber'
import { useTexture, Loader, Environment, useFBX, useAnimations, useVideoTexture } from '@react-three/drei'
import { MeshStandardMaterial } from 'three/src/materials/MeshStandardMaterial'
import { OrbitControls } from '@react-three/drei'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

import { LineBasicMaterial, MeshPhysicalMaterial, Vector2, PlaneGeometry } from 'three'
import ReactAudioPlayer from 'react-audio-player'

import createAnimation from './converter2'
import blinkData from './blendDataBlink.json'
import {
  AnimationClip,
  NumberKeyframeTrack,
} from 'three';
import * as THREE from 'three'
import axios from 'axios'

import { LinearEncoding, sRGBEncoding } from '@react-three/drei/helpers/deprecated'

import avatar from "./pizzas.glb"

// import avatar from "./model.glb"

const isModelDefault = false

const _ = require('lodash')

const host = 'http://localhost:5000'
// const host = 'https://8c98ad1bb948e7.lhr.life'
const path = 'http://localhost:3000'
// const path = 'https://3f6c-2-40-82-43.ngrok-free.app'

let threadId = undefined

extend({ PlaneGeometry })

function Avatar({ speak, setSpeak, setAudioSource, playing, audio }) {
  let gltf = useLoader(GLTFLoader, avatar)

  let morphTargetDictionaryBody = null
  let morphTargetDictionaryLowerTeeth = null

  const [
    bodyTexture,

    eyesTexture,

    teethTexture,

    // bodySpecularTexture,
    bodyRoughnessTexture,
    bodyNormalTexture,

    teethNormalTexture,
    // teethSpecularTexture,
    hairTexture,

    tshirtDiffuseTexture,
    tshirtNormalTexture,
    tshirtRoughnessTexture,

    hairAlphaTexture,
    hairNormalTexture,
    hairRoughnessTexture,
  ] = useTexture([
    "/images/body.webp",

    "/images/eyes.webp",

    "/images/teeth_diffuse.webp",

    // "/images/body_specular.webp",
    "/images/body_roughness.webp",
    "/images/body_normal.webp",

    "/images/teeth_normal.webp",
    // "/images/teeth_specular.webp",
    "/images/h_color.webp",

    "/images/tshirt_diffuse.webp",
    "/images/tshirt_normal.webp",
    "/images/tshirt_roughness.webp",

    "/images/h_alpha.webp",
    "/images/h_normal.webp",
    "/images/h_roughness.webp",
  ])

  _.each([
    bodyTexture,
    eyesTexture,
    teethTexture,
    // teethSpecularTexture,
    teethNormalTexture,
    // bodySpecularTexture,
    bodyRoughnessTexture,
    bodyNormalTexture,
    tshirtDiffuseTexture,
    tshirtNormalTexture,
    tshirtRoughnessTexture,
    hairAlphaTexture,
    hairNormalTexture,
    hairRoughnessTexture
  ], t => {
    t.encoding = sRGBEncoding
    t.flipY = false
  })

  bodyNormalTexture.encoding = LinearEncoding
  tshirtNormalTexture.encoding = LinearEncoding
  teethNormalTexture.encoding = LinearEncoding
  hairNormalTexture.encoding = LinearEncoding

  gltf.scene.traverse(node => {
    if (node.type === 'Mesh' || node.type === 'LineSegments' || node.type === 'SkinnedMesh') {
      node.castShadow = true
      node.receiveShadow = true
      node.frustumCulled = false

      if (node.name.includes(isModelDefault ? "Body" : "Head")) morphTargetDictionaryBody = node.morphTargetDictionary;


      if (isModelDefault) {
        if (node.name.includes("Body")) {
          node.castShadow = true
          node.receiveShadow = true

          node.material = new MeshPhysicalMaterial()
          node.material.map = bodyTexture
          node.material.roughness = 1.7
          node.material.roughnessMap = bodyRoughnessTexture
          node.material.normalMap = bodyNormalTexture
          node.material.normalScale = new Vector2(0.6, 0.6)

          node.material.envMapIntensity = 0.8
        }

        if (node.name.includes("Eyes")) {
          node.material = new MeshStandardMaterial()
          node.material.map = eyesTexture
          node.material.roughness = 0.1
          node.material.envMapIntensity = 0.5
        }

        if (node.name.includes("Brows")) {
          node.material = new LineBasicMaterial({ color: 0x000000 })
          node.material.linewidth = 1
          node.material.opacity = 0.5
          node.material.transparent = true
          node.visible = false
        }

        if (node.name.includes("Teeth")) {
          node.receiveShadow = true
          node.castShadow = true
          node.material = new MeshStandardMaterial()
          node.material.roughness = 0.1
          node.material.map = teethTexture
          node.material.normalMap = teethNormalTexture
          node.material.envMapIntensity = 0.7
        }

        if (node.name.includes("Hair")) {
          node.material = new MeshStandardMaterial()
          node.material.map = hairTexture
          node.material.alphaMap = hairAlphaTexture
          node.material.normalMap = hairNormalTexture
          node.material.roughnessMap = hairRoughnessTexture
          node.material.transparent = true
          node.material.depthWrite = false
          node.material.side = 2
          node.material.color.setHex(0x000000)
          node.material.envMapIntensity = 0.3
        }

        if (node.name.includes("TSHIRT")) {
          node.material = new MeshStandardMaterial()
          node.material.map = tshirtDiffuseTexture
          node.material.roughnessMap = tshirtRoughnessTexture
          node.material.normalMap = tshirtNormalTexture
          node.material.color.setHex(0xffffff)
          node.material.envMapIntensity = 0.5
        }
      } else {
        if (node.name === 'Wolf3D_Outfit_Top') {
          node.material.map = null
          node.material.color.set(0x0040ff)
        }
      }

      if (node.name.includes(isModelDefault ? "TeethLower" : "Teeth")) {
        morphTargetDictionaryLowerTeeth = node.morphTargetDictionary
      }
    }
  })

  const [clips, setClips] = useState([])
  const mixer = useMemo(() => new THREE.AnimationMixer(gltf.scene), [])

  useEffect(() => {
    if (speak === false) return

    makeSpeech(threadId, audio)
      .then(response => {
        let { blendData, filename } = response.data
        threadId = response.data.threadId

        let newClips = [
          createAnimation(blendData, morphTargetDictionaryBody, isModelDefault ? 'HG_Body' : 'Wolf3D_Head'),
          createAnimation(blendData, morphTargetDictionaryLowerTeeth, isModelDefault ? 'HG_TeethLower' : 'Wolf3D_Teeth'),
          createAnimation(blendData, morphTargetDictionaryBody, 'EyeLeft'),
          createAnimation(blendData, morphTargetDictionaryLowerTeeth, 'EyeRight')
        ]

        filename = host + filename

        setClips(newClips)
        setAudioSource(filename)
      })
      .catch(err => {
        console.error(err)
      })
      .finally(() => setSpeak(false))

  }, [speak])

  let idleFbx = useFBX('/idle.fbx')
  let { clips: idleClips } = useAnimations(idleFbx.animations)

  idleClips[0].tracks = _.filter(idleClips[0].tracks, track => {
    return track.name.includes("Head") || track.name.includes("Neck") || track.name.includes("Spine2")
  })

  idleClips[0].tracks = _.map(idleClips[0].tracks, track => {
    // if (track.name.includes("Head")) {
    //   track.name = "head.quaternion"
    // }

    // if (track.name.includes("Neck")) {
    //   track.name = "neck.quaternion"
    // }

    // if (track.name.includes("Spine")) {
    //   track.name = "spine2.quaternion"
    // }

    return track
  })

  useEffect(() => {
    let idleClipAction = mixer.clipAction(idleClips[0])
    idleClipAction.play()

    // let blinkClip = createAnimation(blinkData, morphTargetDictionaryBody, 'HG_Body')
    // let blinkAction = mixer.clipAction(blinkClip)
    // blinkAction.play()
  }, [])

  useEffect(() => {
    if (playing === false) return

    _.each(clips, clip => {
      let clipAction = mixer.clipAction(clip)
      clipAction.setLoop(THREE.LoopOnce)
      clipAction.play()
    })

  }, [playing])

  useFrame((_state, delta) => {
    mixer.update(delta)
  })

  return <primitive position={[0, -1.7, 0]} object={gltf.scene} />
}

function makeSpeech(threadId, audio) {
  const formdata = new FormData()

  formdata.append('threadId', threadId)
  if (audio) formdata.append('audio', audio, 'audio-file.webm')

  return axios.post(host + '/talk', formdata, { headers: { 'Content-Type': 'multipart/form-data' } });
}

const STYLES = {
  area: { position: 'absolute', bottom: '10px', left: '10%', zIndex: 500 },
  text: { margin: '0px', width: '300px', padding: '5px', background: 'none', color: '#ffffff', fontSize: '1.2em', border: 'none' },
  speak: { padding: '10px', marginTop: '5px', display: 'block', color: '#FFFFFF', background: '#222222', border: 'None' },
  area2: { position: 'absolute', top: '5px', right: '15px', zIndex: 500 },
  label: { color: '#777777', fontSize: '0.5em' },
  checkbox: { marginLeft: '5px' }
}

function CameraController() {
  const { camera } = useThree();

  useEffect(() => {
    // camera.up = [0, 3, 0]
  }, [camera])
  setTimeout(() => {
    console.log(camera)
  }, 10000);

  return null;
}

const MyAvatar = () => {
  const [audioBlob, setAudioBlob] = useState('')
  const [speak, setSpeak] = useState(false)
  const [audioSource, setAudioSource] = useState('')
  const [playing, setPlaying] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isClicking, setIsClicking] = useState(false)


  return (
    <>
      <Canvas camera={{ position: [0, -.04, .5] }}>
        <CameraController />
        <ambientLight intensity={0.8} />
        <spotLight intensity={1.5} position={[10, 20, 10]} />
        <Suspense fallback={null}>
          <Environment
            background={false}
            files="/images/photo_studio_loft_hall_1k.hdr"
          />
        </Suspense>
        <Suspense fallback={null}>
          <Bg />
        </Suspense>
        <Suspense fallback={null}>
          <Avatar
            avatar_url={avatar}
            speak={speak}
            setSpeak={setSpeak}
            setAudioSource={setAudioSource}
            playing={playing}
            audio={audioBlob}
          />
          <OrbitControls position={[0, 1, 2]} />
          <Environment preset='sunset' />
        </Suspense>
      </Canvas>
      <Loader />
      <div style={STYLES.area}>
        <ColorToggleButton
          isRecording={isRecording}
          setIsClicking={setIsClicking}
        />
        <AudioRecorder
          setSpeak={setSpeak}
          setAudioBlob={setAudioBlob}
          isRecording={isRecording}
          setIsRecording={setIsRecording}
          isClicking={isClicking}
          setIsClicking={setIsClicking}
        />
      </div>
      <div style={STYLES.area2}>
        <ReactAudioPlayer
          src={audioSource}
          autoPlay
          onPlay={() => setPlaying(true)}
          onEnded={() => setPlaying(false)}
        />
      </div>
    </>
  )
}

const ColorToggleButton = ({ isRecording, setIsClicking }) => {
  const handleClick = () => {
    setIsClicking(isClicking => {
      return !isClicking
    })
  }

  return (
    // <button
    //   onClick={handleClick}
    //   style={{
    //     backgroundColor: isRecording ? 'red' : 'blue',
    //     color: 'white',
    //     borderRadius: '50%',
    //     width: '100px',
    //     height: '100px',
    //     border: 'none',
    //     fontSize: '16px',
    //     cursor: 'pointer',
    //     transition: 'background-color 0.5s ease',
    //   }}
    // >
    //   {isRecording ? 'Fermare' : 'Parlare'}
    // </button>
    <button
      onClick={handleClick}
      style={{
        backgroundColor: isRecording ? 'red' : 'blue',
        color: 'white',
        borderRadius: '2rem',
        // marginLeft: "100px",
        width: '170px',
        height: '100px',
        border: 'none',
        fontSize: '16px',
        cursor: 'pointer',
        transition: 'background-color 0.5s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative', // Necesario para posicionar el texto y la imagen
        padding: '0', // Elimina el padding para ajustar el contenido
      }}
    >
      <img
        src={'/microphone.png'}
        alt={isRecording ? 'Stop' : 'Start'}
        style={{ // Posiciona la imagen absolutamente dentro del botón
          width: '60px', // Ajusta el tamaño de la imagen
          height: '60px',
        }}
      />
      <span
        style={{
          color: 'black',
          fontWeight: "bold",
          fontSize: "25px",
          // zIndex: 1, // Asegura que el texto esté sobre la imagen
        }}
      >
        {isRecording ? 'Ferma' : 'Parla'}
      </span>
    </button>
  )
}

const AudioRecorder = (props) => {
  const { setAudioBlob, setSpeak } = props
  const { isRecording, setIsRecording } = props
  const { isClicking, setIsClicking } = props

  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' })

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setAudioBlob(audioBlob)

        audioChunksRef.current = []
        setSpeak(true)
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
    } catch (err) {
      console.error('Error accessing microphone:', err)
    }
  }

  const stopRecording = () => {
    mediaRecorderRef.current.stop()
    setIsRecording(false)
  }

  useEffect(() => {
    if (isClicking) {
      if (isRecording) {
        stopRecording()
      } else {
        startRecording()
      }
      setIsClicking(isClicking => !isClicking)
    }
  }, [isClicking])

  return <></>
}

function Bg() {
  // const texture = useTexture('/images/bg.webp')
  const texture = useVideoTexture('/prova.mp4')

  return (
    <mesh position={[0, 0, -0.5]} scale={[4, 4, 4]}>
      <planeGeometry />
      <meshBasicMaterial map={texture} />
    </mesh>
  )
}

export default MyAvatar