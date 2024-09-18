import React, { Suspense, useEffect, useState, useMemo, useRef } from 'react'
import { Canvas, useFrame, useLoader, extend } from '@react-three/fiber'
import { useTexture, Loader, Environment, useFBX, useAnimations, useVideoTexture } from '@react-three/drei'
import { MeshStandardMaterial } from 'three/src/materials/MeshStandardMaterial'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

import { LineBasicMaterial, MeshPhysicalMaterial, Vector2, PlaneGeometry } from 'three'
import ReactAudioPlayer from 'react-audio-player'

import createAnimation from './converter'

import * as THREE from 'three'
import axios from 'axios'

import { LinearEncoding, sRGBEncoding } from '@react-three/drei/helpers/deprecated'

import avatar from "./avatar.glb"

const isModelDefault = false

const _ = require('lodash')

const host = 'https://orange-squids-tap.loca.lt'
// const host = 'https://8c98ad1bb948e7.lhr.life'
const path = 'http://93.148.241.98:3000'
// const path = 'https://3f6c-2-40-82-43.ngrok-free.app'

let threadId = undefined

extend({ PlaneGeometry })

function Avatar({ speak, setSpeak, setAudioSource, playing, audio, setText }) {
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
          node.material.color.set(0xffffff)
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
        setText({ input: response.data.text, output: response.data.response })

        threadId = response.data.threadId

        let newClips = [
          createAnimation(blendData, morphTargetDictionaryBody, isModelDefault ? 'HG_Body' : 'Wolf3D_Head'),
          createAnimation(blendData, morphTargetDictionaryLowerTeeth, isModelDefault ? 'HG_TeethLower' : 'Wolf3D_Teeth'),
          createAnimation(blendData, morphTargetDictionaryBody, 'EyeLeft'),
          createAnimation(blendData, morphTargetDictionaryBody, 'EyeRight')
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

  return axios.post(host + '/talk', formdata, { headers: { 'Content-Type': 'multipart/form-data', 'bypass-tunnel-reminder': 'your-value-here' } });
}

const STYLES = {
  area: { position: 'absolute', bottom: '10px', left: '10%', zIndex: 500 },
  text: { margin: '0px', width: '300px', padding: '5px', background: 'none', color: '#ffffff', fontSize: '1.2em', border: 'none' },
  speak: { padding: '10px', marginTop: '5px', display: 'block', color: '#FFFFFF', background: '#222222', border: 'None' },
  area2: { position: 'absolute', top: '5px', right: '15px', zIndex: 500 },
  label: { color: '#777777', fontSize: '0.5em' },
  checkbox: { marginLeft: '5px' }
}

const MyAvatar = () => {
  const [audioBlob, setAudioBlob] = useState('')
  const [speak, setSpeak] = useState(false)
  const [audioSource, setAudioSource] = useState('')
  const [audioUrl, setAudioUrl] = useState('')
  const [playing, setPlaying] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isClicking, setIsClicking] = useState(false)
  const [text, setText] = useState({ input: '', output: '' })

  useEffect(() => {
    console.log(text)
  }, [text])

  const wordStyles = {
    small: {
      fontSize: '12px',
    },
    medium: {
      fontSize: '24px',
    },
    large: {
      fontSize: '36px',
    },
    xlarge: {
      fontSize: '48px',
    },
    red: {
      color: '#e74c3c',
    },
    blue: {
      color: '#3498db',
    },
    green: {
      color: '#2ecc71',
    },
    purple: {
      color: '#9b59b6',
    },
    common: {
      margin: '5px',
      fontWeight: 'bold',
      display: 'inline-block',
      transition: 'transform 0.3s ease-in-out',
    },
  };
  const containerStyles = {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '80%',
    margin: '0 auto',
    textAlign: 'center',
  };
  const handleHover = (event) => {
    event.target.style.transform = 'scale(1.2)';
  };
  const handleMouseOut = (event) => {
    event.target.style.transform = 'scale(1)';
  };


  useEffect(() => {
    const fetchAudio = async () => {
      try {
        const response = await fetch(audioSource, {
          headers: {
            'bypass-tunnel-reminder': 'any-value'
          }
        });

        if (response.ok) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          setAudioUrl(url);
        } else {
          console.error('Error fetching audio:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching audio:', error);
      }
    };

    fetchAudio();

    // Cleanup URL object when component unmounts
    return () => URL.revokeObjectURL(audioUrl);
  }, [audioSource]);

  return (
    <>
      <Canvas camera={{ position: [0, -.04, .5] }}>
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
            setText={setText}
          />
          <Environment preset='sunset' />
        </Suspense>
      </Canvas>
      <Loader />
      {text.input !== '' &&
        <div style={{ position: 'absolute', top: '25px', right: '7%', zIndex: 500 }}>
          <div style={{ marginLeft: '25px', position: 'relative' }}>
            <div style={{
              maxWidth: '40dvw',
              backgroundColor: 'white',
              padding: '20px',
              fontSize: '3.5rem',
              borderRadius: '1rem 0 1rem 1rem',
              fontWeight: 'bold',
              position: 'relative',
            }}>
              {text.input}

              <div style={{
                content: '""',
                position: 'absolute',
                top: '0px',
                right: '-14px',
                width: 0,
                height: 0,
                borderBottom: '15px solid transparent',
                borderLeft: '15px solid white',
              }} />
            </div>
          </div>

          <div style={{ marginRight: '25px', position: 'relative' }}>
            <div style={{
              maxWidth: '40dvw',
              marginTop: "1rem",
              backgroundColor: 'lightblue',
              padding: '20px',
              fontSize: '3.5rem',
              borderRadius: '0 1rem 1rem 1rem',
              fontWeight: 'bolder',
              position: 'relative',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
            }}>
              {text.output}
              <div style={{
                content: '""',
                position: 'absolute',
                top: '0px',
                left: '-14px',
                width: 0,
                height: 0,
                borderBottom: '15px solid transparent',
                borderRight: '15px solid lightblue',
              }} />
            </div>
          </div>
        </div>
      }
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
          src={audioUrl}
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
    <button
      onClick={handleClick}
      style={{
        backgroundColor: isRecording ? 'red' : 'white',
        color: 'white',
        borderRadius: '2rem',
        width: '17rem',
        height: '8rem',
        border: 'none',
        fontSize: '3.5rem',
        cursor: 'pointer',
        transition: 'background-color 0.5s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        padding: '0',
      }}
    >
      <img
        src={'/microphone.png'}
        alt={isRecording ? 'Stop' : 'Start'}
        style={{
          width: '60px',
          height: '60px',
        }}
      />
      <span
        style={{
          color: 'black',
          fontWeight: "bold",
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
  const texture = useVideoTexture('/prova.mp4')

  return (
    <mesh position={[0, 0, -0.5]} scale={[4, 4, 4]}>
      <planeGeometry />
      <meshBasicMaterial map={texture} />
    </mesh>
  )
}

export default MyAvatar