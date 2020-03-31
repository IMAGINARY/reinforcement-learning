const AllTexts = {
  "en": {

    letsMove: {
      title: "Let's move!",
      text:`You are a robot and navigate through a maze. You can walk over the floor, but cannot pass through walls. 

      You always know your current position (so called state) given by the coordinates and in which direction you can move in each state (so called actions), shown by the yellow arrows.`
    },
    findPower: {
      title: "Find the power station!",
      text:`As a robot you do not see the whole maze, but only the position you are in (the state which are the coordinates). This looks like moving in a dark room, with limited sight! 

      The robot has to find a hidden battery station in the maze! Can you find it?`
    },
    getRewarded: {
      title: "Get rewarded!",
      text:`Sometimes it is not clear, which way is the best way to find the power station. How can you know or find out? The robot receives a positive or negative feedback for each taken action when moving from one position (state) to a next position (successor state). 

      This feedback or reward is a number, which is positive or negative for good or bad, the so called reinforcement. Observe the numbers, while you move!`
    },
    accumulatedReward: {
      title:'Rewards, on the long run!',
      text:`To find a good way to reach the battery station, you have to somehow accumulate the reinforcements, to connect them from one state to the next. Or: to trace them back from the battery station to the start position. To do this, you can just sum up all reinforcements received while moving. This sum is called the return. It shows how well you moved, on a long run. 
      Can you find the way with the highest return?
      
      Note, that we consider near reinforcements as higher than ones far in the future. We use a discount factor for this. The higher it is, the more future rewards are taking into account.`
    },

    intro: "Reinforcement learning (RL) is an area of machine learning concerned with how software agents ought to take actions in an environment so as to maximize some notion of cumulative reward. Reinforcement learning is one of three basic machine learning paradigms, alongside supervised learning and unsupervised learning. (wikipedia) This exhibit explains how a robot can learn to navigate through a maze in order to reach its destination, before running out of power. At first the robot knows nothing, and learns from each new action (movement) and state (location reached). Slowly it starts to develop an understanding of the maze that will allow it to reach the charging station before it runs out of power. Eventually, it should learn to avoid any detour and reach the charging station in the optimal number of steps.",
    stateAction: "This Robot is standing in a room. It can walk over the floow, but cannot pass through the walls. It always knows where it is, and in which directions in can move, but does not know anything else about the room.",
    goal: "The robot only knows where it is, and in which directions it can move. Can you help it find the charging station?",
    bestway: "Sometimes it is possible to reach the goal in more than one way. If you had limited energy, how would you try to reach the goal here?",
    localIntro: "But there is a problem! The robot cannot see the whole maze, it only knows where it is and in which direction it can move. Can you reach the charging station in those conditions? Use the arrows to move",
    globalIntro: `As a human, you keep track of where you are and how you got there without thinking, which helps you think about what actions you should take next to reach your destination. And you can also just look around! How can then the robot 'think' of the maze, to know which action is the best at every moment? And how can it learn that? It must somehow keep track of where it is, and remember how good or bad was each action at each place in the maze, try new things, and update it's "mental image" of what was a good decision and what not.

    

    Reinforcement Learning uses the concept of a "Q-function", which keeps track of how "good" it expects it to be to take a specific action 'a' from a specific location 's'. This is written as Q(s, a). It also uses a "policy", which determines the best action to take in a given state, and is written as π(s). The robot must learn those functions while it navigates the maze. With each step, the functions are modified by a little bit, until eventually they give it the best strategy to solve the maze.`
  },
  "de": {}
}

export var Texts = AllTexts["en"];
function setLanguage(languageCode) {
  Texts = AllTexts[languageCode];
}