import { Texts } from "./language.js";
import { machine } from './rl';

export const Levels = {
  letsMove: {
    components: ["global"],
    levelMap: [
      [0, 0, 0, 0],
      [0, 2, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 0]
    ],
    infoBox: {
      ...Texts.letsMove,
      showState: true,
      showActions: true,
    },
  },
  findPower: {
    components: ["global"],
    hasFog: true,
    levelMap: [
      [8, 0, 0, 0, 0],
      [1, 1, 1, 1, 0],
      [0, 0, 1, 0, 0],
      [0, 1, 1, 0, 0],
      [2, 0, 0, 0, 1],
    ],
    infoBox: {
      ...Texts.findPower,
      showState: true,
      showActions: true
    }
  },
  getRewarded: {
    components: ["global"],
    levelMap: [
      [0, 0, 0, 0, 0],
      [0, 1, 1, 1, 0],
      [0, 1, 0, 1, 8],
      [0, 1, 1, 1, 0],
      [2, 0, 0, 0, 0]
    ],
    infoBox: {
      ...Texts.getRewarded,
      showState: true,
      showActions: true,
      showReward: true
    }
  },
  accumulatedReward: {
    components: ["global", "score", "sliders"],
    controls: ["learningRate", "discountFactor"],
    levelMap: [
      [0, 0, 0, 0, 0],
      [0, 1, 1, 1, 0],
      [0, 1, 0, 1, 8],
      [0, 1, 1, 1, 0],
      [2, 0, 0, 0, 0]
    ],
    infoBox: {
      ...Texts.accumulatedReward,
      showState: true,
      showActions: true,
      showReward: true,
      showAccumulated: true
    }
  },
  playground: {
    components: ["global", "sliders", "plot", "training","evaluation", "score", "editor"],
    controls: ["learningRate", "discountFactor", "epsilon", "qvalue", "greedy"],
    training: {
      "Train 1 episode": () => machine.train(1),
      "Train 20 episodes": () => machine.train(20),
      "Unlearn all": () => machine.reset_machine(),
      "Evaluate Robot": () => {
        const evaluation = machine.evaluate(100);
      }
    },
    evaluation: {
      "Do 1 step": () => {
        machine.learning = false;
        machine.auto_step();
        machine.learning = true;
      },
      "Do 1 greedy step": () => {
        machine.learning = false;
        machine.greedy_step();
        machine.learning = true;
      },
    },
    levelMap: [
      [0, 0, 1, 8, 0, 0, 0, 0, 0, 0],
      [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
      [1, 0, 0, 0, 0, 1, 0, 1, 0, 1],
      [0, 0, 0, 1, 0, 0, 0, 1, 0, 1],
      [0, 1, 1, 1, 1, 1, 0, 1, 0, 0],
      [0, 0, 0, 0, 0, 1, 1, 1, 0, 0],
      [1, 0, 1, 0, 0, 0, 0, 1, 1, 0],
      [0, 0, 1, 1, 1, 0, 0, 0, 0, 0],
      [2, 0, 0, 0, 1, 0, 1, 0, 0, 1]
    ],
    infoBox: {
      title: 'Learning',
      text: Texts.globalIntro,
      showState: true,
      showActions: true,
      showReward: true,
      showAccumulated: true
    },
  }
};

