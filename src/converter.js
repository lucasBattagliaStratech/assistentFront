import {
  AnimationClip,
  NumberKeyframeTrack,
} from 'three'

const visemeMapping = {
  0: "viseme_sil",
  1: "viseme_PP",
  2: "viseme_FF",
  3: "viseme_TH",
  4: "viseme_DD",
  5: "viseme_kk",
  6: "viseme_CH",
  7: "viseme_SS",
  8: "viseme_nn",
  9: "viseme_RR",
  10: "viseme_aa",
  11: "viseme_E",
  12: "viseme_I",
  13: "viseme_O",
  14: "viseme_U",
}

const visemeExtra = {
  15: 1,
  16: 10,
  17: 2,
  18: 7,
  19: 4,
  20: 10,
  21: 9
}

function translateViseme(visemeId) {
  const reverseMapping = Object.fromEntries(
    Object.entries(visemeMapping).map(([key, value]) => [value, key])
  )

  if (visemeId in visemeMapping) {
    return reverseMapping[visemeMapping[visemeId]]
  } else if (visemeId in visemeExtra) {
    return reverseMapping[visemeMapping[visemeExtra[visemeId]]]
  } else {
    return reverseMapping[visemeMapping[0]]
  }
}

function createAnimation(recordedData, morphTargetDictionary, bodyPart) {

  if (recordedData.length !== 0) {
    let animation = [];
    for (let i = 0; i < Object.keys(morphTargetDictionary).length; i++) {
      animation.push({ time: [], animation: [] })
    }

    recordedData.forEach((d, i) => {
      const visemeIndex = d.viseme
      const visemeTime = d.time
      const visemeKey = Number(translateViseme(visemeIndex))

      Object.keys(morphTargetDictionary).forEach((key, idx) => {
        animation[idx].animation.push(idx === visemeKey ? .6 : 0.0)

        animation[idx].time.push(visemeTime)
      })

    })

    let tracks = [];

    Object.keys(morphTargetDictionary).forEach((key, idx) => {
      if (animation[idx].animation.every(value => value === 0)) return
      let track = new NumberKeyframeTrack(`${bodyPart}.morphTargetInfluences[${idx}]`, animation[idx].time, animation[idx].animation)
      tracks.push(track)
    });

    const clip = new AnimationClip('animation', -1, tracks)
    return clip;
  }

  return null;
}

export default createAnimation;
