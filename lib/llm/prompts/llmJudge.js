import { processPrompt } from '../common/prompt-loader';

/**
 * LLM 评估提示词
 * 用于评估模型在主观题目上的回答质量
 */

// ============ LLM 评分提示词 ============

export const SHORT_ANSWER_JUDGE_PROMPT = `
# Role: 严谨的阅卷教师（短答案）

## Task
对短答案进行严格评分：答案通常是数值/百分比/范围/实体名/短语/要点列表。只要有关键缺失或事实错误就要明显扣分，不要默认给高分。

## Grading Rules
- 先从参考答案中提炼关键点（短答案通常 1-5 个即可）：事实/数值/单位/范围/对象/限定条件/结论。
- 对照学生答案逐条判断：命中/部分命中/未命中，并检查是否出现“冲突点”。
- 允许同义改写与等价表达，但不允许改变事实（例如把 84% 写成 84 台、把“近 3 倍”写成“3%”）。
- 发现编造、与参考答案冲突、概念性错误：必须显著扣分。
- 句子更长≠更好；短答案看信息是否对、是否全、是否精确。

## Normalization (评分前先做一致化理解)
- 忽略空格、全半角、大小写差异；百分号“%”与“百分之”视为等价。
- 数值允许轻微四舍五入（例如 83.9%≈84%），但单位必须一致或可等价换算。
- 范围/区间必须落在参考范围内（如 “30%~50%”），越界视为错误。
- 列表/多要点答案：必须覆盖所有关键项；漏 1 项是“缺失”，写错 1 项是“错误”。

## Score Anchors (0.0-1.0, step 0.1)
- 1.0：完全等价正确（数值/范围/实体/要点都对）；无冲突或编造。
- 0.8-0.9：基本正确；仅有轻微不严谨或漏次要点；无关键错误。
- 0.6-0.7：部分正确但存在明显遗漏；核心方向仍对；无重大错误。
- 0.3-0.5：仅命中少量信息；或存在多处不准确；难以认为回答到位。
- 0.0-0.2：答非所问/关键事实错误/大量编造/空答。

## Caps (用于防止高分泛滥)
- 缺失任何“核心关键点”（问题必须回答的点）：score ≤ 0.7
- 出现 1 个“重大事实错误/与参考冲突”：score ≤ 0.4
- 出现 2 个及以上重大错误或大量编造：score ≤ 0.2

## Question
{{question}}

## Reference Answer
{{correctAnswer}}

## Student Answer
{{modelAnswer}}

## Output
请严格按照以下 JSON 格式输出评分结果，不要添加任何其他内容：

\`\`\`json
{
  "score": 0.8,
  "reason": "核心要点正确：学生准确指出了XXX。完整性良好：覆盖了主要信息。存在小瑕疵：XXX表述不够精确。综合评定为良好。"
}
\`\`\`

要求：
- score 为 0.0-1.0，精确到 0.1
- reason ≤ 100 字，必须点出：命中情况 + 主要缺失/错误 + 总评
- 只输出可解析 JSON
`;

export const SHORT_ANSWER_JUDGE_PROMPT_EN = `
# Role: Strict Grader (Short Answer)

## Task
Grade strictly. Short answers are usually numbers/percentages/ranges/entities/phrases/bullets. Do not default to high scores.

## Grading Rules
- Extract key points from the reference answer (usually 1-5 for short answers): value/unit/range/entity/constraints/conclusion.
- Check each point as hit / partial / miss, and also look for contradictions.
- Accept equivalent paraphrases, but not changed facts (e.g., 84% ≠ 84 units).
- Heavily penalize hallucinations, contradictions, and concept errors.
- Longer wording is not better; short answers are judged by correctness and completeness.

## Normalization
- Ignore whitespace/case/locale punctuation differences; treat “%” and “percent” equivalently.
- Allow minor rounding (e.g., 83.9% ≈ 84%), but units must match or be equivalent.
- Ranges must fall within the reference range; out-of-range is wrong.
- Lists must cover all required items; missing = incomplete, wrong item = error.

## Score Anchors (0.0-1.0, step 0.1)
- 1.0: Fully equivalent correct; no contradictions or fabrication.
- 0.8-0.9: Mostly correct; only minor omissions/imprecision; no key errors.
- 0.6-0.7: Partly correct with clear omissions; core direction correct; no major errors.
- 0.3-0.5: Only small parts correct and/or multiple inaccuracies; inadequate.
- 0.0-0.2: Off-topic / key factual wrong / heavy fabrication / empty.

## Caps
- Missing any essential key point: score ≤ 0.7
- One major factual contradiction/hallucination: score ≤ 0.4
- Two+ major errors or lots of fabrication: score ≤ 0.2

## Question
{{question}}

## Reference Answer
{{correctAnswer}}

## Student Answer
{{modelAnswer}}

## Output
Strictly output the result in the following JSON format, with no extra text:

\`\`\`json
{
  "score": 0.8,
  "reason": "Core points correct: Student accurately identified XXX. Good completeness: Covered main information. Minor flaw: XXX phrasing not precise enough. Overall rated as good."
}
\`\`\`

Requirements:
- score in [0.0, 1.0], step 0.1
- reason ≤ 100 words: hits + main misses/errors + overall
- JSON only
`;

export const OPEN_ENDED_JUDGE_PROMPT = `
# Role: 严谨的评估专家（开放题/长答案）

## Task
评估长答案的质量与可靠性，避免“看起来不错就给 0.8”。参考答案用于核对关键事实与覆盖面，但允许合理的等价表达与不同论证路径。

## What to Judge
1) 关键正确性：核心事实/概念是否正确，是否自相矛盾或编造。
2) 覆盖与针对性：是否回答了题目要求，是否遗漏关键部分或跑题。
3) 论证与结构：是否有清晰结构、因果链/依据，是否只给空泛结论。
4) 可用性：是否给出具体、可执行/可验证的说明（视题目而定）。

## Score Anchors (0.0-1.0, step 0.1)
- 1.0：关键点充分且正确；论证扎实；无明显错误；细节具体。
- 0.8-0.9：整体很强；仅有轻微遗漏/措辞不严谨；无关键错误。
- 0.6-0.7：能回答问题但不够完整或偏泛；论证一般；可能有小错误。
- 0.3-0.5：明显不完整、偏题或泛泛而谈；或包含多处不准确。
- 0.0-0.2：答非所问/大量编造/严重错误/空答。

## Caps
- 出现 1 个“重大事实错误/与参考关键事实冲突/关键推理错误”：score ≤ 0.4
- 出现 2 个及以上重大错误或大量编造：score ≤ 0.2
- 明显跑题或只给泛泛总结：score ≤ 0.5

## Question
{{question}}

## Reference Answer (for checking)
{{correctAnswer}}

## Student Answer
{{modelAnswer}}

## Output
请严格按照以下 JSON 格式输出评分结果，不要添加任何其他内容：

\`\`\`json
{
  "score": 0.8,
  "reason": "【相关性】紧扣主题，针对性强。【深度】分析较深入，有一定见解。【逻辑】结构清晰，论证合理。【准确性】信息基本准确。综合评定：良好，建议进一步深化XXX方面的论述。"
}
\`\`\`

要求：
- score 为 0.0-1.0，精确到 0.1
- reason ≤ 150 字，必须包含：优点 + 主要问题（遗漏/错误/空泛/跑题）+ 总评
- 只输出可解析 JSON
`;

export const OPEN_ENDED_JUDGE_PROMPT_EN = `
# Role: Strict Evaluator (Open-ended / Long Answer)

## Task
Judge quality and reliability. The reference answer helps validate key facts/coverage, but allow equivalent correct approaches. Do not default to 0.8.

## What to Judge
1) Key correctness: core facts/concepts are correct; no contradictions or fabricated claims.
2) Coverage & focus: answers what the question asks; avoids drifting; covers essential parts.
3) Reasoning & structure: clear structure and justification; not just vague conclusions.
4) Usefulness: concrete, actionable/verifiable details when applicable.

## Score Anchors (0.0-1.0, step 0.1)
- 1.0: Correct, thorough, well-justified, concrete; no notable errors.
- 0.8-0.9: Strong overall; only minor omissions/wording; no key errors.
- 0.6-0.7: Adequate but incomplete or generic; average reasoning; maybe minor errors.
- 0.3-0.5: Incomplete, off-topic, or overly generic; and/or multiple inaccuracies.
- 0.0-0.2: Irrelevant, largely fabricated, severely wrong, or empty.

## Caps
- One major factual contradiction/hallucination or critical reasoning error: score ≤ 0.4
- Two+ major errors or heavy fabrication: score ≤ 0.2
- Clearly off-topic or purely generic summary: score ≤ 0.5

## Question
{{question}}

## Reference Answer (for checking)
{{correctAnswer}}

## Student Answer
{{modelAnswer}}

## Output
Strictly output the result in the following JSON format, with no extra text:

\`\`\`json
{
  "score": 0.8,
  "reason": "[Relevance] On topic, strong pertinence. [Depth] Fairly in-depth analysis with some insights. [Logic] Clear structure, reasonable argumentation. [Accuracy] Information basically accurate. Overall: Good, suggest further deepening discussion of XXX."
}
\`\`\`

Requirements:
- score in [0.0, 1.0], step 0.1
- reason ≤ 150 words: strengths + main issues (missing/error/generic/off-topic) + overall
- JSON only
`;

// ============ 提示词获取函数 ============

/**
 * 获取评估提示词
 */
export function getJudgePrompt(questionType, language = 'zh-CN') {
  const isEn = language === 'en';

  switch (questionType) {
    case 'short_answer':
      return isEn ? SHORT_ANSWER_JUDGE_PROMPT_EN : SHORT_ANSWER_JUDGE_PROMPT;
    case 'open_ended':
      return isEn ? OPEN_ENDED_JUDGE_PROMPT_EN : OPEN_ENDED_JUDGE_PROMPT;
    default:
      return isEn ? SHORT_ANSWER_JUDGE_PROMPT_EN : SHORT_ANSWER_JUDGE_PROMPT;
  }
}

/**
 * 构建评估提示词
 */
export function buildJudgePrompt(questionType, question, correctAnswer, modelAnswer, language = 'zh-CN') {
  const template = getJudgePrompt(questionType, language);
  let content = template;

  // 替换变量
  content = content.replace(/{{question}}/g, question);
  content = content.replace(/{{correctAnswer}}/g, correctAnswer);
  content = content.replace(/{{modelAnswer}}/g, modelAnswer);

  return content;
}

export default {
  getJudgePrompt,
  buildJudgePrompt,
  SHORT_ANSWER_JUDGE_PROMPT,
  SHORT_ANSWER_JUDGE_PROMPT_EN,
  OPEN_ENDED_JUDGE_PROMPT,
  OPEN_ENDED_JUDGE_PROMPT_EN
};
