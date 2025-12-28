import { teachers, useAITeacher } from "../hooks/useAITeacher";
import { Html, useAnimations, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { MathUtils, MeshStandardMaterial } from "three";
import { randInt } from "three/src/math/MathUtils";

const ANIMATION_FADE_TIME = 0.5;

// --- NEW AZURE ID TO RPM VISEME MAP ---
const AZURE_ID_TO_RPM_VISEME = {
  0: "viseme_sil",
  1: "viseme_AA",
  2: "viseme_IH",
  3: "viseme_i",
  4: "viseme_u",
  5: "viseme_o",
  6: "viseme_AE",
  7: "viseme_E",
  8: "viseme_o",
  9: "viseme_o",
  10: "viseme_ER",
  11: "viseme_L",
  12: "viseme_R",
  13: "viseme_W",
  14: "viseme_PP",
  15: "viseme_FF",
  16: "viseme_TH",
  17: "viseme_S",
  18: "viseme_kk",
  19: "viseme_T",
  20: "viseme_CH",
  21: "viseme_TH",
};

export function Teacher({ teacher, ...props }) {
  const group = useRef();

  // Check if the current teacher is the new RPM model
  const isRpm = teacher === "rpm";

  // Model Loading
  const { scene } = useGLTF(`/models/Teacher_${teacher}.glb`);

  useEffect(() => {
    scene.traverse((child) => {
      if (child.material) {
        child.material = new MeshStandardMaterial({
          map: child.material.map,
        });
      }
    });

    // --- 🆕 For RPM models: store eye objects for blinking ---
    if (isRpm) {
      const leftEye = scene.getObjectByName("EyeLeft");
      const rightEye = scene.getObjectByName("EyeRight");
      scene.userData.leftEye = leftEye;
      scene.userData.rightEye = rightEye;
    }
  }, [scene]);

  const currentMessage = useAITeacher((state) => state.currentMessage);
  const loading = useAITeacher((state) => state.loading);
  const { animations } = useGLTF(`/models/animations_${teacher}.glb`);
  const { actions, mixer } = useAnimations(animations, group);
  const [animation, setAnimation] = useState("Idle");

  const [blink, setBlink] = useState(false);

  useEffect(() => {
    let blinkTimeout;
    const nextBlink = () => {
      blinkTimeout = setTimeout(() => {
        setBlink(true);
        setTimeout(() => {
          setBlink(false);
          nextBlink();
        }, 160); // smoother blink
      }, randInt(1000, 5000));
    };
    nextBlink();
    return () => clearTimeout(blinkTimeout);
  }, []);

  useEffect(() => {
    if (loading) {
      setAnimation("Thinking");
    } else if (currentMessage) {
      setAnimation(randInt(0, 1) ? "Talking" : "Talking2");
    } else {
      setAnimation("Idle");
    }
  }, [currentMessage, loading]);

  useFrame(({ camera }) => {
    // Smile logic remains
    lerpMorphTarget("mouthSmile", 0.2, 0.5);

    // --- 🆕 Blink Fix: RPM uses eye mesh visibility ---
    if (isRpm) {
      const { leftEye, rightEye } = scene.userData;
      if (leftEye && rightEye) {
        const closed = blink;
        leftEye.visible = !closed;
        rightEye.visible = !closed;
      }
    } else {
      // Old models: use morph-based blink
      lerpMorphTarget("eye_close", blink ? 1 : 0, 0.5);
    }

    // --- Conditional lip sync reset ---
    if (isRpm) {
      Object.values(AZURE_ID_TO_RPM_VISEME).forEach((visemeName) => {
        lerpMorphTarget(visemeName, 0, 0.1);
      });
    } else {
      for (let i = 0; i <= 21; i++) {
        lerpMorphTarget(i, 0, 0.1);
      }
    }

    if (
      currentMessage &&
      currentMessage.visemes &&
      currentMessage.audioPlayer
    ) {
      for (let i = currentMessage.visemes.length - 1; i >= 0; i--) {
        const viseme = currentMessage.visemes[i];
        if (currentMessage.audioPlayer.currentTime * 1000 >= viseme[0]) {
          let targetViseme = viseme[1];
          if (isRpm) {
            targetViseme = AZURE_ID_TO_RPM_VISEME[viseme[1]];
          }
          if (targetViseme !== undefined) {
            lerpMorphTarget(targetViseme, 1, 0.2);
          }
          break;
        }
      }
      if (
        actions[animation].time >
        actions[animation].getClip().duration - ANIMATION_FADE_TIME
      ) {
        setAnimation((animation) =>
          animation === "Talking" ? "Talking2" : "Talking"
        );
      }
    }
  });

  useEffect(() => {
    actions[animation]
      ?.reset()
      .fadeIn(mixer.time > 0 ? ANIMATION_FADE_TIME : 0)
      .play();
    return () => {
      actions[animation]?.fadeOut(ANIMATION_FADE_TIME);
    };
  }, [animation, actions]);

  const lerpMorphTarget = (target, value, speed = 0.1) => {
    scene.traverse((child) => {
      if (child.isSkinnedMesh && child.morphTargetDictionary) {
        let index;
        if (typeof target === "number") {
          index = target;
        } else {
          index = child.morphTargetDictionary[target];
        }

        if (
          index === undefined ||
          child.morphTargetInfluences[index] === undefined
        ) {
          return;
        }

        child.morphTargetInfluences[index] = MathUtils.lerp(
          child.morphTargetInfluences[index],
          value,
          speed
        );
      }
    });
  };

  const [thinkingText, setThinkingText] = useState(".");

  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setThinkingText((thinkingText) => {
          if (thinkingText.length === 3) {
            return ".";
          }
          return thinkingText + ".";
        });
      }, 500);
      return () => clearInterval(interval);
    }
  }, [loading]);

  return (
    <group {...props} dispose={null} ref={group}>
      {loading && (
        <Html position-y={teacher === "Nanami" ? 1.6 : 1.8}>
          <div className="flex justify-center items-center -translate-x-1/2">
            <span className="relative flex h-8 w-8 items-center justify-center">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex items-center justify-center duration-75 rounded-full h-8 w-8 bg-white/80">
                {thinkingText}
              </span>
            </span>
          </div>
        </Html>
      )}
      <primitive object={scene} />
    </group>
  );
}

// ⚠️ IMPORTANT: Update your `useAITeacher.js` hook to include "rpm" in the `teachers` array.
teachers.forEach((teacher) => {
  useGLTF.preload(`/models/Teacher_${teacher}.glb`);
  useGLTF.preload(`/models/animations_${teacher}.glb`);
});
