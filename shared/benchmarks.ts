export const BENCHMARKS = [
  {
    key: 'mmlu',
    label: 'MMLU',
    description: 'Knowledge breadth and multi-domain reasoning',
    accent: '220 82% 57%',
  },
  {
    key: 'hellaswag',
    label: 'HellaSwag',
    description: 'Commonsense completion and narrative understanding',
    accent: '194 82% 45%',
  },
  {
    key: 'truthfulqa',
    label: 'TruthfulQA',
    description: 'Resistance to common misconceptions',
    accent: '18 94% 60%',
  },
  {
    key: 'arc_challenge',
    label: 'ARC Challenge',
    description: 'Science reasoning under sparse cues',
    accent: '252 56% 62%',
  },
  {
    key: 'gsm8k',
    label: 'GSM8K',
    description: 'Grade-school math word problems',
    accent: '142 66% 40%',
  },
  {
    key: 'humaneval',
    label: 'HumanEval',
    description: 'Python code generation correctness',
    accent: '30 94% 54%',
  },
  {
    key: 'mbpp',
    label: 'MBPP',
    description: 'Beginner-friendly programming problems',
    accent: '338 78% 58%',
  },
  {
    key: 'livecodebench',
    label: 'LiveCodeBench',
    description: 'Recent competitive programming and execution tasks',
    accent: '276 65% 60%',
  },
] as const

export type BenchmarkKey = (typeof BENCHMARKS)[number]['key']

export const BENCHMARK_KEYS = BENCHMARKS.map((benchmark) => benchmark.key)