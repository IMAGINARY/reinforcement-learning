import { Texts } from "./language.js";

export const StateMgr = {
  init: {
    onEnterState: function () {
      var lightText = Texts.intro;
      this.$lightbox.popup(lightText, ["next"]).then((r) => this.changeState("local"));
    },
  },
  local: {
    components: ["local", "navi", "score"],
    navigation: {
      "reset robot": () => machine.reset_machine(),
      "continue": null,
    },
    onEnterState: function () {
      this.navigation.continue = () => this.changeState("global");
      var lightText = Texts.localIntro;
      this.$lightbox.popup(lightText, ["next"]);
    },
  },
  global: {
    components: ["global", "sliders", "plot", "navi", "score"],
    navigation: {
      "run 1 episode!": () => machine.run(1),
      "run 100 episodes!": () => machine.run(100),
      "auto step!": () => machine.auto_step(),
      "greedy step!": () => machine.greedy_step(),
      "reset machine": () => machine.reset_machine(),
    },
    onEnterState: function () {
      var lightText = Texts.globalIntro;
      this.$lightbox.popup(lightText, ["continue"]);
    },
  }
};
