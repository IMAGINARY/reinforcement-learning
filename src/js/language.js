const AllTexts = {
  "en": {

    letsMove: {
      title: "Let's move!",
      text:`I am a robot and navigate through a maze. I can walk over the floor, but cannot pass through walls.<br>
      <br>
      I always know my current position, the so called state given by two coordinates, and in which direction I can move in each state, the so called actions shown by the yellow arrows.<br>
      <br>
      Can you control me?`
    },
    findPower: {
      title: "Find the power station!",
      text:`Being a robot I need energy when I move around. The current energy level is displayed. When I run out of energy, I am moved back to the start position and will regain full energy.<br>
      <br>
      From my robot’s point of view, I do not see the whole maze. I only know my position and the actions I can take. This looks like moving in a dark room, with limited sight! <br>
      <br>
      I have to find a hidden power station in the maze! Can you help me?`
    },
    getRewarded: {
      title: "Get rewarded!",
      text:`Which is the shortest way to find the power station? How can I find out? As a robot I receive a positive or negative feedback for each taken action when moving from one position (state) to a next position (successor state). This feedback, the so called reward or reinforcement, is a number, which is positive or negative for good or bad.<br>
      <br>
      Observe the numbers while moving! How high is the reward, when I reach the power station?`
    },
    accumulatedReward: {
      title:'Rewards, on the long run!',
      text:`It is not about receiving single high rewards, but to receive as many of them in total! So, I should consider all of them together, the positive and negative reinforcements I receive while moving. To do this, I can sum up all reinforcements received from the start to the end. The end is defined by running out of battery or by finding the power station. This sum of reinforcements is called the return. It shows how well I moved, on a long run.<br>
      <br>
      Can you help me find the way to the power station with the highest return?<br>
      <br>
      Note, that immediate reinforcements are considered as higher than the ones received far in the future. Thus, I use a so called discount factor when summing up the reinforcements. The higher it is, the more future I take into account future rewards. If it is low, I give much more attention to current rewards.<br>
      <br>
      Change the discount factor and observe the return!`
    },
    mapStates: {
      title:'Map the good states! And be greedy!',
      text: `Imagine now, that I know the returns for each state, that is the number of all rewards, which I will receive from that state onwards. What do you think is the best next step to take from each state looking at the returns? Yes, I just move towards the state with the highest return. These returns for each state are called Values or V. They are displayed in a colour map, the more red the higher!<br>
      <br>
      The returns or Values are connected to a given path I take, i.e. the path I chose to sum up the rewards. This path is called a policy. It tells me which action to take in each state. If I always take the action to get to the highest return, I call it the greedy policy. It is the one looking for the highest rewards!<br>
      <br>
      Turn on the greedy policy switch and you can see the current best path to follow!`
    },
    learn: {
      title: 'Now, learn!',
      text: `Instead of summing up rewards to get the return and to pre-calculate the values V, I can approximate V on a step by step basis by moving around and observing. The concept behind it is simple and powerful: for each step I just take the current reinforcement and add the estimated return of the successor state(s) to it. I can do this update for each state with the already estimated returns (updating them step by step while moving around).<br>
      <br>
      You can imagine that at the beginning the estimation is not so good, so I have to explore a lot, try different actions, observe the reinforcements received and thus update my V values very often. Exploration is very important, i.e. I try new (random) actions in states. But, to improve the approximation of V along the already learned paths and learn faster, it makes sense to follow a greedy policy and enhance its V value estimates. The balance between taking random actions and choosing greedy actions is called “exploration vs. exploitation”. You can choose how much exploration I do in each learning step with the exploration slider.<br>
      <br>
      Now try to learn 1 episode by clicking on the respective button and see how the V values are changing? Learn again! Move around! Learn more and observe how the greedy policy changes...`
    },
    qLearning: {
      title: 'Q-Learning and the editor',
      text: `It proved to me more practical to update the so called Q values (instead of V). The Q values are showing the expected long-term reward if I am in a state and take a certain action. So, it is not only related to the state. The advantage is: with the Q values I can easily decide which is the best action to take (the one with the highest Q) and I can also in theory learn in environments, which are not deterministic. This means: there can be a probability underlying my movements, such that for example I would not always land in the same successor state from the same state and taking the same action.<br>
      <br>
      Q-learning was proven (mathematically) to lead to an optimal strategy (the best way to maximize rewards) for any problem! (given certain conditions and learning for a looooong time). This is fantastic. One method to solve all types of problems, for any maze! Or also for other games (with states, actions and rewards).<br>
      <br>
      Try changing the maze with the map editor. You can create your own problems and also add “dangerous fields” as shown here in the pitfall example.`
    },
    playground: {
      title: 'Play with me',
      text:  `I am a robot equipped with the powerful Q-learning algorithm. With this method, I can learn by just walking around and observing rewards, and by changing my strategy so that I will receive as many rewards as possible on a long run. In this case it will lead me the fastest way to the power station!<br>
      <br>
      Walk with me, try to learn through several walking episodes and observe how I build up a V value map to guide myself (all options on the right side). In the tutorial you will find out more details on all options and the learning method. You can open it via the small dots below.<br>
      <br>
      In AI this type of learning is called Reinforcement Learning. It is a fundamental method of Machine Learning.`
    },

    intro: "Reinforcement learning (RL) is an area of machine learning concerned with how software agents ought to take actions in an environment so as to maximize some notion of cumulative reward. Reinforcement learning is one of three basic machine learning paradigms, alongside supervised learning and unsupervised learning. (wikipedia) This exhibit explains how a robot can learn to navigate through a maze in order to reach its destination, before running out of power. At first the robot knows nothing, and learns from each new action (movement) and state (location reached). Slowly it starts to develop an understanding of the maze that will allow it to reach the charging station before it runs out of power. Eventually, it should learn to avoid any detour and reach the charging station in the optimal number of steps.",
    stateAction: "This Robot is standing in a room. It can walk over the floow, but cannot pass through the walls. It always knows where it is, and in which directions in can move, but does not know anything else about the room.",
    goal: "The robot only knows where it is, and in which directions it can move. Can you help it find the charging station?",
    bestway: "Sometimes it is possible to reach the goal in more than one way. If you had limited energy, how would you try to reach the goal here?",
    localIntro: "But there is a problem! The robot cannot see the whole maze, it only knows where it is and in which direction it can move. Can you reach the charging station in those conditions? Use the arrows to move",

    goalReached: 'The Robot reached the goal',
    outOfBattery: "The Robot has run out of battery",

    ok: 'Ok',

    training: {
      training: 'Training',
      oneEpisode: '1 episode',
      twentyEpisodes: '20 episodes',
      unlearn: 'Unlearn',
      evaluate: 'Evaluate'
    },
    evaluation: {
      oneStep: 'Do one step',
      greedyStep: 'Do one greedy step',
    },
    info: {
      state: 'State',
      actions: 'Actions',
      reinforcement: 'Reinforcement',
      accumulated: 'Return',
    },
    controls: {
      discountFactor: 'Discount factor',
      learningRate: 'Learning rate',
      exploration: 'Exploration',
      learning: 'Learn from actions',
      showQvalue: 'How good is each position? (Values)',
      showGreedy: 'Where should I go? (greedy policy)',
      fog: 'Robot view'
    }
  },
  "de": {}
}

export var Texts = AllTexts["en"];
function setLanguage(languageCode) {
  Texts = AllTexts[languageCode];
}