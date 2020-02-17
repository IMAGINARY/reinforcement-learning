const AllTexts = {
  "en": {
    intro: "Reinforcement learning (RL) is an area of machine learning concerned with how software agents ought to take actions in an environment so as to maximize some notion of cumulative reward. Reinforcement learning is one of three basic machine learning paradigms, alongside supervised learning and unsupervised learning. (wikipedia) This exhibit explains how a robot can learn to navigate through a maze in order to reach its destination, before running out of power. At first the robot knows nothing, and learns from each new action (movement) and state (location reached). Slowly it starts to develop an understanding of the maze that will allow it to reach the charging station before it runs out of power. Eventually, it should learn to avoid any detour and reach the charging station in the optimal number of steps.",
    localIntro: "But there is a problem! The robot cannot see the whole maze, it only knows where it is and in which direction it can move. Can you reach the charging station in those conditions? Use the arrows to move",
    globalIntro: `As a human, you keep track of where you are and how you got there without thinking, which helps you think about what actions you should take next to reach your destination. And you can also just look around! How can then the robot 'think' of the maze, to know which action is the best at every moment? And how can it learn that? It must somehow keep track of where it is, and remember how good or bad was each action at each place in the maze, try new things, and update it's "mental image" of what was a good decision and what not.

    Reinforcement Learning uses the concept of a "Q-function", which keeps track of how "good" it expects it to be to take a specific action 'a' from a specific location 's'. This is written as Q(s, a). It also uses a "policy", which determines the best action to take in a given state, and is written as π(s). The robot must learn those functions while it navigates the maze. With each step, the functions are modified by a little bit, until eventually they give it the best strategy to solve the maze.`
  },
  "de": {}
}

var Texts = AllTexts["en"];
function setLanguage(languageCode) {
  Texts = AllTexts[languageCode];
}