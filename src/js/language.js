const AllTexts = {
    "en": {
        letsMove: {
            title: "Let's move!",
            text: `I am a robot and navigate through a maze. I can walk over the floor, but cannot pass through walls.<br>
      <br>
      I always know my current position, the so called state given by two coordinates, and in which direction I can move in each state, the so called actions shown by the yellow arrows.<br>
      <br>
      Can you control me?`
        },
        findPower: {
            title: "Find the power station!",
            text: `Being a robot I need energy when I move around. The current energy level is displayed. When I run out of energy, I am moved back to the start position and will regain full energy.<br>
      <br>
      From my robot’s point of view, I do not see the whole maze. I only know my position and the actions I can take. This looks like moving in a dark room, with limited sight! <br>
      <br>
      I have to find a hidden power station in the maze! Can you help me?`
        },
        getRewarded: {
            title: "Get rewarded!",
            text: `Which is the shortest way to find the power station? How can I find out? As a robot I receive a positive or negative feedback for each taken action when moving from one position (state) to a next position (successor state). This feedback, the so called reward or reinforcement, is a number, which is positive or negative for good or bad.<br>
      <br>
      Observe the numbers while moving! How high is the reward, when I reach the power station?`
        },
        accumulatedReward: {
            title: 'Rewards, on the long run!',
            text: `It is not about receiving single high rewards, but to receive as many of them in total! So, I should consider all of them together, the positive and negative reinforcements I receive while moving. To do this, I can sum up all reinforcements received from the start to the end. The end is defined by running out of battery or by finding the power station. This sum of reinforcements is called the return. It shows how well I moved, on a long run.<br>
      <br>
      Can you help me find the way to the power station with the highest return?<br>
      <br>
      Note, that immediate reinforcements are considered as higher than the ones received far in the future. Thus, I use a so called discount factor when summing up the reinforcements. The higher it is, the more future I take into account future rewards. If it is low, I give much more attention to current rewards.<br>
      <br>
      Change the discount factor and observe the return!`
        },
        mapStates: {
            title: 'Map the good states! And be greedy!',
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
            text: `I am a robot equipped with the powerful Q-learning algorithm. With this method, I can learn by just walking around and observing rewards, and by changing my strategy so that I will receive as many rewards as possible on a long run. In this case it will lead me the fastest way to the power station!<br>
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
    "de": {
        letsMove: {
            title: "Beweg mich!",
            text: `Ich bin ein Roboter, der sich durch ein Labyrinth navigiert. <br>
        <br>
        Ich kenne immer meine Position. Mein sogenannter “Zustand” wird durch zwei Koordinaten angegeben. In jedem Zustand kann ich verschiedene Richtungen einschlagen: das sind die sogenannten 'Aktionen', sie werden durch gelbe Pfeile markiert.<br>
        <br>
        Kannst du mich steuern?`
        },
        findPower: {
            title: "Finde die Ladestation!",
            text: `Als Roboter brauche ich Strom, um mich fortzubewegen. Wieviel Strom ich momentan besitze, wird angezeigt. Sobald ich keinen Strom mehr habe, schickt man mich wieder zur Startposition und ich erhalte wieder einen vollen Akku. <br>
        <br>
        Aus meiner Perspektive kann ich nicht das gesamte Labyrinth überblicken. Ich kenne nur meine Position und die Aktionen, die ich ausführen kann. Das ist, als würde ich mich im Dunkeln mit eingeschränkter Sicht bewegen! <br>
        <br>
        Ich muss die versteckte Ladestation finden. Kannst du mir helfen?`
        },
        getRewarded: {
            title: "Zeit belohnt zu werden!",
            text: `Welcher Weg zur Ladestation ist der kürzeste? Wie kann ich ihn finden? Als Roboter erhalte ich positiven oder negativen Feedback für jede Aktion, wenn ich mich von einer Position (Zustand) in einen nächsten bewege (Folgezustand). Dieser Feedback, die sogenannte Belohnung (engl. "Reinforcement"), ist üblicherweise eine positive Zahl für "gut" oder eine negative Zahl für "schlecht". <br>
        <br>
        Beobachte die Zahlen, während ich mich bewege! Wie hoch ist die Belohnung, wenn ich zur Ladestation komme?`
        },
        accumulatedReward: {
            title: 'Langfristige Belohnungen!',
            text: `Es geht weniger darum, einzelne hochwertige Belohnungen zu erhalten, sondern so viele von ihnen wie möglich! Also sollte ich, während ich mich fortbewege, nach den langfristigen positiven und negativen Belohnungen Ausschau halten. Dazu rechne ich alle Belohnungen vom Anfang bis zum Ende des Weges zusammen. An ein Ende komme ich entweder, wenn mein Akku verbraucht ist oder ich die Ladestation finde. Die Summe aller Belohnungen heißt "Return". Sie zeigt an, wie gut der Weg langfristig gesehen ist.<br>
        <br>
        Kannst du mir helfen den Weg zur Ladestation mit dem höchsten Return zu finden?<br>
        <br>
        Beachte, dass Belohnungen, die ich grade erhalten habe, höher bewertet werden, als Belohnungen, die länger in der Vergangenheit liegen. Aus diesem Grund verwende ich den sogenannten Discount-Faktor, wenn ich die Belohnungen zusammenrechne. Je höher er ist, desto wichtiger sind die letzten Belohnungen und desto weniger wichtig sind weiter vergangene Belohnungen.<br>
        <br>
        Stelle den Discount-Faktor ein und sieh dir an, wie der Return sich verändert!`
        },
        mapStates: {
            title: 'Lass dir gute Zustände auf der Karte zeigen! Und sei "greedy"!',
            text: `Stell dir vor, dass ich alle Returns für jeden Zustand kenne, das wären die Summen aller Belohnungen, die ich von dem Zustand aus bekomme, wenn ich den besten Weg zur Ladestation nehme. Was denkst du ist der bestmögliche Schritt von einem Zustand, wenn man nur auf die Returns schaut? Ja, ich bewege mich einfach zum Zustand mit dem höchsten Return! Diese Returns für jeden Zustand heißen V-Werte. Unsere Karte markiert sie farblich: je mehr rot, desto höher der Wert!<br>
        <br>
        Die Returns oder Werte hängen vom jeweiligen Weg ab: Also dem Weg, den ich eingeschlagen habe, um die Belohnungen zu summieren. Dieser Weg ist die sogenannte “policy”. Sie sagt mir, welche Aktion ich im jeweiligen Zustand nehme. Wenn ich immer die Aktion mit dem höchsten Return nehme, nenne ich sie eine "greedy policy". Sie sucht nach der höchsten Belohnung!<br>
        <br>
        Stelle die greedy policy ein, um den derzeit besten Weg zu sehen!`
        },
        learn: {
            title: 'Jetzt lerne!',
            text: `Anstatt die Belohnungen zum Return zu summieren und die V-Werte vorzuberechnen, kann ich V schätzen, indem ich mich Schritt für Schritt bewege und beobachte. Das Konzept dahinter ist einfach und mächtig: für jeden Schritt nehme ich die derzeitige Belohnung und addiere den geschätzten Return der Folgezustände hinzu. Ich kann dieses Update für jeden Zustand mithilfe der bereits geschätzten Returns machen (während ich mich bewege update ich also jeden Zustand).<br>
        <br>
        Am Anfang ist die Schätzung nicht so gut, also muss ich die Umgebung erkunden: verschiedene Aktionen ausprobieren, die erhaltenen Belohnungen beobachten und meine V-Werte häufig erneuern. Das Erkunden ist also sehr wichtig, dabei probiere ich (zufällige) Aktionen in vielen Zuständen aus. Um die Schätzung von V in den bereits gelernten Wegen zu verbessern und schneller zu lernen, macht es Sinn, die "greedy policy" zu verwenden und V zu aktualisieren. Das Gleichgewicht zwischen "zufällig" und "greedy" nennt man “Erkundung vs. Ausbeutung”, oder: "exploration vs. exploitation" auf Englisch. Du kannst mithilfe des Erkundungsreglers einstellen, wieviel ich bei jedem Lernschritt erkunden soll.<br>
        <br>
        Drückst du auf den Knopf "1 Episode", lerne ich einen Durchgang durch das Labyrinth. Siehst du, wie sich die V-Werte verändern? Lerne noch mehr! Beweg dich herum! Lern mehr und beobachte, wie sich die greedy policy verändert...`
        },
        qLearning: {
            title: 'Q-Learning und der Level-Editor',
            text: `Für mich ist es praktischer, die sogenannten Q-Werte statt die V-Werte zu aktualisieren. Die Q-Werte zeigen eine zu erwartende langfristige Belohnung, wenn ich in einem Zustand bin und eine gewisse Aktion wähle. Sie ist also nicht nur vom Zustand abhängig, sondern auch von der Aktion. Der Vorteil ist, dass ich einfacher entscheiden kann, welche Aktion die beste ist (diejenige mit dem höchsten Q-Wert) und ich kann so theoretisch auch in nicht-deterministische Umgebungen lernen. Nicht-deterministisch heißt, dass meine Bewegungen eine gewisse Wahrscheinlichkeit in sich tragen. Ich würde etwa mit derselben Aktion in einem gewissen Zustand nicht immer in den selben Folgezustand gehen.<br>
        <br>
        Es wurde (mathematisch) bewiesen, dass Q-Learning zur optimalen Strategie (die am besten die Belohnungen maximiert) für jedes Problem führt - zumindest bei bestimmten Bedingungen und einer seeehr langen Lernzeit. Das ist fantastisch! Eine Methode, um alle Probleme zu lösen, für jedes beliebige Labyrinth! Oder für andere Spiele (mit Zuständen, Aktionen und Belohnungen)...<br>
        <br>
        Versuch mal das Labyrinth mit dem Level-Editor zu verändern. Du kannst deine eigenen Wände bauen und auch "gefährliche Felder" einrichten, wie hier z.B. die Fallgrube.`
        },
        playground: {
            title: 'Spiel mit mir',
            text: `Ich bin ein Roboter, der mit einem mächtigen Q-Learning-Algorithmus ausgestattet ist. Mit dieser Methode kann ich lernen, indem ich ganz einfach herumlaufe, Belohnungen beobachte und die Strategie verändere, sodass ich langfristig so viele Belohnungen wie möglich bekomme. In diesem Fall führt es mich zum schnellsten Weg zur Ladestation!<br>
        <br>
        Beweg dich mit mir, versuch dich an verschiedenen Durchgängen und beobachte, wie ich meine V-Werte kartiere, um mich durch das Labyrinth zu navigieren (alle Optionen auf der rechten Seite). Im Tutorial findest du mehr Details zu all den Optionen und der Lernmethode. Du kannst es öffnen, indem du auf die kleinen Punkte unten klickst.<br>
        <br>
        In der KI-Forschung nennt man diese Weise zu lernen "Belohnendes Lernen" oder "Reinforcement Learning" auf Englisch. Sie ist eine fundamentale Methode des Maschinellen Lernen.`
        },
        intro: 'Reinforcement learning (RL) ist ein Gebiet des Maschinellen lernen, das sich damit befasst, wie Software-Agenten zu bestimmten Aktionen in einer Umgebung kommen, um eine kumulative Belohnung zu maximieren. Belohnendes Lernen ist eine der drei grundlegenden Paradigmen des Maschinellen Lernens, gemeinsam mit Überwachtem Lernen ("Supervised Learning") und Unüberwachtem Lernen ("Unsupervised Learning") (Wikipedia) Dieses Exponat zeigt, wie ein Roboter lernt, sich durch ein Labyrinth zu einer Ladestation zu navigieren bevor dessen Akku ausläuft. Am Anfang weiß der Roboter noch nichts, doch lernt er durch jede neue Aktion (Bewegung) und jeden Zustand (erreichte Position). Langsam beginnt er, ein Verständnis für das Labyrinth zu entwickeln, das es ihm ermöglicht, die Ladestation zu erreichen, bevor ihm die Energie ausgeht. Schließlich sollte er lernen, Umwege zu vermeiden und die Ladestation in der optimalen Anzahl von Schritten zu erreichen.',
        stateAction: "Dieser Roboter steht in einem Raum. Er kann über den Boden, aber nicht durch die Wände gehen. Er weiß immer, wo er ist und in welche Richtungen er sich bewegen kann, weiß aber nichts anderes über den Raum.",
        goal: "Der Roboter weiß nur, wo er sich selbst befindet und in welche Richtungen er sich bewegen kann. Kannst du ihm helfen, die Ladestation zu finden?",
        bestway: "Manchmal ist es möglich, das Ziel auf mehrere Arten zu erreichen. Wenn du nur begrenzte Energie hättest, wie würdest du versuchen, das Ziel hier zu erreichen?",
        localIntro: "Aber da ist ein Problem! Der Roboter kann nicht das ganze Labyrinth sehen. Er weiß nur, wo er selbst ist und in welche Richtung er sich bewegen kann. Kannst du ihm helfen, unter diesen Bedingungen die Ladestation erreichen? Verwende die Pfeiltasten, um den Roboter zu bewegen",

        goalReached: 'Der Roboter hat die Ladestation erreicht',
        outOfBattery: "Der Akku des Roboters ist ausgelaufen",

        ok: 'Ok',

        training: {
            training: 'Training',
            oneEpisode: '1 Episode',
            twentyEpisodes: '20 Episoden',
            unlearn: 'Verlernen',
            evaluate: 'Auswerten'
        },
        evaluation: {
            oneStep: 'Mach einen Schritt',
            greedyStep: 'Mach einen "greedy" Schritt',
        },
        info: {
            state: 'Zustand',
            actions: 'Aktionen',
            reinforcement: 'Belohnung',
            accumulated: 'Return',
        },
        controls: {
            discountFactor: 'Discount-Faktor',
            learningRate: 'Lernrate',
            exploration: 'Erkundung',
            learning: 'Lerne von Aktionen',
            showQvalue: 'Wie gut ist jede Position? (Werte)',
            showGreedy: 'Wohin soll ich gehen? ("Greedy Policy")',
            fog: 'Roboterperspektive'
        }
    },
}

export var Texts = AllTexts["de"];

function setLanguage(languageCode) {
    Texts = AllTexts[languageCode];
}