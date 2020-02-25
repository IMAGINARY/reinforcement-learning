import katex from 'katex';

export function renderEquation(machine) {
  // (1-lr) * Q[state, action] + lr * (reward + gamma * np.max(Q[new_state, :])
  const expression = `Q(s,a)\\leftarrow${(1-machine.lr).toFixed(2)}Q(s,a)+${machine.lr.toFixed(2)}(reward + ${machine.df.toFixed(2)}\\max_{a'}(Q(s_{new}, a'))`;
  const equationNode = document.getElementById('formula');
  katex.render(expression, equationNode, { displayMode: true } );
}