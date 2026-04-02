export const BENCHMARKS = [
  {
    key: 'mmlu',
    label: 'MMLU',
    description: 'Knowledge breadth and multi-domain reasoning',
    descriptionZh: '多学科知识广度与综合推理能力',
    accent: '220 82% 57%',
  },
  {
    key: 'hellaswag',
    label: 'HellaSwag',
    description: 'Commonsense completion and narrative understanding',
    descriptionZh: '常识补全与叙事理解能力',
    accent: '194 82% 45%',
  },
  {
    key: 'truthfulqa',
    label: 'TruthfulQA',
    description: 'Resistance to common misconceptions',
    descriptionZh: '对常见误解与错误信念的抵抗能力',
    accent: '18 94% 60%',
  },
  {
    key: 'arc_challenge',
    label: 'ARC Challenge',
    description: 'Science reasoning under sparse cues',
    descriptionZh: '在稀疏线索下的科学推理能力',
    accent: '252 56% 62%',
  },
  {
    key: 'gsm8k',
    label: 'GSM8K',
    description: 'Grade-school math word problems',
    descriptionZh: '小学到初中层级的数学文字题能力',
    accent: '142 66% 40%',
  },
  {
    key: 'humaneval',
    label: 'HumanEval',
    description: 'Python code generation correctness',
    descriptionZh: 'Python 代码生成正确率',
    accent: '30 94% 54%',
  },
  {
    key: 'mbpp',
    label: 'MBPP',
    description: 'Beginner-friendly programming problems',
    descriptionZh: '基础编程题解答能力',
    accent: '338 78% 58%',
  },
  {
    key: 'livecodebench',
    label: 'LiveCodeBench',
    description: 'Recent competitive programming and execution tasks',
    descriptionZh: '近期编程竞赛与真实执行任务能力',
    accent: '276 65% 60%',
  },
] as const

export type BenchmarkKey = (typeof BENCHMARKS)[number]['key']

export const BENCHMARK_KEYS = BENCHMARKS.map((benchmark) => benchmark.key)