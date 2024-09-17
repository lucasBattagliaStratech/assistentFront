import {
  AnimationClip,
  NumberKeyframeTrack,
} from 'three';

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
  console.log("----morphTargetDictionary", { recordedData, morphTargetDictionary });

  if (recordedData.length !== 0) {
    let animation = [];
    for (let i = 0; i < Object.keys(morphTargetDictionary).length; i++) {
      animation.push([]);
    }

    let time = [];
    let accumulatedTime = 0;

    recordedData.forEach((d, i) => {
      const visemeIndex = d.viseme
      const visemeTime = d.time
      const visemeKey = translateViseme(visemeIndex)

      console.log(visemeKey)
      // animation[visemeValue].push(1.0)
      // if (visemeKey && visemeIndex in morphTargetDictionary) {
      //   // Rellenamos los valores en la posición correcta del viseme en la animación
      //   animation[morphTargetDictionary[visemeKey]].push(1.0); // Viseme activo
      // }

      // Añadimos valores para los visemes inactivos
      Object.keys(morphTargetDictionary).forEach((key, idx) => {
        if (idx !== visemeKey) {
          animation[idx].push(0.0); // Viseme inactivo
        } else {
          animation[idx].push(1.0)
        }
      });

      // Guardamos el tiempo en segundos
      time.push(accumulatedTime);
      accumulatedTime += visemeTime
    });

    // Creación de los tracks de animación
    let tracks = [];

    // Iteramos sobre cada entrada del morphTargetDictionary

    Object.keys(morphTargetDictionary).forEach((key, idx) => {
      console.log({ animation: animation[idx], bodyPart, key, idx, time })
      let track = new NumberKeyframeTrack(`${bodyPart}.morphTargetInfluences[${idx}]`, time, animation[idx]);
      tracks.push(track);
    });

    const clip = new AnimationClip('animation', -1, tracks);
    return clip;
  }

  return null;
}

export default createAnimation;
