import {
  AnimationClip,
  // BooleanKeyframeTrack,
  // ColorKeyframeTrack,
  NumberKeyframeTrack,
  // Vector3,
  // VectorKeyframeTrack
} from 'three'

var fps = 60

function modifiedKey(key) {
  if (["eyeLookDownLeft", "eyeLookDownRight", "eyeLookInLeft", "eyeLookInRight", "eyeLookOutLeft", "eyeLookOutRight", "eyeLookUpLeft", "eyeLookUpRight"].includes(key)) {
    return key
  }

  if (key === 'jawOpen') return 'viseme_O'

  if (key.endsWith("Right")) {
    return key.replace("Right", "_R")
  }
  if (key.endsWith("Left")) {
    return key.replace("Left", "_L")
  }
  return key
}

function createAnimation(recordedData, morphTargetDictionary, bodyPart) {
  console.log(recordedData)

  console.log("----morphTargetDictionary", { recordedData, morphTargetDictionary })
  if (recordedData.length !== 0) {
    let animation = []
    for (let i = 0; i < Object.keys(morphTargetDictionary).length; i++) {
      animation.push([])
    }
    let time = []
    let finishedFrames = 0
    recordedData.forEach((d, i) => {
      Object.entries(d.blendshapes).forEach(([key, value]) => {
        if (!(modifiedKey(key) in morphTargetDictionary)) return

        if (key === 'mouthShrugUpper') value += 0.4

        console.log({ key, value })
        animation[morphTargetDictionary[modifiedKey(key)]].push(value)
      })
      time.push(finishedFrames / fps)
      finishedFrames++
    })

    let tracks = []

    // let flag = false
    //create morph animation
    Object.entries(recordedData[0].blendshapes).forEach(([key, value]) => {

      console.log({ modifiedKey: modifiedKey(key), bodyPart, morphTargetDictionary })
      if (!(modifiedKey(key) in morphTargetDictionary)) { return }

      let i = morphTargetDictionary[modifiedKey(key)]

      // if (bodyPart === "HG_TeethLower") {

      //       if (flag === true)
      //         return

      //       if(key === 'jawOpen') {
      //         let track2 = new NumberKeyframeTrack(`HG_TeethLower.morphTargetInfluences[${i}]`, time, animation[i])
      //         tracks.push(track2)
      //         flag = true
      //       }
      // } else {
      console.log({ animation, bodyPart, time })
      const a = {
        animation: [[], [], [], [], [], [], [], [], [], [], [], [], [], [

          0.257, 0.228, 0.206, 0.205, 0.225, 0.252, 0.258, 0.289, 0.314, 0.327], []],
        bodyPart: 'Wolf3D_Teeth',
        time: Array[

          0, 0.016666666666666666, 0.03333333333333333, 0.05, 0.06666666666666667, 0.08333333333333333, 0.1, 0.11666666666666667,

          0.13333333333333333, 0.15]
      }

      let track = new NumberKeyframeTrack(`${bodyPart}.morphTargetInfluences[${i}]`, time, animation[i])

      tracks.push(track)

      // }

      // if (key === "jawOpen") {
      //   let track2 = new NumberKeyframeTrack(`HG_TeethLower.morphTargetInfluences[${i}]`, time, animation[i])
      //   tracks.push(track2)
      //   console.log("----jawOpen Track", track2)
      // }
    })

    const clip = new AnimationClip('animation', -1, tracks)
    return clip
  }
  return null
}

export default createAnimation