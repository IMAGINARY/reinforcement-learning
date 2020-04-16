import { Texts } from "./language.js";
import { machine } from './rl';

export const Levels = {
  letsMove: {
    components: ["global"],
    levelMap: [
      [0, 0, 0, 0, 0],
      [0, 2, 0, 0, 0],
      [0, 0, 1, 0, 0],
      [0, 0, 0, 0, 0],
      [1, 1, 0, 0, 0]
    ],
    noScore: true,
    infoBox: {
      ...Texts.letsMove,
      showState: true,
      showActions: true,
    },
  },
  findPower: {
    components: ["global", "sliders", "score"],
    controls: ["fog"],
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
    components: ["global", "sliders", "score"],
    controls: ["fog"],
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
    controls: ["discountFactor", "fog"],
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
  mapStates: {
    components: ["global", "score", "sliders"],
    controls: ["discountFactor", "fog", "qvalue", "greedy"],
    levelMap: [
      [0, 0, 0, 0, 0],
      [0, 1, 1, 1, 0],
      [0, 1, 0, 1, 8],
      [0, 1, 1, 1, 0],
      [2, 0, 0, 0, 0]
    ],
    infoBox: {
      ...Texts.mapStates,
      showState: true,
      showActions: true,
      showReward: true,
      showAccumulated: true
    }
  },
  learn: {
    components: ["global", "score", "sliders", "training"],
    controls: ["discountFactor", "fog", "qvalue", "greedy", "epsilon", "learningRate"],
    training: {
      [Texts.training.oneEpisode]: () => machine.train(1),
      [Texts.training.twentyEpisodes]: () => machine.train(20),
      [Texts.training.unlearn]: () => machine.reset_machine(),
    },
    levelMap: [
      [0, 0, 0, 0, 0, 0],
      [0, 1, 0, 1, 0, 8],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 1, 0, 0, 1],
      [0, 0, 0, 0, 0, 0],
      [2, 0, 0, 1, 0, 1]
    ],
    preTrain: 200,
    infoBox: {
      ...Texts.learn,
      showState: true,
      showActions: true,
      showReward: true,
      showQValue: true
    },
  },
  qLearning: {
    components: ["global", "score", "sliders", "formula", "editor", "training"],
    controls: ["discountFactor", "fog", "qvalue", "greedy", "epsilon", "learningRate"],
    training: {
      [Texts.training.oneEpisode]: () => machine.train(1),
      [Texts.training.twentyEpisodes]: () => machine.train(20),
      [Texts.training.unlearn]: () => machine.reset_machine(),
    },
    levelMap: [
      [0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0],
      [0,1,4,4,4,4,4,4,1,0],
      [0,1,4,4,4,4,4,4,1,0],
      [2,1,4,4,4,4,4,4,1,8]
    ],
    infoBox: {
      ...Texts.qLearning,
      showState: true,
      showActions: true,
      showReward: true,
      showQValue: true,
      showGreedy: true
    },
  },
  playground: {
    components: ["global", "score", "sliders", "formula", "editor", "training"],
    controls: ["discountFactor", "fog", "qvalue", "greedy", "epsilon"],
    training: {
      [Texts.training.oneEpisode]: () => machine.train(1),
      [Texts.training.twentyEpisodes]: () => machine.train(20),
      [Texts.training.unlearn]: () => machine.reset_machine(),
    },
    evaluation: {
      [Texts.evaluation.oneStep]: () => {
        machine.learning = false;
        machine.auto_step();
        machine.learning = true;
      },
      [Texts.evaluation.greedyStep]: () => {
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
      [0, 0, 0, 1, 0, 0, 0, 1, 0, 1],
      [0, 1, 1, 1, 1, 1, 0, 1, 0, 0],
      [0, 0, 0, 0, 0, 1, 1, 1, 0, 0],
      [1, 0, 1, 0, 0, 0, 0, 1, 1, 0],
      [0, 0, 1, 1, 1, 0, 0, 0, 0, 0],
      [2, 0, 0, 0, 1, 0, 1, 0, 0, 1]
    ],
    infoBox: {
      ...Texts.playground,
      showState: true,
      showActions: true,
      showReward: true,
    },
  }
};

