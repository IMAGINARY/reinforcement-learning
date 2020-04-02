import katex from 'katex';

export function renderEquation(params) {
  // (1-lr) * Q[state, action] + lr * (reward + gamma * np.max(Q[new_state, :])
  const expression = `Q(s,a)\\leftarrow${(1-params.learningRate).toFixed(2)}Q(s,a)+${params.learningRate.toFixed(2)}(reward + ${params.discountFactor.toFixed(2)}\\max_{a'}(Q(s_{new}, a'))`;
  const equationNode = document.getElementById('formula');
  katex.render(expression, equationNode, { displayMode: true } );
}